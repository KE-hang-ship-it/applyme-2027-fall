import type {
  ApplicationRequirement,
  DataQualityDimension,
  DataQualityGrade,
  DataQualityIssue,
  DataQualityScore,
  DocumentRequirement,
  FieldVerificationV2,
  GRERequirement,
  OverallVerificationStatus,
  Program,
  ProgramSource,
  ProgramStatus,
  ProgramV2,
  ProgramVerificationField,
} from "../types/application";

const PLACEHOLDER_PATTERN =
  /待复核|待公布|待确认|暂无|not available|needs verification|n\/a|tbd|unknown/i;

const CRITICAL_VERIFICATION_FIELDS = [
  "programWebsite",
  "deadline",
  "gre",
  "letters",
  "tuition",
  "applicationLink",
] as const satisfies readonly ProgramVerificationField[];

export function isPlaceholderValue(value: unknown): boolean {
  return typeof value !== "string" || !value.trim() || PLACEHOLDER_PATTERN.test(value.trim());
}

export function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function documentRequirement(value: string): DocumentRequirement {
  if (isPlaceholderValue(value)) return { required: null, note: value };
  const count = value.match(/\d+/)?.[0];
  const notRequired = /不需要|不要求|not required/i.test(value);
  return {
    required: !notRequired,
    count: count ? Number(count) : undefined,
    note: value,
  };
}

function greRequirement(value: string): GRERequirement {
  if (isPlaceholderValue(value)) return { status: "unknown", note: value };
  if (/不接受|not accepted/i.test(value)) return { status: "not-accepted", note: value };
  if (/不要求|not required/i.test(value)) return { status: "not-required", note: value };
  if (/可选|optional/i.test(value)) return { status: "optional", note: value };
  return { status: "required", note: value };
}

export function classifyProgramStatus(program: Program): ProgramStatus {
  const degree = program.degree.trim().toLowerCase();
  const searchable = `${program.program} ${program.field}`.toLowerCase();

  if (degree === "phd" || degree.includes("doctor")) return "PHD";
  if (
    degree === "n/a" ||
    /暂无匹配的机械工程硕士|暂无匹配项目|no matching mechanical/i.test(searchable)
  ) {
    return "NOT_ME_PROGRAM";
  }

  const isMastersDegree =
    /^(ms|sm|mse|meng|mmeche|scm|msc|msc\(eng\)|mphil|mengsc|mpe|msme)$/i.test(program.degree);
  const isAcceptedField =
    /mechanical|mechatronic|robotic|automation|机械|机电|机器人|自动化/i.test(searchable);

  return isMastersDegree && isAcceptedField ? "ACTIVE" : "REVIEW";
}

export function resolveProgramSources(program: ProgramV2): ProgramSource {
  return {
    ...program.sources,
    programWebsite:
      program.sources?.programWebsite ??
      program.officialProgramUrl ??
      program.programUrl ??
      program.source,
    departmentWebsite:
      program.sources?.departmentWebsite ??
      program.officialDepartmentUrl ??
      program.departmentUrl,
    applicationWebsite:
      program.sources?.applicationWebsite ??
      program.applicationUrl,
    admissionRequirementSource:
      program.sources?.admissionRequirementSource ??
      program.admissionRequirementsUrl,
    tuitionSource:
      program.sources?.tuitionSource ??
      program.tuitionUrl ??
      program.tuitionReference?.sourceUrl,
    curriculumSource:
      program.sources?.curriculumSource ??
      program.curriculumUrl,
  };
}

export function resolveApplicationRequirement(program: ProgramV2): ApplicationRequirement {
  const current = program.applicationRequirements;
  return {
    ...current,
    deadline:
      current?.deadline !== undefined
        ? current.deadline
        : isPlaceholderValue(program.deadline)
          ? null
          : program.deadline,
    gre: current?.gre ?? greRequirement(program.gre),
    letters: current?.letters ?? documentRequirement(program.letters),
    cv: current?.cv ?? documentRequirement(program.cv),
    sop: current?.sop ?? documentRequirement(program.sop),
    credits:
      current?.credits !== undefined
        ? current.credits
        : isPlaceholderValue(program.credits)
          ? null
          : program.credits,
    duration:
      current?.duration !== undefined
        ? current.duration
        : isPlaceholderValue(program.duration)
          ? null
          : program.duration,
  };
}

export function toProgramV2(program: Program): ProgramV2 {
  const compatible = program as ProgramV2;
  return {
    ...program,
    schemaVersion: compatible.schemaVersion ?? 2,
    programStatus: compatible.programStatus ?? classifyProgramStatus(program),
    applicationRequirements: resolveApplicationRequirement(compatible),
    sources: resolveProgramSources(compatible),
  };
}

function verifiedWithSource(value?: FieldVerificationV2): boolean {
  return value?.status === "verified" && isValidHttpUrl(value.sourceUrl);
}

export function calculateOverallVerification(program: ProgramV2): OverallVerificationStatus {
  const sources = resolveProgramSources(program);
  const requirements = resolveApplicationRequirement(program);
  const fields = program.verificationV2?.fields ?? {};

  const fieldHasData: Record<(typeof CRITICAL_VERIFICATION_FIELDS)[number], boolean> = {
    programWebsite: isValidHttpUrl(sources.programWebsite),
    deadline: Boolean(requirements.deadline),
    gre: requirements.gre?.status !== undefined && requirements.gre.status !== "unknown",
    letters: requirements.letters?.required !== null && requirements.letters?.required !== undefined,
    tuition: Boolean(program.tuition?.amount != null && isValidHttpUrl(program.tuition.sourceUrl)),
    applicationLink: isValidHttpUrl(sources.applicationWebsite),
  };

  const complete = CRITICAL_VERIFICATION_FIELDS.filter(
    (field) => fieldHasData[field] && verifiedWithSource(fields[field]),
  ).length;

  if (complete === CRITICAL_VERIFICATION_FIELDS.length) return "VERIFIED";

  const evidenced = CRITICAL_VERIFICATION_FIELDS.filter((field) => {
    const verification = fields[field];
    return (
      fieldHasData[field] ||
      (verification !== undefined &&
        isValidHttpUrl(verification.sourceUrl) &&
        ["pending", "historical", "not-published"].includes(verification.status))
    );
  }).length;

  return evidenced >= Math.ceil(CRITICAL_VERIFICATION_FIELDS.length / 2)
    ? "PARTIAL"
    : "NEEDS_REVIEW";
}

function gradeFor(score: number): DataQualityGrade {
  if (score >= 90) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "D";
}

function dimension(
  name: DataQualityDimension["name"],
  score: number,
  maxScore: number,
  missingFields: string[],
): DataQualityDimension {
  return { name, score: Math.min(maxScore, Math.max(0, score)), maxScore, missingFields };
}

export function calculateDataQualityScore(input: Program | ProgramV2): DataQualityScore {
  const program = toProgramV2(input);
  const requirements = resolveApplicationRequirement(program);
  const sources = resolveProgramSources(program);
  const issues: DataQualityIssue[] = [];

  const basicMissing = [
    ["id", program.id],
    ["school", program.school],
    ["program", program.program],
    ["degree", program.degree],
    ["field", program.field],
    ["location", program.country ?? program.region],
    ["programStatus", program.programStatus],
  ].filter(([, value]) => isPlaceholderValue(value)).map(([field]) => String(field));
  const basic = 15 - basicMissing.length * 2;

  const applicationChecks: Array<[string, boolean, number]> = [
    ["deadline", Boolean(requirements.deadline), 6],
    ["gre", requirements.gre?.status !== "unknown", 3],
    ["toefl", Boolean(requirements.toefl), 3],
    ["ielts", Boolean(requirements.ielts), 3],
    ["letters", requirements.letters?.required != null, 2],
    ["cv", requirements.cv?.required != null, 1],
    ["sop", requirements.sop?.required != null, 2],
    ["applicationFee", Boolean(requirements.applicationFee), 2],
    ["credits", Boolean(requirements.credits), 1.5],
    ["duration", Boolean(requirements.duration), 1.5],
  ];
  const applicationMissing = applicationChecks.filter(([, present]) => !present).map(([field]) => field);
  const application = applicationChecks.reduce((score, [, present, weight]) => score + (present ? weight : 0), 0);

  const sourceChecks: Array<[string, boolean, number]> = [
    ["programWebsite", isValidHttpUrl(sources.programWebsite), 4],
    ["departmentWebsite", isValidHttpUrl(sources.departmentWebsite), 2],
    ["applicationWebsite", isValidHttpUrl(sources.applicationWebsite), 3],
    ["admissionRequirementSource", isValidHttpUrl(sources.admissionRequirementSource), 2],
    ["tuitionSource", isValidHttpUrl(sources.tuitionSource), 2],
    ["curriculumSource", isValidHttpUrl(sources.curriculumSource), 2],
  ];
  const sourceMissing = sourceChecks.filter(([, present]) => !present).map(([field]) => field);
  const sourceScore = sourceChecks.reduce((score, [, present, weight]) => score + (present ? weight : 0), 0);

  const tuitionChecks: Array<[string, boolean, number]> = [
    ["tuition.amount", program.tuition?.amount != null, 4],
    ["tuition.year", Boolean(program.tuition?.year), 2],
    ["tuition.billingBasis", Boolean(program.tuition?.billingBasis), 2],
    ["tuition.isInternationalStudent", program.tuition?.isInternationalStudent != null, 2],
    ["tuition.includesFees", program.tuition?.includesFees != null, 1],
    ["tuition.sourceUrl", isValidHttpUrl(program.tuition?.sourceUrl), 2],
    ["tuition.verificationStatus", Boolean(program.tuition?.verificationStatus), 2],
  ];
  const tuitionMissing = tuitionChecks.filter(([, present]) => !present).map(([field]) => field);
  const tuition = tuitionChecks.reduce((score, [, present, weight]) => score + (present ? weight : 0), 0);

  const verificationKeys: ProgramVerificationField[] = [
    "deadline", "gre", "toefl", "ielts", "letters", "tuition", "ranking", "curriculum",
  ];
  const verificationMissing: string[] = [];
  const verificationScore = verificationKeys.reduce((score, field) => {
    const item = program.verificationV2?.fields[field];
    if (!item) {
      verificationMissing.push(field);
      return score;
    }
    const sourced = isValidHttpUrl(item.sourceUrl);
    if (item.status === "verified" && sourced) return score + 2.5;
    if (item.status === "not-published" && sourced) return score + 2;
    if (item.status === "historical" && sourced) return score + 1.5;
    if (item.status === "pending" && sourced) return score + 1;
    return score + 0.5;
  }, 0);

  const insightChecks: Array<[string, boolean, number]> = [
    ["tracks", Boolean(program.insights?.tracks?.length ?? program.tracks.length), 2],
    ["curriculum", Boolean(program.insights?.curriculum?.length), 2],
    ["bestFit", Boolean(program.insights?.bestFit?.length), 1],
    ["notSuitableFor", Boolean(program.insights?.notSuitableFor?.length), 1],
    ["highlights", Boolean(program.insights?.highlights?.length), 1],
    ["riskFactors", Boolean(program.insights?.riskFactors?.length), 1],
    ["backgroundRequirement", Boolean(program.insights?.backgroundRequirement), 1],
    ["difficultyLevel", Boolean(program.insights?.difficultyLevel), 1],
  ];
  const insightMissing = insightChecks.filter(([, present]) => !present).map(([field]) => field);
  const insight = insightChecks.reduce((score, [, present, weight]) => score + (present ? weight : 0), 0);

  const dimensions = [
    dimension("basicInformation", basic, 15, basicMissing),
    dimension("applicationInformation", application, 25, applicationMissing),
    dimension("officialSources", sourceScore, 15, sourceMissing),
    dimension("tuition", tuition, 15, tuitionMissing),
    dimension("verification", verificationScore, 20, verificationMissing),
    dimension("programInsight", insight, 10, insightMissing),
  ];

  if (!program.school || !program.program) {
    issues.push({ field: "identity", severity: "critical", message: "Missing school or program name." });
  }
  if (!isValidHttpUrl(sources.programWebsite)) {
    issues.push({ field: "programWebsite", severity: "critical", message: "Missing valid program website." });
  }
  if (!requirements.deadline && program.verificationV2?.fields.deadline?.status !== "not-published") {
    issues.push({ field: "deadline", severity: "major", message: "Missing deadline without an evidenced not-published status." });
  }

  let total = Math.round(dimensions.reduce((sum, item) => sum + item.score, 0));
  let grade = gradeFor(total);
  if (!program.school || !program.program) {
    total = Math.min(total, 49);
    grade = "D";
  } else if (
    !isValidHttpUrl(sources.programWebsite) ||
    (!requirements.deadline && program.verificationV2?.fields.deadline?.status !== "not-published") ||
    program.programStatus === "REVIEW"
  ) {
    total = Math.min(total, 69);
    grade = gradeFor(total);
  }

  return {
    total,
    grade,
    dimensions,
    issues,
    calculatedAt: new Date().toISOString(),
    scoringVersion: "1.0.0",
  };
}
