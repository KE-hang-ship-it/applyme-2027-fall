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
export type VerificationState = "verified" | "pending" | "not-published" | "historical";
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
