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
  UNKNOWN_PROGRAM: { zh: "选校记录对应的项目不存在。", en: "The selected program could not be found." },
  MISSING_OFFICIAL_SOURCE: { zh: "该字段缺少绑定的官方来源。", en: "This field has no field-bound official source." },
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
  return Boolean(verification && !["not-published", "not-found"].includes(verification.status));
}

function verificationWarning(
  language: SnapshotLanguage,
  field: string,
  verification: FieldVerificationV2 | undefined,
  legacyId: string,
  canonicalProgramId: string | null,
  applicationCycle?: string,
): SnapshotWarning | null {
  if (!verification || verification.status === "verified") return null;
  if (verification.status === "historical" && field !== "deadline") return null;
  const code: SnapshotWarningCode =
    verification.status === "historical"
      ? "HISTORICAL_DEADLINE"
      : verification.status === "pending"
        ? "PENDING_VERIFICATION"
        : verification.status === "not-published"
          ? "NOT_PUBLISHED"
          : "NOT_FOUND";
  return warning(language, code, verification.status === "historical" ? "warning" : "info", "field", {
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
): SnapshotSource | null {
  if (!verification?.sourceUrl) return null;
  return {
    field,
    url: verification.sourceUrl,
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
    workExperience: structuredClone(profile?.workExperience ?? []),
    projects: structuredClone(profile?.projects ?? []),
    targetAreas: [...(profile?.targetAreas ?? [])],
    targetRegions: [...(profile?.targetRegions ?? [])],
    budget: profile?.budget ? { ...profile.budget } : undefined,
    degreePreferences: [...(profile?.preferredProgramType ?? [])],
  };
}

function fallbackDeadline(program: Program): SnapshotDeadline[] {
  const value = program.deadline?.trim();
  if (!value || /待|暂无|not published|n\/a|tbd/i.test(value)) return [];
  return [{ date: value, label: value, isCurrentCycle: false }];
}

function buildProgram(
  legacy: Program,
  selection: UserSelection,
  canonicalProgramId: string | null,
  language: SnapshotLanguage,
  applicationCycle: string,
  useV2: boolean,
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
        deadlines.push({
          ...round,
          applicationCycle: requirements.applicationCycle,
          verificationStatus: deadlineVerification.status,
          isCurrentCycle:
            deadlineVerification.status === "verified" &&
            sameApplicationCycle(requirements.applicationCycle, applicationCycle),
          sourceUrl: deadlineVerification.sourceUrl,
          lastVerifiedAt: deadlineVerification.lastVerifiedAt,
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
  const tuition: SnapshotTuition = tuitionUnavailable
    ? {
        amount: null,
        unavailable: true,
        verificationStatus: tuitionVerification?.status,
        sourceUrl: tuitionVerification?.sourceUrl ?? detail.tuition?.sourceUrl,
        lastVerifiedAt: tuitionVerification?.lastVerifiedAt,
        note: WARNING_MESSAGES.TUITION_UNAVAILABLE[language],
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
        }
      : { amount: null, unavailable: true };
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
    Object.entries(fields).map(([field, value]) => sourceFor(field, value)),
  );
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

  const program: PDFReportSnapshotProgram = {
    legacyId: legacy.id,
    canonicalProgramId,
    university: {
      name: detail.school,
      nameZh: detail.schoolZh,
      normalizedName: detail.normalizedSchoolName ?? detail.school.trim().toLowerCase(),
      city: detail.city,
      state: detail.state,
      country: detail.country,
      region: detail.region,
    },
    programName: detail.program,
    programNameZh: detail.programZh,
    degree: detail.degree,
    field: detail.field,
    category: selection.category,
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
    officialSources,
    verificationSummary: {
      overallStatus: calculateOverallVerification(detail),
      ...statusGroups,
      lastReviewedAt: detail.verificationV2?.lastReviewedAt,
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

  if (!input.userProfile) {
    warnings.push(warning(language, "MISSING_USER_PROFILE", "warning", "applicant"));
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
      generatedAt,
      language,
      applicationCycle,
      dataVerifiedThrough: dataDates.at(-1) ?? null,
      warnings: sortedWarnings,
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
