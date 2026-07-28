import type {
  FieldVerificationV2,
  Program,
  ProgramV2,
  ProgramVerificationField,
  UserProfile,
  UserSelection,
  VerificationState,
} from "../types/application";
import type {
  CreatePDFReportSnapshotInput,
  PDFReportSnapshot,
  PDFReportSnapshotProgram,
  SnapshotApplicant,
  SnapshotDeadline,
  SnapshotError,
  SnapshotLanguage,
  SnapshotResult,
  SnapshotSource,
  SnapshotTuition,
  SnapshotWarning,
  SnapshotWarningCode,
  SnapshotWarningSeverity,
} from "../types/pdf-report-snapshot";
import { adaptProgramToV2 } from "./program-v2-adapter";
import { calculateOverallVerification, toProgramV2 } from "./program-v2";
import { getProgramV2Ids } from "./program-v2-registry";
import {
  assessProfileCompleteness,
  classifySelection,
  describeProgramAttributes,
  fieldMeta,
  isOfficialUniversityUrl,
  normalizeLocation,
  sourceDomain,
} from "./report-data-quality";

const SPLIT_LEGACY_IDS = new Set(["princeton-mae", "uva-mae", "rice-me"]);
const CATEGORY_ORDER = { reach: 0, match: 1, safety: 2, unclassified: 3 } as const;
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2, unset: 3 } as const;
const SEVERITY_ORDER = { blocking: 0, warning: 1, info: 2 } as const;

const WARNING_MESSAGES: Record<
  SnapshotWarningCode,
  Record<SnapshotLanguage, string>
> = {
  HISTORICAL_DEADLINE: { zh: "截止日期来自历史申请周期。", en: "The deadline is from a historical application cycle." },
  PENDING_VERIFICATION: { zh: "该字段仍待官方确认。", en: "This field is pending official verification." },
  NOT_PUBLISHED: { zh: "官方尚未公布该字段。", en: "The field has not been published officially." },
  NOT_FOUND: { zh: "官方来源中未找到该字段。", en: "The field was not found in the official source." },
  REVIEW_PROGRAM: { zh: "该项目仍处于范围复核状态。", en: "This program remains under scope review." },
  TUITION_UNAVAILABLE: { zh: "未找到项目专属官方学费。", en: "No program-specific official tuition was found." },
  INCOMPLETE_REQUIREMENTS: { zh: "申请要求信息不完整。", en: "Application requirements are incomplete." },
  SPLIT_PROGRAM_UNRESOLVED: { zh: "该学校包含多个学位项目，尚未选择具体项目。", en: "This school has multiple degree records and no canonical program was selected." },
  LEGACY_ONLY_PROGRAM: { zh: "该项目目前仅有旧版数据。", en: "This program currently has legacy data only." },
  MISSING_USER_PROFILE: { zh: "尚未提供申请人画像。", en: "No applicant profile was provided." },
  INCOMPLETE_USER_PROFILE: { zh: "申请者画像不完整，报告已降级为候选项目清单。", en: "The applicant profile is incomplete; the report was downgraded to a candidate list." },
  UNKNOWN_PROGRAM: { zh: "选校记录对应的项目不存在。", en: "The selected program could not be found." },
  MISSING_OFFICIAL_SOURCE: { zh: "该字段缺少绑定的官方来源。", en: "This field has no field-bound official source." },
  FETCH_FAILED: { zh: "官方页面抓取或解析失败。", en: "The official page could not be fetched or parsed." },
  SOURCE_CONFLICT: { zh: "多个官方页面信息存在冲突，需要人工核验。", en: "Official sources conflict and require manual review." },
  LOCATION_CORRECTED: { zh: "地区字段存在错位，报告已按标准地点映射修正。", en: "A misplaced location field was corrected by the report mapping." },
  STALE_APPLICATION_CYCLE: { zh: "该信息仅适用于旧申请季，不作为当前申请季要求。", en: "This information applies to an older cycle and is not treated as current." },
};

function warning(
  language: SnapshotLanguage,
  code: SnapshotWarningCode,
  severity: SnapshotWarningSeverity,
  scope: SnapshotWarning["scope"],
  details: Omit<SnapshotWarning, "code" | "severity" | "scope" | "message"> = {},
): SnapshotWarning {
  return { code, severity, scope, message: WARNING_MESSAGES[code][language], ...details };
}

function isUsableVerification(
  verification: FieldVerificationV2 | undefined,
): boolean {
  return Boolean(
    verification &&
    !["not-published", "not-found", "fetch-failed", "needs-manual-review"].includes(verification.status),
  );
}

function verificationWarning(
  language: SnapshotLanguage,
  field: string,
  verification: FieldVerificationV2 | undefined,
  legacyId: string,
  canonicalProgramId: string | null,
  applicationCycle?: string,
): SnapshotWarning | null {
  if (
    !verification ||
    ["verified", "not-required", "optional", "waived"].includes(verification.status)
  ) return null;
  if (verification.status === "historical" && field !== "deadline") return null;
  const code: SnapshotWarningCode =
    verification.status === "historical"
      ? "HISTORICAL_DEADLINE"
      : verification.status === "fetch-failed"
        ? "FETCH_FAILED"
        : verification.status === "needs-manual-review"
          ? "SOURCE_CONFLICT"
      : verification.status === "pending"
        ? "PENDING_VERIFICATION"
        : verification.status === "not-published"
          ? "NOT_PUBLISHED"
          : "NOT_FOUND";
  const severity: SnapshotWarningSeverity =
    verification.status === "historical"
      ? "warning"
      : ["fetch-failed", "needs-manual-review"].includes(verification.status)
        ? "warning"
        : "info";
  return warning(language, code, severity, "field", {
    legacyId,
    canonicalProgramId,
    field,
    verificationStatus: verification.status,
    applicationCycle,
    sourceUrl: verification.sourceUrl,
  });
}

function sameApplicationCycle(left?: string, right?: string): boolean {
  if (!left || !right) return true;
  const leftYear = left.match(/\b20\d{2}\b/)?.[0];
  const rightYear = right.match(/\b20\d{2}\b/)?.[0];
  return leftYear && rightYear ? leftYear === rightYear : left === right;
}

function sourceFor(
  field: string,
  verification: FieldVerificationV2 | undefined,
  applicationCycle?: string,
): SnapshotSource | null {
  if (!verification?.sourceUrl) return null;
  const meta = fieldMeta({
    ...verification,
    applicationCycle,
  });
  return {
    field,
    url: verification.sourceUrl,
    domain: sourceDomain(verification.sourceUrl) ?? verification.sourceUrl,
    official: isOfficialUniversityUrl(verification.sourceUrl),
    applicationCycle,
    status: meta.status,
    confidence: meta.confidence,
    verificationStatus: verification.status,
    lastVerifiedAt: verification.lastVerifiedAt,
  };
}

function dedupeSources(sources: Array<SnapshotSource | null>): SnapshotSource[] {
  const unique = new Map<string, SnapshotSource>();
  for (const source of sources) {
    if (!source) continue;
    const key = `${source.field}\u0000${source.url}`;
    if (!unique.has(key)) unique.set(key, source);
  }
  return [...unique.values()].sort(
    (a, b) => a.field.localeCompare(b.field) || a.url.localeCompare(b.url),
  );
}

function applicant(profile?: UserProfile | null): SnapshotApplicant {
  const completion = assessProfileCompleteness(profile);
  return {
    profileAvailable: Boolean(profile),
    id: profile?.id,
    name: profile?.name,
    applicationYear: profile?.applicationYear,
    targetDegree: [...(profile?.targetDegree ?? [])],
    targetMajor: [...(profile?.targetMajor ?? [])],
    undergraduateSchool: profile?.undergraduateSchool,
    undergraduateMajor: profile?.undergraduateMajor,
    gpa: profile?.gpa ? { ...profile.gpa } : undefined,
    toefl: profile?.toefl ? { ...profile.toefl } : undefined,
    ielts: profile?.ielts ? { ...profile.ielts } : undefined,
    gre: profile?.gre ? { ...profile.gre } : undefined,
    researchExperience: structuredClone(profile?.researchExperience ?? []),
    internshipExperience: structuredClone(profile?.internshipExperience ?? []),
    workExperience: structuredClone(profile?.workExperience ?? []),
    projects: structuredClone(profile?.projects ?? []),
    targetAreas: [...(profile?.targetAreas ?? [])],
    targetRegions: [...(profile?.targetRegions ?? [])],
    budget: profile?.budget ? { ...profile.budget } : undefined,
    degreePreferences: [...(profile?.preferredProgramType ?? [])],
    completion,
  };
}

function fallbackDeadline(program: Program): SnapshotDeadline[] {
  const value = program.deadline?.trim();
  if (!value || /待|暂无|not published|n\/a|tbd/i.test(value)) return [];
  return [{
    date: value,
    label: value,
    isCurrentCycle: false,
    fieldMeta: fieldMeta({
      status: "historical",
      sourceUrl: program.admissionRequirementsUrl ?? program.source,
      applicationCycle: program.rankYear,
      lastVerifiedAt: program.lastVerifiedAt ?? program.lastVerified,
      note: "Legacy deadline retained only as historical reference.",
    }),
  }];
}

function buildProgram(
  legacy: Program,
  selection: UserSelection,
  canonicalProgramId: string | null,
  language: SnapshotLanguage,
  applicationCycle: string,
  useV2: boolean,
  profile?: UserProfile | null,
): { program: PDFReportSnapshotProgram; warnings: SnapshotWarning[] } {
  const detail: ProgramV2 = useV2 && canonicalProgramId
    ? adaptProgramToV2(legacy, canonicalProgramId)
    : toProgramV2(legacy);
  const fields = detail.verificationV2?.fields ?? {};
  const requirements = detail.applicationRequirements ?? {};
  const warnings: SnapshotWarning[] = [];
  const warnFor = (field: ProgramVerificationField, cycle?: string) => {
    const item = verificationWarning(
      language,
      field,
      fields[field],
      legacy.id,
      canonicalProgramId,
      cycle,
    );
    if (item) warnings.push(item);
  };

  const deadlines: SnapshotDeadline[] = [];
  const deadlineVerification = fields.deadline;
  if (useV2 && deadlineVerification) {
    warnFor("deadline", requirements.applicationCycle);
    if (isUsableVerification(deadlineVerification)) {
      const rounds = requirements.applicationRound?.length
        ? requirements.applicationRound
        : requirements.deadline
          ? [{ date: requirements.deadline }]
          : [];
      for (const round of rounds) {
        const meta = fieldMeta({
          ...deadlineVerification,
          applicationCycle: requirements.applicationCycle,
        });
        deadlines.push({
          ...round,
          applicationCycle: requirements.applicationCycle,
          verificationStatus: deadlineVerification.status,
          isCurrentCycle:
            deadlineVerification.status === "verified" &&
            sameApplicationCycle(requirements.applicationCycle, applicationCycle),
          sourceUrl: deadlineVerification.sourceUrl,
          lastVerifiedAt: deadlineVerification.lastVerifiedAt,
          fieldMeta: meta,
        });
      }
    }
  } else {
    deadlines.push(...fallbackDeadline(legacy));
  }

  const requiredFields: ProgramVerificationField[] = ["gre", "toefl", "ielts", "letters", "cv", "sop", "applicationFee"];
  for (const field of requiredFields) if (fields[field]) warnFor(field);
  const missingRequirements = requiredFields.filter((field) => {
    if (fields[field]?.status === "not-found" || fields[field]?.status === "not-published") return true;
    const key = field === "applicationFee" ? "applicationFee" : field;
    return requirements[key as keyof typeof requirements] == null;
  });
  if (missingRequirements.length) {
    warnings.push(warning(language, "INCOMPLETE_REQUIREMENTS", "warning", "program", {
      legacyId: legacy.id,
      canonicalProgramId,
      field: missingRequirements.join(","),
    }));
  }

  const tuitionVerification = fields.tuition;
  if (tuitionVerification) warnFor("tuition");
  const tuitionUnavailable =
    tuitionVerification?.status === "not-found" ||
    tuitionVerification?.status === "not-published" ||
    (useV2 && tuitionVerification !== undefined && detail.tuition?.amount == null);
  const tuitionMeta = fieldMeta({
    ...tuitionVerification,
    sourceUrl: tuitionVerification?.sourceUrl ?? detail.tuition?.sourceUrl,
    applicationCycle: detail.tuition?.year,
  });
  const tuition: SnapshotTuition = tuitionUnavailable
    ? {
        amount: null,
        unavailable: true,
        verificationStatus: tuitionVerification?.status,
        sourceUrl: tuitionVerification?.sourceUrl ?? detail.tuition?.sourceUrl,
        lastVerifiedAt: tuitionVerification?.lastVerifiedAt,
        note: WARNING_MESSAGES.TUITION_UNAVAILABLE[language],
        estimatedProgramTotal: null,
        fieldMeta: tuitionMeta,
      }
    : detail.tuition
      ? {
          amount: detail.tuition.amount,
          currency: detail.tuition.currency,
          year: detail.tuition.year,
          billingBasis: detail.tuition.billingBasis,
          isInternationalStudent: detail.tuition.isInternationalStudent,
          includesFees: detail.tuition.includesFees,
          displayText: detail.tuition.displayText,
          note: detail.tuition.note,
          verificationStatus: tuitionVerification?.status ?? detail.tuition.verificationStatus,
          sourceUrl: tuitionVerification?.sourceUrl ?? detail.tuition.sourceUrl,
          lastVerifiedAt: tuitionVerification?.lastVerifiedAt,
          unavailable: detail.tuition.amount == null,
          estimatedProgramTotal: detail.tuition.estimatedProgramTotal
            ? {
                amount: detail.tuition.estimatedProgramTotal.amount,
                currency: detail.tuition.estimatedProgramTotal.currency,
                displayText: detail.tuition.estimatedProgramTotal.displayText,
                status: tuitionMeta.status,
              }
            : null,
          fieldMeta: tuitionMeta,
        }
      : {
          amount: null,
          unavailable: true,
          estimatedProgramTotal: null,
          fieldMeta: tuitionMeta,
        };
  if (tuition.unavailable) {
    warnings.push(warning(language, "TUITION_UNAVAILABLE", "warning", "field", {
      legacyId: legacy.id,
      canonicalProgramId,
      field: "tuition",
      verificationStatus: tuition.verificationStatus,
      sourceUrl: tuition.sourceUrl,
    }));
  }

  if (detail.programStatus === "REVIEW") {
    warnings.push(warning(language, "REVIEW_PROGRAM", "blocking", "program", {
      legacyId: legacy.id,
      canonicalProgramId,
    }));
  }

  const officialSources = dedupeSources(
    Object.entries(fields).map(([field, value]) =>
      sourceFor(
        field,
        value,
        field === "deadline" ? requirements.applicationCycle : field === "tuition" ? detail.tuition?.year : undefined,
      ),
    ),
  );
  const fallbackProgramUrl =
    detail.sources?.programWebsite ??
    detail.officialProgramUrl ??
    detail.programUrl ??
    detail.source;
  if (fallbackProgramUrl && !officialSources.some((item) => item.url === fallbackProgramUrl)) {
    officialSources.push({
      field: "programWebsite",
      url: fallbackProgramUrl,
      domain: sourceDomain(fallbackProgramUrl) ?? fallbackProgramUrl,
      official: isOfficialUniversityUrl(fallbackProgramUrl),
      status: isOfficialUniversityUrl(fallbackProgramUrl) ? "verified" : "needs-manual-review",
      confidence: isOfficialUniversityUrl(fallbackProgramUrl) ? "high" : "low",
      verificationStatus: fields.programWebsite?.status,
      lastVerifiedAt: fields.programWebsite?.lastVerifiedAt ?? detail.lastVerifiedAt,
    });
  }
  if (!officialSources.length) {
    warnings.push(warning(language, "MISSING_OFFICIAL_SOURCE", "warning", "program", {
      legacyId: legacy.id,
      canonicalProgramId,
    }));
  }

  const statusGroups = {
    verifiedFields: [] as string[],
    historicalFields: [] as string[],
    pendingFields: [] as string[],
    unavailableFields: [] as string[],
  };
  for (const [field, value] of Object.entries(fields)) {
    if (value.status === "verified") statusGroups.verifiedFields.push(field);
    else if (value.status === "historical") statusGroups.historicalFields.push(field);
    else if (value.status === "pending") statusGroups.pendingFields.push(field);
    else statusGroups.unavailableFields.push(field);
  }
  for (const values of Object.values(statusGroups)) values.sort();
  const location = normalizeLocation(detail);
  if (location.corrected) {
    warnings.push(warning(language, "LOCATION_CORRECTED", "info", "program", {
      legacyId: legacy.id,
      canonicalProgramId,
      field: "location",
    }));
  }
  const categoryDecision = classifySelection(selection, profile, detail, language);
  const fieldMetaMap = Object.fromEntries(
    (
      [
        "applicationFee",
        "gre",
        "toefl",
        "ielts",
        "letters",
        "cv",
        "sop",
        "credits",
        "duration",
      ] as const
    ).map((field) => [
      field,
      fieldMeta({
        ...fields[field],
        applicationCycle: requirements.applicationCycle,
      }),
    ]),
  );
  const unmetRequirements: string[] = [];
  if (
    requirements.toefl?.required &&
    requirements.toefl.minimumScore != null &&
    (profile?.toefl?.score ?? -1) < requirements.toefl.minimumScore
  ) {
    unmetRequirements.push(
      language === "zh"
        ? `TOEFL 尚未达到已核实的最低 ${requirements.toefl.minimumScore} 分。`
        : `TOEFL does not yet meet the verified minimum of ${requirements.toefl.minimumScore}.`,
    );
  }
  if (
    requirements.ielts?.required &&
    requirements.ielts.minimumScore != null &&
    (profile?.ielts?.score ?? -1) < requirements.ielts.minimumScore
  ) {
    unmetRequirements.push(
      language === "zh"
        ? `IELTS 尚未达到已核实的最低 ${requirements.ielts.minimumScore} 分。`
        : `IELTS does not yet meet the verified minimum of ${requirements.ielts.minimumScore}.`,
    );
  }
  if (
    requirements.gre?.status === "required" &&
    !Object.values(profile?.gre ?? {}).some((value) => typeof value === "number")
  ) {
    unmetRequirements.push(language === "zh" ? "项目要求 GRE，画像中尚无完整 GRE 成绩。" : "GRE is required, but the profile has no complete GRE score.");
  }
  const nextActions = [
    ...unmetRequirements.map((item) => (language === "zh" ? `补齐：${item}` : `Address: ${item}`)),
    ...(selection.actionItems ?? []).filter((item) => !item.completed).map((item) => item.title),
  ];
  if (!nextActions.length) {
    nextActions.push(
      language === "zh"
        ? "提交前再次核对项目官网、申请入口和目标申请季截止日期。"
        : "Recheck the program website, application portal, and target-cycle deadline before submitting.",
    );
  }
  const attributes = describeProgramAttributes(detail, language);
  const verifiedCount = statusGroups.verifiedFields.length;
  const reviewedCount = Object.keys(fields).length;
  const verificationConfidence =
    verifiedCount >= Math.max(3, reviewedCount * 0.7)
      ? "high"
      : verifiedCount > 0
        ? "medium"
        : "low";

  const program: PDFReportSnapshotProgram = {
    legacyId: legacy.id,
    canonicalProgramId,
    university: {
      name: detail.school,
      nameZh: detail.schoolZh,
      normalizedName: detail.normalizedSchoolName ?? detail.school.trim().toLowerCase(),
      city: location.city,
      state: location.state,
      country: location.country,
      region: location.region,
    },
    programName: detail.program,
    programNameZh: detail.programZh,
    degree: detail.degree,
    field: detail.field,
    category: categoryDecision.value,
    categoryDecision,
    priority: selection.priority ?? "unset",
    programStatus: detail.programStatus ?? "REVIEW",
    whySelected: [...(selection.selectionReason ?? [])],
    userNotes: selection.userNote ?? selection.note ?? null,
    deadlineSummary: deadlines,
    admissionsRequirements: {
      applicationFee: requirements.applicationFee
        ? {
            amount: requirements.applicationFee.amount,
            currency: requirements.applicationFee.currency,
            displayText: requirements.applicationFee.displayText,
          }
        : null,
      gre: requirements.gre ?? null,
      toefl: requirements.toefl ?? null,
      ielts: requirements.ielts ?? null,
      letters: requirements.letters ?? null,
      cv: requirements.cv ?? null,
      sop: requirements.sop ?? null,
      credits: requirements.credits ?? null,
      duration: requirements.duration ?? null,
      fieldMeta: fieldMetaMap,
    },
    tuitionSummary: tuition,
    curriculumSummary: {
      tracks: structuredClone(detail.insights?.tracks ?? detail.tracks ?? []),
      curriculum: (detail.insights?.curriculum ?? []).map((group) => ({
        name: group.name,
        description: group.description,
        courses: group.courses.map((course) => ({
          code: course.code,
          name: course.name,
          description: course.description,
        })),
      })),
      specializations: (detail.insights?.specializations ?? []).map((item) => ({
        name: item.name,
        description: item.description,
      })),
      credits: requirements.credits ?? null,
      duration: requirements.duration ?? null,
    },
    highlights: [...(detail.insights?.highlights ?? [])],
    bestFit: [...(detail.insights?.bestFit ?? (detail.bestFit ? [detail.bestFit] : []))],
    riskFactors: [...(detail.insights?.riskFactors ?? [])],
    unmetRequirements,
    nextActions,
    programAttributes: attributes,
    officialSources,
    verificationSummary: {
      overallStatus: calculateOverallVerification(detail),
      ...statusGroups,
      lastReviewedAt: detail.verificationV2?.lastReviewedAt,
      confidence: verificationConfidence,
    },
    missingDataWarnings: warnings,
  };
  return { program, warnings };
}

function sortWarnings(items: SnapshotWarning[]): SnapshotWarning[] {
  return [...items].sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      a.code.localeCompare(b.code) ||
      (a.legacyId ?? "").localeCompare(b.legacyId ?? "") ||
      (a.field ?? "").localeCompare(b.field ?? ""),
  );
}

function defaultReportId(generatedAt: string): string {
  return `applyme-${generatedAt.replace(/\D/g, "")}`;
}

function jsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createPDFReportSnapshot(
  input: CreatePDFReportSnapshotInput,
): SnapshotResult {
  const language = input.language ?? "zh";
  const allowPartial = input.allowPartial ?? true;
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const applicationCycle =
    input.applicationCycle ?? input.userProfile?.applicationYear ?? "";
  const reportId = input.reportId ?? defaultReportId(generatedAt);
  const warnings: SnapshotWarning[] = [];
  const errors: SnapshotError[] = [];
  const programById = new Map(input.programs.map((program) => [program.id, program]));
  const outputPrograms: PDFReportSnapshotProgram[] = [];
  const profileCompletion = assessProfileCompleteness(input.userProfile);
  const reportMode = profileCompletion.complete ? "personalized" : "candidate-list";

  if (!input.userProfile) {
    warnings.push(warning(language, "MISSING_USER_PROFILE", "warning", "applicant"));
  } else if (!profileCompletion.complete) {
    warnings.push(warning(language, "INCOMPLETE_USER_PROFILE", "warning", "applicant", {
      field: profileCompletion.missingFields.join(","),
    }));
  }

  for (const selection of input.selections) {
    const legacy = programById.get(selection.programId);
    if (!legacy) {
      errors.push({
        code: "UNKNOWN_PROGRAM",
        message: WARNING_MESSAGES.UNKNOWN_PROGRAM[language],
        legacyId: selection.programId,
      });
      warnings.push(warning(language, "UNKNOWN_PROGRAM", "blocking", "program", {
        legacyId: selection.programId,
      }));
      continue;
    }

    const migratedIds = [...getProgramV2Ids(legacy.id)];
    const requestedCanonical = input.canonicalProgramSelections?.[legacy.id];
    let canonicalProgramId: string | null = null;
    let useV2 = false;

    if (SPLIT_LEGACY_IDS.has(legacy.id)) {
      if (!requestedCanonical) {
        warnings.push(warning(language, "SPLIT_PROGRAM_UNRESOLVED", "blocking", "program", {
          legacyId: legacy.id,
          canonicalProgramId: null,
        }));
      } else if (!migratedIds.includes(requestedCanonical)) {
        errors.push({
          code: "INVALID_CANONICAL_MAPPING",
          message: `Invalid canonical mapping for ${legacy.id}.`,
          legacyId: legacy.id,
          canonicalProgramId: requestedCanonical,
        });
      } else {
        canonicalProgramId = requestedCanonical;
        useV2 = true;
      }
    } else if (requestedCanonical && !migratedIds.includes(requestedCanonical)) {
      errors.push({
        code: "INVALID_CANONICAL_MAPPING",
        message: `Invalid canonical mapping for ${legacy.id}.`,
        legacyId: legacy.id,
        canonicalProgramId: requestedCanonical,
      });
    } else if (migratedIds.length === 1) {
      canonicalProgramId = requestedCanonical ?? migratedIds[0];
      useV2 = true;
    } else {
      warnings.push(warning(language, "LEGACY_ONLY_PROGRAM", "info", "program", {
        legacyId: legacy.id,
        canonicalProgramId: null,
      }));
    }

    const built = buildProgram(
      legacy,
      selection,
      canonicalProgramId,
      language,
      applicationCycle,
      useV2,
      input.userProfile,
    );
    outputPrograms.push(built.program);
    warnings.push(...built.warnings);
  }

  outputPrograms.sort(
    (a, b) =>
      CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] ||
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      a.university.normalizedName.localeCompare(b.university.normalizedName) ||
      (a.canonicalProgramId ?? "").localeCompare(b.canonicalProgramId ?? "") ||
      a.legacyId.localeCompare(b.legacyId),
  );
  const sortedWarnings = sortWarnings(warnings);
  const blocking = sortedWarnings.some((item) => item.severity === "blocking") || errors.length > 0;
  const dataDates = outputPrograms
    .map((program) => program.verificationSummary.lastReviewedAt)
    .filter((date): date is string => Boolean(date))
    .sort();
  const snapshot: PDFReportSnapshot = {
    reportMeta: {
      reportId,
      schemaVersion: "1.0",
      reportMode,
      title:
        language === "zh"
          ? reportMode === "personalized"
            ? "ApplyME 个性化选校参考报告"
            : "ApplyME 候选项目清单"
          : reportMode === "personalized"
            ? "ApplyME Personalized School Selection Reference"
            : "ApplyME Candidate Program List",
      generatedAt,
      language,
      applicationCycle,
      dataVerifiedThrough: dataDates.at(-1) ?? null,
      warnings: sortedWarnings,
      profileMissingFields: profileCompletion.missingFields,
    },
    applicant: applicant(input.userProfile),
    selectionSummary: {
      totalPrograms: outputPrograms.length,
      reachCount: outputPrograms.filter((item) => item.category === "reach").length,
      matchCount: outputPrograms.filter((item) => item.category === "match").length,
      safetyCount: outputPrograms.filter((item) => item.category === "safety").length,
      reviewCount: outputPrograms.filter((item) => item.programStatus === "REVIEW").length,
      missingDataCount: outputPrograms.filter((item) => item.missingDataWarnings.length > 0).length,
      historicalDataCount: outputPrograms.filter((item) =>
        item.missingDataWarnings.some((warningItem) => warningItem.code === "HISTORICAL_DEADLINE"),
      ).length,
      unclassifiedCount: outputPrograms.filter((item) => item.category === "unclassified").length,
    },
    programs: outputPrograms,
    reportWarnings: sortedWarnings,
  };

  const safeSnapshot = jsonSafe(snapshot);
  const safeWarnings = jsonSafe(sortedWarnings);
  const safeErrors = jsonSafe(errors);

  if (!allowPartial && (blocking || sortedWarnings.length > 0)) {
    errors.push({
      code: "PARTIAL_REPORT_NOT_ALLOWED",
      message:
        language === "zh"
          ? "报告包含未解决的数据问题，已禁止生成部分报告。"
          : "The report contains unresolved data issues and partial output is disabled.",
    });
    return {
      ok: false,
      snapshot: safeSnapshot,
      warnings: safeWarnings,
      errors: jsonSafe(errors),
      partial: true,
    };
  }
  if (errors.length && !allowPartial) {
    return {
      ok: false,
      snapshot: safeSnapshot,
      warnings: safeWarnings,
      errors: safeErrors,
      partial: true,
    };
  }
  return {
    ok: true,
    snapshot: safeSnapshot,
    warnings: safeWarnings,
    errors: safeErrors,
    partial: blocking || sortedWarnings.length > 0 || errors.length > 0,
  };
}
