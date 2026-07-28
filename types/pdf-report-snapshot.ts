import type {
  ApplicationDeadline,
  CurrencyCode,
  DocumentRequirement,
  GRERequirement,
  LanguageRequirement,
  Program,
  ProgramStatus,
  SelectionPriority,
  TuitionBillingBasis,
  UserProfile,
  UserSelection,
  VerificationState,
} from "./application";

export type SnapshotLanguage = "zh" | "en";

export type SnapshotWarningCode =
  | "HISTORICAL_DEADLINE"
  | "PENDING_VERIFICATION"
  | "NOT_PUBLISHED"
  | "NOT_FOUND"
  | "REVIEW_PROGRAM"
  | "TUITION_UNAVAILABLE"
  | "INCOMPLETE_REQUIREMENTS"
  | "SPLIT_PROGRAM_UNRESOLVED"
  | "LEGACY_ONLY_PROGRAM"
  | "MISSING_USER_PROFILE"
  | "UNKNOWN_PROGRAM"
  | "MISSING_OFFICIAL_SOURCE";

export type SnapshotWarningSeverity = "blocking" | "warning" | "info";

export type SnapshotWarning = {
  code: SnapshotWarningCode;
  severity: SnapshotWarningSeverity;
  scope: "report" | "applicant" | "program" | "field";
  message: string;
  legacyId?: string;
  canonicalProgramId?: string | null;
  field?: string;
  verificationStatus?: VerificationState;
  applicationCycle?: string;
  sourceUrl?: string;
};

export type SnapshotSource = {
  field: string;
  url: string;
  verificationStatus?: VerificationState;
  lastVerifiedAt?: string;
};

export type SnapshotDeadline = {
  date: string | null;
  label?: string;
  round?: string;
  deadlineType?: ApplicationDeadline["deadlineType"];
  intake?: string;
  applicationCycle?: string;
  verificationStatus?: VerificationState;
  isCurrentCycle: boolean;
  sourceUrl?: string;
  lastVerifiedAt?: string;
};

export type SnapshotRequirements = {
  applicationFee: {
    amount: number | null;
    currency?: CurrencyCode;
    displayText?: string;
  } | null;
  gre: GRERequirement | null;
  toefl: LanguageRequirement | null;
  ielts: LanguageRequirement | null;
  letters: DocumentRequirement | null;
  cv: DocumentRequirement | null;
  sop: DocumentRequirement | null;
  credits: string | null;
  duration: string | null;
};

export type SnapshotTuition = {
  amount: number | null;
  currency?: CurrencyCode;
  year?: string;
  billingBasis?: TuitionBillingBasis;
  isInternationalStudent?: boolean | null;
  includesFees?: boolean | null;
  displayText?: string;
  note?: string;
  verificationStatus?: VerificationState;
  sourceUrl?: string;
  lastVerifiedAt?: string;
  unavailable: boolean;
};

export type SnapshotApplicant = {
  profileAvailable: boolean;
  id?: string;
  name?: string;
  applicationYear?: string;
  targetDegree: string[];
  targetMajor: string[];
  undergraduateSchool?: string;
  undergraduateMajor?: string;
  gpa?: UserProfile["gpa"];
  toefl?: UserProfile["toefl"];
  ielts?: UserProfile["ielts"];
  gre?: UserProfile["gre"];
  researchExperience: NonNullable<UserProfile["researchExperience"]>;
  workExperience: NonNullable<UserProfile["workExperience"]>;
  projects: NonNullable<UserProfile["projects"]>;
  targetAreas: string[];
  targetRegions: NonNullable<UserProfile["targetRegions"]>;
  budget?: UserProfile["budget"];
  degreePreferences: NonNullable<UserProfile["preferredProgramType"]>;
};

export type PDFReportSnapshotProgram = {
  legacyId: string;
  canonicalProgramId: string | null;
  university: {
    name: string;
    nameZh?: string;
    normalizedName: string;
    city?: string;
    state?: string;
    country?: string;
    region?: string;
  };
  programName: string;
  programNameZh?: string;
  degree: string;
  field: string;
  category: UserSelection["category"];
  priority: SelectionPriority;
  programStatus: ProgramStatus;
  whySelected: string[];
  userNotes: string | null;
  deadlineSummary: SnapshotDeadline[];
  admissionsRequirements: SnapshotRequirements;
  tuitionSummary: SnapshotTuition;
  curriculumSummary: {
    tracks: Array<{ name: string; courses: string[] }>;
    curriculum: Array<{
      name: string;
      description?: string;
      courses: Array<{ code?: string; name: string; description?: string }>;
    }>;
    specializations: Array<{ name: string; description?: string }>;
    credits: string | null;
    duration: string | null;
  };
  highlights: string[];
  bestFit: string[];
  riskFactors: string[];
  officialSources: SnapshotSource[];
  verificationSummary: {
    overallStatus: "VERIFIED" | "PARTIAL" | "NEEDS_REVIEW";
    verifiedFields: string[];
    historicalFields: string[];
    pendingFields: string[];
    unavailableFields: string[];
    lastReviewedAt?: string;
  };
  missingDataWarnings: SnapshotWarning[];
};

export type PDFReportSnapshot = {
  reportMeta: {
    reportId: string;
    schemaVersion: "1.0";
    generatedAt: string;
    language: SnapshotLanguage;
    applicationCycle: string;
    dataVerifiedThrough: string | null;
    warnings: SnapshotWarning[];
  };
  applicant: SnapshotApplicant;
  selectionSummary: {
    totalPrograms: number;
    reachCount: number;
    matchCount: number;
    safetyCount: number;
    reviewCount: number;
    missingDataCount: number;
    historicalDataCount: number;
  };
  programs: PDFReportSnapshotProgram[];
  reportWarnings: SnapshotWarning[];
};

export type CreatePDFReportSnapshotInput = {
  userProfile?: UserProfile | null;
  selections: readonly UserSelection[];
  programs: readonly Program[];
  canonicalProgramSelections?: Readonly<Record<string, string>>;
  language?: SnapshotLanguage;
  applicationCycle?: string;
  generatedAt?: string;
  reportId?: string;
  allowPartial?: boolean;
};

export type SnapshotErrorCode =
  | "UNKNOWN_PROGRAM"
  | "INVALID_CANONICAL_MAPPING"
  | "PARTIAL_REPORT_NOT_ALLOWED"
  | "INVALID_INPUT";

export type SnapshotError = {
  code: SnapshotErrorCode;
  message: string;
  legacyId?: string;
  canonicalProgramId?: string;
};

export type SnapshotResult =
  | {
      ok: true;
      snapshot: PDFReportSnapshot;
      warnings: SnapshotWarning[];
      errors: SnapshotError[];
      partial: boolean;
    }
  | {
      ok: false;
      snapshot?: PDFReportSnapshot;
      warnings: SnapshotWarning[];
      errors: SnapshotError[];
      partial: true;
    };
