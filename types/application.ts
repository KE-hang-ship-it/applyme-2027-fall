export type Region = "美国" | "香港" | "加拿大" | "英国" | "澳大利亚";
export type VerificationStatus = "已核实" | "待复核";
export type Category = "Favorite" | "Dream" | "Target" | "Safety" | "Priority";
export type View = "dashboard" | "schools" | "favorites" | "schoolList" | "mine";
export type ThemeMode = "system" | "light" | "dark";
export type ChatMessage = { role: "assistant" | "user"; text: string; source?: string };
export type CalendarNote = { text: string; tag: string };
export type CostProfile = { tuition: string; shared: string; privateRoom: string; note: string };

export type SchoolListCategory = "reach" | "match" | "safety" | "unclassified";
export type SchoolListStatus = "considering" | "preparing" | "submitted" | "withdrawn";

export type SchoolListItem = {
  programId: string;
  category: SchoolListCategory;
  status: SchoolListStatus;
  note: string;
  addedAt: string;
};

export type SchoolListStats = {
  reach: number;
  match: number;
  safety: number;
  unclassified: number;
};

export type ProgramTrack = { name: string; courses: string[] };
export type Ranking = {
  source: "US News" | "QS";
  category: string;
  year: number;
  rank: number | null;
  verified: boolean;
  sourceUrl?: string;
  tied?: boolean;
  edition?: string;
  sourceType?: string;
  verificationStatus?: string;
};
export type VerificationState =
  | "verified"
  | "pending"
  | "not-published"
  | "historical"
  | "not-found";
export type FieldVerification = {
  status: VerificationState;
  lastVerifiedAt?: string;
  sourceUrl?: string;
  note?: string;
};
export type VerificationField = "programWebsite" | "deadline" | "gre" | "recommendations" | "cv" | "sop" | "credits" | "tuition" | "language" | "applicationLink";
export type TuitionReference = {
  amount: string;
  dataYear: string;
  billingBasis: "program" | "academic-year" | "credit" | "unknown";
  status: VerificationState;
  sourceUrl?: string;
};

export type Program = {
  id: string;
  school: string;
  schoolZh?: string;
  normalizedSchoolName?: string;
  campus?: string;
  city?: string;
  state?: string;
  country?: string;
  rank: number;
  program: string;
  programZh?: string;
  degree: string;
  region?: Region;
  field: string;
  category?: string;
  deadline: string;
  letters: string;
  cv: string;
  sop: string;
  gre: string;
  credits: string;
  duration: string;
  verified: VerificationStatus;
  source: string;
  tracks: ProgramTrack[];
  departmentUrl?: string;
  programUrl?: string;
  applicationUrl?: string;
  officialProgramUrl?: string;
  officialDepartmentUrl?: string;
  rankValue?: number;
  rankSource?: string;
  rankYear?: string;
  rankType?: string;
  rankUrl?: string;
  regionalOrder?: number;
  regionalOrderLabel?: string;
  heroImage?: string;
  heroAlt?: string;
  schoolSummary?: string;
  programSummary?: string;
  bestFit?: string;
  ranking?: Ranking;
  nationalUniversityRanking?: Ranking;
  mechanicalEngineeringRanking?: Ranking;
  verificationStatus?: string;
  lastVerified?: string;
  sourceNote?: string;
  verification?: Partial<Record<VerificationField, FieldVerification>>;
  tuitionReference?: TuitionReference;
  admissionRequirementsUrl?: string;
  tuitionUrl?: string;
  curriculumUrl?: string;
  lastVerifiedAt?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  heroImageCredit?: string;
  heroImageSourceUrl?: string;
  heroImagePosition?: string;
};

/**
 * Data-layer V2 types.
 *
 * Program remains the compatibility contract used by the current UI.
 * All V2 additions are optional so legacy records can be upgraded gradually.
 */
export type ProgramStatus = "ACTIVE" | "REVIEW" | "PHD" | "NOT_ME_PROGRAM";
export type OverallVerificationStatus = "VERIFIED" | "PARTIAL" | "NEEDS_REVIEW";
export type DifficultyLevel = "very-high" | "high" | "medium" | "moderate" | "unknown";
export type CurrencyCode = "USD" | "CAD" | "GBP" | "HKD" | "AUD" | "CNY" | "OTHER";
export type TuitionBillingBasis =
  | "program"
  | "academic-year"
  | "semester"
  | "quarter"
  | "credit"
  | "unit"
  | "unknown";

export type MoneyAmount = {
  amount: number | null;
  currency: CurrencyCode;
  displayText?: string;
};

export type DeadlineType =
  | "priority"
  | "final"
  | "rolling"
  | "international"
  | "domestic"
  | "funding"
  | "unknown";

export type ApplicationDeadline = {
  date: string | null;
  label?: string;
  round?: string;
  deadlineType?: DeadlineType;
  intake?: string;
  isPriority?: boolean;
  isRolling?: boolean;
};

export type LanguageRequirement = {
  required: boolean | null;
  minimumScore?: number | null;
  recommendedScore?: number | null;
  subscoreRequirements?: Record<string, number>;
  waiverAvailable?: boolean | null;
  note?: string;
};

export type GRERequirement = {
  status: "required" | "optional" | "not-required" | "not-accepted" | "unknown";
  minimumScore?: number | null;
  recommendedScore?: number | null;
  note?: string;
};

export type DocumentRequirement = {
  required: boolean | null;
  count?: number | null;
  note?: string;
};

export type ApplicationRequirement = {
  deadline?: string | null;
  applicationRound?: ApplicationDeadline[];
  applicationFee?: MoneyAmount | null;
  gre?: GRERequirement;
  toefl?: LanguageRequirement;
  ielts?: LanguageRequirement;
  letters?: DocumentRequirement;
  cv?: DocumentRequirement;
  sop?: DocumentRequirement;
  credits?: string | null;
  duration?: string | null;
  intake?: string[];
  applicationCycle?: string;
};

export type CurriculumCourse = {
  code?: string;
  name: string;
  description?: string;
  credits?: number | null;
  required?: boolean;
  sourceUrl?: string;
};

export type CurriculumGroup = {
  name: string;
  description?: string;
  courses: CurriculumCourse[];
};

export type ProgramSpecialization = {
  id?: string;
  name: string;
  description?: string;
  courses?: CurriculumCourse[];
  sourceUrl?: string;
};

export type ProgramInsight = {
  tracks?: ProgramTrack[];
  curriculum?: CurriculumGroup[];
  specializations?: ProgramSpecialization[];
  bestFit?: string[];
  notSuitableFor?: string[];
  highlights?: string[];
  riskFactors?: string[];
  backgroundRequirement?: {
    preferredMajors?: string[];
    acceptedRelatedMajors?: string[];
    prerequisiteCourses?: string[];
    acceptsNonEngineeringBackground?: boolean | null;
    researchPreferred?: boolean | null;
    workExperiencePreferred?: boolean | null;
    note?: string;
  };
  difficultyLevel?: DifficultyLevel;
  schoolSummary?: string;
  programSummary?: string;
};

export type TuitionInfo = {
  amount: number | null;
  currency: CurrencyCode;
  year: string;
  billingBasis: TuitionBillingBasis;
  isInternationalStudent: boolean | null;
  includesFees: boolean | null;
  sourceUrl: string;
  verificationStatus: VerificationState;
  note?: string;
  displayText?: string;
  estimatedCredits?: number | null;
  estimatedProgramTotal?: MoneyAmount | null;
};

export type ProgramSource = {
  programWebsite?: string;
  departmentWebsite?: string;
  applicationWebsite?: string;
  admissionRequirementSource?: string;
  tuitionSource?: string;
  curriculumSource?: string;
  rankingSources?: Array<{
    type: "national" | "subject" | "regional" | "other";
    publisher: string;
    year?: string;
    sourceUrl: string;
  }>;
  additionalSources?: Array<{
    label: string;
    sourceUrl: string;
  }>;
};

export type FieldVerificationV2 = {
  status: VerificationState;
  lastVerifiedAt?: string;
  sourceUrl?: string;
  note?: string;
};

export type ProgramVerificationField =
  | "programWebsite"
  | "deadline"
  | "applicationFee"
  | "gre"
  | "toefl"
  | "ielts"
  | "letters"
  | "cv"
  | "sop"
  | "credits"
  | "duration"
  | "tuition"
  | "ranking"
  | "curriculum"
  | "specializations"
  | "bestFit"
  | "highlights"
  | "riskFactors"
  | "backgroundRequirement"
  | "applicationLink";

export type ProgramVerification = {
  fields: Partial<Record<ProgramVerificationField, FieldVerificationV2>>;
  overallStatus?: OverallVerificationStatus;
  lastReviewedAt?: string;
  reviewedBy?: string;
  note?: string;
};

export interface ProgramV2 extends Program {
  schemaVersion?: 2;
  programStatus?: ProgramStatus;
  applicationRequirements?: ApplicationRequirement;
  insights?: ProgramInsight;
  tuition?: TuitionInfo;
  sources?: ProgramSource;
  verificationV2?: ProgramVerification;
  dataMetadata?: {
    createdAt?: string;
    updatedAt?: string;
    lastReviewedAt?: string;
    dataOwner?: string;
    sourceLanguage?: string;
    migrationVersion?: string;
  };
}

export type UserScore = {
  score: number | null;
  date?: string;
  note?: string;
};

export type GREScore = {
  verbal?: number | null;
  quantitative?: number | null;
  analyticalWriting?: number | null;
  total?: number | null;
  date?: string;
  note?: string;
};

export type UserExperience = {
  title: string;
  organization?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  skills?: string[];
  outcome?: string;
};

export type UserProject = {
  title: string;
  role?: string;
  description?: string;
  skills?: string[];
  result?: string;
  link?: string;
};

export type UserProfile = {
  id?: string;
  name?: string;
  applicationYear: string;
  targetDegree: string[];
  targetMajor: string[];
  undergraduateSchool?: string;
  undergraduateMajor?: string;
  gpa?: {
    value: number | null;
    scale: number | null;
    convertedFourPointGPA?: number | null;
    note?: string;
  };
  toefl?: UserScore;
  ielts?: UserScore;
  gre?: GREScore;
  researchExperience?: UserExperience[];
  workExperience?: UserExperience[];
  projects?: UserProject[];
  targetAreas?: string[];
  targetRegions?: Region[];
  budget?: {
    amount: number | null;
    currency: CurrencyCode;
    period: "program" | "academic-year" | "year" | "month";
    includesLivingCost?: boolean;
    note?: string;
  };
  preferredProgramType?: Array<"coursework" | "research" | "professional" | "thesis" | "non-thesis">;
  careerGoal?: string;
  additionalNotes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SelectionPriority = "high" | "medium" | "low" | "unset";
export type UserSelectionStatus =
  | SchoolListStatus
  | "admitted"
  | "rejected"
  | "waitlisted";

export type SelectionActionItem = {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  note?: string;
  createdAt?: string;
};

export interface UserSelection extends Omit<SchoolListItem, "status"> {
  status: UserSelectionStatus;
  priority?: SelectionPriority;
  selectionReason?: string[];
  userNote?: string;
  riskAssessment?: string[];
  actionItems?: SelectionActionItem[];
  updatedAt?: string;
}

export type DataQualityGrade = "A" | "B" | "C" | "D";
export type DataQualityDimensionName =
  | "basicInformation"
  | "applicationInformation"
  | "officialSources"
  | "tuition"
  | "verification"
  | "programInsight";

export type DataQualityIssue = {
  field: string;
  severity: "critical" | "major" | "minor";
  message: string;
};

export type DataQualityDimension = {
  name: DataQualityDimensionName;
  score: number;
  maxScore: number;
  missingFields: string[];
};

export type DataQualityScore = {
  total: number;
  grade: DataQualityGrade;
  dimensions: DataQualityDimension[];
  issues: DataQualityIssue[];
  calculatedAt: string;
  scoringVersion: string;
};

export type PDFProgramSource = {
  label: string;
  url: string;
  lastVerifiedAt?: string;
  verificationStatus?: VerificationState;
};

export type PDFProgramRequirements = {
  deadline?: string | null;
  applicationRounds?: ApplicationDeadline[];
  applicationFee?: MoneyAmount | null;
  gre?: GRERequirement;
  toefl?: LanguageRequirement;
  ielts?: LanguageRequirement;
  letters?: DocumentRequirement;
  cv?: DocumentRequirement;
  sop?: DocumentRequirement;
  credits?: string | null;
  duration?: string | null;
};

export type PDFProgramCostEstimate = {
  tuition?: TuitionInfo;
  livingCost?: {
    amount: MoneyAmount | null;
    period: "month" | "academic-year" | "program";
    sourceUrl?: string;
    isRegionalEstimate: boolean;
    note?: string;
  };
  totalEstimate?: MoneyAmount | null;
  note?: string;
};

export type PDFSelectedProgram = {
  programId: string;
  programInfo: {
    school: string;
    schoolZh?: string;
    program: string;
    programZh?: string;
    degree: string;
    field: string;
    location?: string;
    programStatus?: ProgramStatus;
  };
  selection: {
    category: SchoolListCategory;
    priority?: SelectionPriority;
    userNote?: string;
    actionItems?: SelectionActionItem[];
  };
  programSummary?: string;
  highlights?: string[];
  whyRecommended?: string[];
  riskAnalysis?: string[];
  difficultyLevel?: DifficultyLevel;
  deadline?: string | null;
  costEstimate?: PDFProgramCostEstimate;
  requirements?: PDFProgramRequirements;
  sources: PDFProgramSource[];
  verificationStatus: OverallVerificationStatus;
  dataQualityScore?: DataQualityScore;
  programLastUpdatedAt?: string;
  snapshotCreatedAt: string;
};

export type ApplicationStrategy = {
  reachCount: number;
  matchCount: number;
  safetyCount: number;
  unclassifiedCount: number;
  balanceAssessment?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendedActions?: string[];
  deadlineSummary?: Array<{
    programId: string;
    school: string;
    deadline: string | null;
  }>;
  budgetSummary?: {
    currency: CurrencyCode;
    minimumEstimatedTotal?: number | null;
    maximumEstimatedTotal?: number | null;
    note?: string;
  };
};

export type PDFReport = {
  schemaVersion: 1;
  reportId: string;
  createdAt: string;
  title: string;
  applicationCycle: string;
  language: "zh" | "en";
  userProfile: UserProfile;
  selectedPrograms: PDFSelectedProgram[];
  applicationStrategy: ApplicationStrategy;
  summary: {
    overview: string;
    keyStrengths?: string[];
    keyRisks?: string[];
    nextSteps?: string[];
    disclaimer?: string;
  };
  reportMetadata: {
    generatorVersion: string;
    programDataVersion?: string;
    totalPrograms: number;
    verifiedPrograms: number;
    partialPrograms: number;
    needsReviewPrograms: number;
  };
};
