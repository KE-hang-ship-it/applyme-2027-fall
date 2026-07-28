import type {
  GRERequirement,
  Program,
  ProgramV2,
  SchoolListCategory,
  UserProfile,
  UserSelection,
  VerificationState,
} from "@/types/application";
import type {
  SnapshotConfidence,
  SnapshotDataStatus,
  SnapshotFieldMeta,
  SnapshotLanguage,
} from "@/types/pdf-report-snapshot";

const COUNTRY_ALIASES: Record<string, string> = {
  美国: "United States",
  "united states": "United States",
  usa: "United States",
  us: "United States",
  加拿大: "Canada",
  canada: "Canada",
  英国: "United Kingdom",
  "united kingdom": "United Kingdom",
  uk: "United Kingdom",
  香港: "Hong Kong",
  "hong kong": "Hong Kong",
  澳大利亚: "Australia",
  australia: "Australia",
};

const REGION_COUNTRY: Record<string, string> = {
  美国: "United States",
  加拿大: "Canada",
  英国: "United Kingdom",
  香港: "Hong Kong",
  澳大利亚: "Australia",
};

const KNOWN_LOCATIONS: Record<string, { city: string; state?: string; country: string }> = {
  "virginia polytechnic institute and state university": {
    city: "Blacksburg",
    state: "Virginia",
    country: "United States",
  },
};

const PROFILE_FIELDS = [
  "gpa",
  "undergraduateSchool",
  "undergraduateMajor",
  "languageScore",
  "gre",
  "researchExperience",
  "internshipOrWorkExperience",
  "targetMajor",
  "targetDegree",
  "budget",
  "targetRegions",
] as const;

function hasScore(score: { score?: number | null } | undefined) {
  return typeof score?.score === "number";
}

function hasGre(profile: UserProfile) {
  return Object.values(profile.gre ?? {}).some((value) => typeof value === "number");
}

export function assessProfileCompleteness(profile?: UserProfile | null) {
  if (!profile) {
    return {
      complete: false,
      presentFields: [] as string[],
      missingFields: [...PROFILE_FIELDS],
      completionRate: 0,
    };
  }
  const checks: Record<(typeof PROFILE_FIELDS)[number], boolean> = {
    gpa: typeof profile.gpa?.value === "number",
    undergraduateSchool: Boolean(profile.undergraduateSchool?.trim()),
    undergraduateMajor: Boolean(profile.undergraduateMajor?.trim()),
    languageScore: hasScore(profile.toefl) || hasScore(profile.ielts),
    gre: hasGre(profile),
    researchExperience: Boolean(profile.researchExperience?.length),
    internshipOrWorkExperience: Boolean(profile.internshipExperience?.length || profile.workExperience?.length),
    targetMajor: Boolean(profile.targetMajor?.length),
    targetDegree: Boolean(profile.targetDegree?.length),
    budget: typeof profile.budget?.amount === "number",
    targetRegions: Boolean(profile.targetRegions?.length),
  };
  const presentFields = PROFILE_FIELDS.filter((field) => checks[field]);
  const missingFields = PROFILE_FIELDS.filter((field) => !checks[field]);
  return {
    complete: missingFields.length === 0,
    presentFields,
    missingFields,
    completionRate: Math.round((presentFields.length / PROFILE_FIELDS.length) * 100),
  };
}

export function normalizeLocation(program: Program | ProgramV2) {
  const known = KNOWN_LOCATIONS[(program.normalizedSchoolName ?? program.school).trim().toLowerCase()];
  const rawCountry = program.country?.trim();
  const rawState = program.state?.trim();
  const region = program.region?.trim();
  const stateLooksLikeCountry = rawState ? Boolean(COUNTRY_ALIASES[rawState.toLowerCase()] ?? COUNTRY_ALIASES[rawState]) : false;
  const country =
    known?.country ??
    (rawCountry ? COUNTRY_ALIASES[rawCountry.toLowerCase()] ?? COUNTRY_ALIASES[rawCountry] ?? rawCountry : undefined) ??
    (region ? REGION_COUNTRY[region] : undefined);
  return {
    city: known?.city ?? program.city,
    state: known?.state ?? (stateLooksLikeCountry ? undefined : rawState),
    country,
    region,
    corrected: Boolean(known || stateLooksLikeCountry),
  };
}

export function isOfficialUniversityUrl(value?: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !/(wikipedia|usnews|topuniversities|mastersportal|gradschools)\./i.test(url.hostname);
  } catch {
    return false;
  }
}

export function sourceDomain(value?: string) {
  if (!value) return undefined;
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function mapVerificationStatus(
  status: VerificationState | undefined,
  note?: string,
): SnapshotDataStatus {
  const text = (note ?? "").toLowerCase();
  if (/fetch|抓取失败|解析失败/.test(text)) return "fetch-failed";
  if (/conflict|冲突|人工/.test(text)) return "needs-manual-review";
  if (/waiv|豁免/.test(text)) return "waived";
  if (/optional|可选/.test(text)) return "optional";
  if (/not required|不要求/.test(text)) return "not-required";
  switch (status) {
    case "verified":
      return "verified";
    case "not-required":
      return "not-required";
    case "optional":
      return "optional";
    case "waived":
      return "waived";
    case "fetch-failed":
      return "fetch-failed";
    case "needs-manual-review":
      return "needs-manual-review";
    case "not-published":
      return "not-yet-published";
    case "not-found":
      return "not-found";
    case "historical":
      return "historical-reference";
    case "pending":
    default:
      return "needs-manual-review";
  }
}

export function fieldMeta(input: {
  status?: VerificationState;
  note?: string;
  sourceUrl?: string;
  applicationCycle?: string;
  lastVerifiedAt?: string;
}): SnapshotFieldMeta {
  const status = mapVerificationStatus(input.status, input.note);
  const official = isOfficialUniversityUrl(input.sourceUrl);
  const confidence: SnapshotConfidence =
    status === "verified" && official
      ? "high"
      : ["fetch-failed", "needs-manual-review"].includes(status) || !official
        ? "low"
        : "medium";
  return {
    status,
    confidence,
    sourceUrl: input.sourceUrl,
    sourceDomain: sourceDomain(input.sourceUrl),
    applicationCycle: input.applicationCycle,
    lastVerifiedAt: input.lastVerifiedAt,
    note: input.note,
  };
}

function normalizedDegree(value: string) {
  return value.toUpperCase().replace(/[.\s]/g, "");
}

export function describeProgramAttributes(program: ProgramV2, language: SnapshotLanguage) {
  const degree = normalizedDegree(program.degree);
  const degreeType = degree.includes("MENG") || degree.includes("MME") ? "MENG" : degree.includes("MS") || degree.includes("SM") || degree.includes("SCM") ? "MS" : "OTHER";
  const corpus = [
    program.program,
    program.programZh,
    program.insights?.programSummary,
    ...(program.insights?.highlights ?? []),
  ].filter(Boolean).join(" ").toLowerCase();
  const hasNonThesis = /non[-\s]?thesis|coursework only|无论文/.test(corpus);
  const hasThesis = /\bthesis\b|论文方向/.test(corpus);
  const thesisMode = hasNonThesis && hasThesis
    ? "both"
    : hasNonThesis
      ? "non-thesis"
      : hasThesis
        ? "thesis"
        : "not-confirmed";
  const orientation =
    degreeType === "MENG"
      ? "professional"
      : /research|科研/.test(corpus)
        ? "research"
        : /coursework|授课/.test(corpus)
          ? "coursework"
          : "not-confirmed";
  const explanation = language === "zh"
    ? degreeType === "MENG"
      ? "MEng/专业型硕士通常更强调课程与职业实践；是否含论文选项仍以该项目官网为准。"
      : degreeType === "MS"
        ? "MS/理学硕士可能包含研究或论文路径；当前报告只陈述官网已确认的培养属性。"
        : "学位培养属性尚未从项目官网确认。"
    : degreeType === "MENG"
      ? "MEng/professional degrees usually emphasize coursework and practice; thesis availability still requires official confirmation."
      : degreeType === "MS"
        ? "MS degrees may offer research or thesis paths; this report only states attributes confirmed by the program."
        : "The program orientation has not been confirmed from the official website.";
  return { degreeType, thesisMode, orientation, explanation } as const;
}

function gpaOnFourPoint(profile: UserProfile) {
  if (typeof profile.gpa?.convertedFourPointGPA === "number") return profile.gpa.convertedFourPointGPA;
  if (typeof profile.gpa?.value !== "number" || typeof profile.gpa.scale !== "number" || profile.gpa.scale <= 0) return null;
  return (profile.gpa.value / profile.gpa.scale) * 4;
}

function languageRequirementMet(profile: UserProfile, program: ProgramV2) {
  const toefl = program.applicationRequirements?.toefl;
  const ielts = program.applicationRequirements?.ielts;
  const toeflMet = toefl?.minimumScore == null || (profile.toefl?.score ?? -1) >= toefl.minimumScore;
  const ieltsMet = ielts?.minimumScore == null || (profile.ielts?.score ?? -1) >= ielts.minimumScore;
  return toeflMet || ieltsMet;
}

function greRisk(profile: UserProfile, gre?: GRERequirement) {
  if (!gre || gre.status !== "required") return false;
  return !hasGre(profile);
}

export function classifySelection(
  selection: UserSelection,
  profile: UserProfile | null | undefined,
  program: ProgramV2,
  language: SnapshotLanguage,
): {
  value: SchoolListCategory;
  origin: "user" | "rule" | "unclassified";
  referenceOnly: true;
  rationale: string[];
} {
  if (selection.category !== "unclassified") {
    return {
      value: selection.category,
      origin: "user",
      referenceOnly: true,
      rationale: [language === "zh" ? "沿用用户在选校名单中设置的分类。" : "Uses the category selected by the user."],
    };
  }
  const completeness = assessProfileCompleteness(profile);
  if (!profile || !completeness.complete) {
    return {
      value: "unclassified",
      origin: "unclassified",
      referenceOnly: true,
      rationale: [language === "zh" ? "申请者画像不完整，未进行个性化分类。" : "Applicant profile is incomplete, so no personalized category was assigned."],
    };
  }

  let risk = 0;
  const rationale: string[] = [];
  const gpa = gpaOnFourPoint(profile);
  const difficulty = program.insights?.difficultyLevel ?? "unknown";
  if (difficulty === "very-high") {
    risk += 3;
    rationale.push(language === "zh" ? "项目竞争强度标记为很高。" : "Program difficulty is marked very high.");
  } else if (difficulty === "high") {
    risk += 2;
    rationale.push(language === "zh" ? "项目竞争强度标记为高。" : "Program difficulty is marked high.");
  } else if (difficulty === "medium" || difficulty === "moderate") {
    risk += 1;
  } else {
    risk += 1;
    rationale.push(language === "zh" ? "项目竞争强度缺少可靠量化数据，采用保守的匹配档处理。" : "Verified selectivity evidence is limited, so the rule uses a conservative Match baseline.");
  }
  if (gpa != null && gpa < 3.3) {
    risk += 2;
    rationale.push(language === "zh" ? "GPA 与高竞争项目相比偏弱。" : "GPA is relatively weak for competitive programs.");
  } else if (gpa != null && gpa >= 3.7) {
    risk -= 1;
    rationale.push(language === "zh" ? "GPA 为申请提供正向支持。" : "GPA provides positive academic support.");
  }
  if (!languageRequirementMet(profile, program)) {
    risk += 3;
    rationale.push(language === "zh" ? "当前语言成绩未满足已知最低要求。" : "Current language score does not meet a known minimum.");
  }
  if (greRisk(profile, program.applicationRequirements?.gre)) {
    risk += 2;
    rationale.push(language === "zh" ? "项目要求 GRE，但画像中没有完整 GRE 成绩。" : "GRE is required but the profile lacks a complete GRE score.");
  }
  if (program.programStatus === "REVIEW") {
    risk += 2;
    rationale.push(language === "zh" ? "项目范围或要求仍需人工复核。" : "Program scope or requirements still need manual review.");
  }
  const targets = [...profile.targetMajor, ...(profile.targetAreas ?? [])].join(" ").toLowerCase();
  const programText = `${program.program} ${program.field} ${(program.insights?.specializations ?? []).map(item => item.name).join(" ")}`.toLowerCase();
  if (targets && !targets.split(/[,;/，、\s]+/).filter(term => term.length > 2).some(term => programText.includes(term))) {
    risk += 1;
    rationale.push(language === "zh" ? "画像中的目标方向与当前已确认项目方向匹配证据较弱。" : "Verified evidence of alignment with the applicant's target area is limited.");
  }
  if (["high", "very-high"].includes(difficulty) && !profile.researchExperience?.length) {
    risk += 1;
    rationale.push(language === "zh" ? "高竞争项目通常更看重学术或科研准备，画像中的科研经历较弱。" : "Research preparation is limited for a highly competitive program.");
  }
  const value: SchoolListCategory = risk >= 3 ? "reach" : risk >= 1 ? "match" : "safety";
  rationale.push(
    language === "zh"
      ? "该分类是基于已核实硬性要求与画像匹配的参考判断，不代表录取概率。"
      : "This is a reference judgment based on verified requirements and profile fit, not an admission probability.",
  );
  return { value, origin: "rule", referenceOnly: true, rationale };
}

export function statusLabel(status: SnapshotDataStatus, language: SnapshotLanguage) {
  const labels: Record<SnapshotDataStatus, { zh: string; en: string }> = {
    verified: { zh: "已核实", en: "Verified" },
    "not-required": { zh: "官网明确不要求", en: "Not required" },
    optional: { zh: "官网明确可选", en: "Optional" },
    waived: { zh: "符合条件可豁免", en: "Waived when eligible" },
    "not-yet-published": { zh: "目标申请季尚未公布", en: "Not yet published" },
    "not-found": { zh: "在指定官方页面未找到", en: "Not found" },
    "fetch-failed": { zh: "抓取或解析失败", en: "Fetch failed" },
    "needs-manual-review": { zh: "信息冲突，需人工核验", en: "Needs manual review" },
    "historical-reference": { zh: "历史申请季参考", en: "Historical reference" },
  };
  return labels[status][language];
}
