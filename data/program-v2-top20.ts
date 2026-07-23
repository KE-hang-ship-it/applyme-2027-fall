import type {
  ApplicationRequirement,
  ProgramInsight,
  ProgramStatus,
  ProgramV2,
  TuitionInfo,
  VerificationState,
} from "../types/application";

export type VerifiedOverrideField<T = unknown> = {
  value: T;
  status: VerificationState;
  sourceUrl: string;
  lastVerifiedAt: string;
  note?: string;
};

export type ProgramV2Override = {
  id: string;
  legacyId: string;
  school: string;
  program: string;
  degree: string;
  programStatus: ProgramStatus;
  data: Partial<ProgramV2>;
  verification: Record<string, VerifiedOverrideField>;
};

const VERIFIED_AT = "2026-07-23";

function field<T>(
  value: T,
  status: VerificationState,
  sourceUrl: string,
  note?: string,
): VerifiedOverrideField<T> {
  return { value, status, sourceUrl, lastVerifiedAt: VERIFIED_AT, ...(note ? { note } : {}) };
}

type CoreData = {
  school: string;
  schoolZh: string;
  program: string;
  programZh: string;
  degree: string;
  field: string;
  country: string;
  state: string;
  city: string;
  programStatus: ProgramStatus;
};

function coreVerification(
  data: CoreData,
  sourceUrl: string,
): Record<string, VerifiedOverrideField> {
  return {
    school: field(data.school, "verified", sourceUrl),
    schoolZh: field(data.schoolZh, "verified", sourceUrl),
    program: field(data.program, "verified", sourceUrl),
    programZh: field(data.programZh, "verified", sourceUrl),
    degree: field(data.degree, "verified", sourceUrl),
    field: field(data.field, "verified", sourceUrl),
    country: field(data.country, "verified", sourceUrl),
    state: field(data.state, "verified", sourceUrl),
    city: field(data.city, "verified", sourceUrl),
    programStatus: field(data.programStatus, "verified", sourceUrl),
  };
}

function notFoundTuition(currency: TuitionInfo["currency"], sourceUrl: string): TuitionInfo {
  return {
    amount: null,
    currency,
    year: "2027",
    billingBasis: "unknown",
    isInternationalStudent: null,
    includesFees: null,
    sourceUrl,
    verificationStatus: "not-found",
    note: "No program-specific official tuition amount was located on the checked official source.",
  };
}

function tuitionVerification(sourceUrl: string): VerifiedOverrideField<null> {
  return field(
    null,
    "not-found",
    sourceUrl,
    "No program-specific official tuition amount was located.",
  );
}

function makeOverride(args: {
  id: string;
  legacyId: string;
  core: CoreData;
  sourceUrl: string;
  applicationRequirements: ApplicationRequirement;
  insights: ProgramInsight;
  tuition: TuitionInfo;
  sources: NonNullable<ProgramV2["sources"]>;
  verification: Record<string, VerifiedOverrideField>;
}): ProgramV2Override {
  const applicationRoundVerification: Record<string, VerifiedOverrideField> = {};
  if (
    args.applicationRequirements.applicationRound &&
    !args.verification.applicationRound &&
    args.verification.deadline
  ) {
    applicationRoundVerification.applicationRound = field(
      args.applicationRequirements.applicationRound,
      args.verification.deadline.status,
      args.verification.deadline.sourceUrl,
      args.verification.deadline.note,
    );
  }

  return {
    id: args.id,
    legacyId: args.legacyId,
    school: args.core.school,
    program: args.core.program,
    degree: args.core.degree,
    programStatus: args.core.programStatus,
    data: {
      id: args.id,
      schemaVersion: 2,
      ...args.core,
      normalizedSchoolName: args.core.school,
      applicationRequirements: args.applicationRequirements,
      insights: args.insights,
      tuition: args.tuition,
      sources: args.sources,
      dataMetadata: {
        updatedAt: VERIFIED_AT,
        lastReviewedAt: VERIFIED_AT,
        migrationVersion: "top20-2026-07-23",
        dataOwner: "ApplyME",
      },
    },
    verification: {
      ...coreVerification(args.core, args.sourceUrl),
      ...applicationRoundVerification,
      ...args.verification,
    },
  };
}

const princetonProgram =
  "https://gradschool.princeton.edu/academics/degrees-requirements/fields-study/mechanical-and-aerospace-engineering";
const princetonAdmissions = "https://mae.princeton.edu/graduate/admissions";

const princetonCore = {
  school: "Princeton University",
  schoolZh: "普林斯顿大学",
  program: "Mechanical and Aerospace Engineering",
  programZh: "机械与航空航天工程",
  field: "Mechanical and Aerospace Engineering",
  country: "United States",
  state: "New Jersey",
  city: "Princeton",
  programStatus: "ACTIVE" as const,
};

const princetonSpecializations = [
  { name: "Applied Physics" },
  { name: "Biomechanics and Biomaterials" },
  { name: "Control, Robotics and Dynamical Systems" },
  { name: "Fluid Mechanics" },
  { name: "Materials Science" },
  { name: "Propulsion and Energy" },
];

const princetonMse = makeOverride({
  id: "princeton-mae-mse",
  legacyId: "princeton-mae",
  core: { ...princetonCore, degree: "MSE" },
  sourceUrl: princetonProgram,
  applicationRequirements: {
    deadline: null,
    applicationRound: [
      {
        date: "2025-12-01",
        label: "Fall 2026 final deadline",
        deadlineType: "final",
        intake: "Fall 2026",
      },
    ],
    applicationFee: { amount: 75, currency: "USD", displayText: "$75" },
    gre: { status: "not-accepted" },
    credits: "8 graded courses plus thesis",
    duration: "2 years",
    intake: ["Fall"],
    applicationCycle: "Fall 2026",
  },
  insights: {
    specializations: princetonSpecializations,
    bestFit: ["Students seeking a research-oriented master's degree with a thesis"],
    highlights: ["Eight graded courses plus an MSE thesis"],
    riskFactors: ["Fall 2027 application dates and requirements have not yet been verified"],
  },
  tuition: notFoundTuition("USD", princetonProgram),
  sources: {
    programWebsite: princetonProgram,
    departmentWebsite: "https://mae.princeton.edu/",
    applicationWebsite: "https://gradschool.princeton.edu/admission/applying-princeton/apply",
    admissionRequirementSource: princetonAdmissions,
    tuitionSource: princetonProgram,
    curriculumSource: princetonProgram,
  },
  verification: {
    deadline: field("2025-12-01", "historical", princetonProgram),
    applicationFee: field(75, "historical", princetonProgram),
    gre: field("not-accepted", "historical", princetonProgram),
    credits: field("8 graded courses plus thesis", "verified", princetonProgram),
    duration: field("2 years", "verified", princetonProgram),
    specializations: field(princetonSpecializations, "verified", princetonProgram),
    bestFit: field(
      ["Students seeking a research-oriented master's degree with a thesis"],
      "verified",
      princetonProgram,
    ),
    highlights: field(["Eight graded courses plus an MSE thesis"], "verified", princetonProgram),
    riskFactors: field(
      ["Fall 2027 application dates and requirements have not yet been verified"],
      "pending",
      princetonAdmissions,
    ),
    tuition: tuitionVerification(princetonProgram),
  },
});

const princetonMeng = makeOverride({
  id: "princeton-mae-meng",
  legacyId: "princeton-mae",
  core: { ...princetonCore, degree: "MEng" },
  sourceUrl: princetonProgram,
  applicationRequirements: {
    deadline: null,
    applicationRound: [
      {
        date: "2025-12-01",
        label: "Fall 2026 final deadline",
        deadlineType: "final",
        intake: "Fall 2026",
      },
    ],
    applicationFee: { amount: 75, currency: "USD", displayText: "$75" },
    gre: { status: "not-accepted" },
    duration: "1 year",
    intake: ["Fall"],
    applicationCycle: "Fall 2026",
  },
  insights: {
    specializations: princetonSpecializations,
    bestFit: ["Students seeking a one-year coursework-oriented engineering master's degree"],
    highlights: ["One-year MEng route"],
    riskFactors: [
      "Fall 2027 application dates and requirements have not yet been verified",
      "External financial support expectations must be reviewed before applying",
    ],
  },
  tuition: notFoundTuition("USD", princetonProgram),
  sources: {
    programWebsite: princetonProgram,
    departmentWebsite: "https://mae.princeton.edu/",
    applicationWebsite: "https://gradschool.princeton.edu/admission/applying-princeton/apply",
    admissionRequirementSource: princetonAdmissions,
    tuitionSource: princetonProgram,
    curriculumSource: princetonProgram,
  },
  verification: {
    deadline: field("2025-12-01", "historical", princetonProgram),
    applicationFee: field(75, "historical", princetonProgram),
    gre: field("not-accepted", "historical", princetonProgram),
    duration: field("1 year", "verified", princetonProgram),
    specializations: field(princetonSpecializations, "verified", princetonProgram),
    bestFit: field(
      ["Students seeking a one-year coursework-oriented engineering master's degree"],
      "verified",
      princetonProgram,
    ),
    highlights: field(["One-year MEng route"], "verified", princetonProgram),
    riskFactors: field(
      [
        "Fall 2027 application dates and requirements have not yet been verified",
        "External financial support expectations must be reviewed before applying",
      ],
      "pending",
      princetonProgram,
    ),
    tuition: tuitionVerification(princetonProgram),
  },
});

const upennCatalog = "https://catalog.upenn.edu/graduate/programs/robotics-mse/";
const upennGrasp = "https://www.grasp.upenn.edu/academics/masters/";
const upennCore: CoreData = {
  school: "University of Pennsylvania",
  schoolZh: "宾夕法尼亚大学",
  program: "Robotics",
  programZh: "机器人学",
  degree: "MSE",
  field: "Robotics",
  country: "United States",
  state: "Pennsylvania",
  city: "Philadelphia",
  programStatus: "ACTIVE",
};
const upennSpecializations = [
  { name: "Robotics" },
  { name: "Vision and Perception" },
  { name: "Control and Automation" },
  { name: "Machine Learning" },
];
const upenn = makeOverride({
  id: "upenn-robotics-mse",
  legacyId: "upenn-robotics",
  core: upennCore,
  sourceUrl: upennCatalog,
  applicationRequirements: {
    deadline: null,
    gre: { status: "unknown", note: "Pending current official program confirmation" },
    toefl: { required: null },
    ielts: { required: null },
    letters: { required: null },
    cv: { required: null },
    sop: { required: null },
  },
  insights: {
    specializations: upennSpecializations,
    bestFit: ["Students seeking interdisciplinary robotics training across perception and control"],
    highlights: ["Administered with GRASP robotics resources"],
    riskFactors: ["Current-cycle application requirements require separate official confirmation"],
  },
  tuition: notFoundTuition("USD", upennCatalog),
  sources: {
    programWebsite: upennCatalog,
    departmentWebsite: upennGrasp,
    applicationWebsite: "https://gradadm.seas.upenn.edu/apply/",
    admissionRequirementSource: upennGrasp,
    tuitionSource: upennCatalog,
    curriculumSource: upennCatalog,
  },
  verification: {
    deadline: field(null, "pending", upennGrasp),
    gre: field(null, "pending", upennGrasp),
    toefl: field(null, "pending", upennGrasp),
    ielts: field(null, "pending", upennGrasp),
    letters: field(null, "pending", upennGrasp),
    cv: field(null, "pending", upennGrasp),
    sop: field(null, "pending", upennGrasp),
    specializations: field(upennSpecializations, "verified", upennCatalog),
    bestFit: field(
      ["Students seeking interdisciplinary robotics training across perception and control"],
      "verified",
      upennCatalog,
    ),
    highlights: field(["Administered with GRASP robotics resources"], "verified", upennGrasp),
    riskFactors: field(
      ["Current-cycle application requirements require separate official confirmation"],
      "pending",
      upennGrasp,
    ),
    tuition: tuitionVerification(upennCatalog),
  },
});

const brownProgram =
  "https://graduateprograms.brown.edu/graduate-program/mechanical-engineering-and-applied-mechanics-scm";
const brownCore: CoreData = {
  school: "Brown University",
  schoolZh: "布朗大学",
  program: "Mechanical Engineering and Applied Mechanics",
  programZh: "机械工程与应用力学",
  degree: "Sc.M.",
  field: "Mechanical Engineering",
  country: "United States",
  state: "Rhode Island",
  city: "Providence",
  programStatus: "ACTIVE",
};
const brown = makeOverride({
  id: "brown-meam-scm",
  legacyId: "brown-me",
  core: brownCore,
  sourceUrl: brownProgram,
  applicationRequirements: {
    deadline: null,
    applicationRound: [
      {
        date: "2026-02-01",
        label: "Fall 2026 priority deadline",
        deadlineType: "priority",
        intake: "Fall 2026",
        isPriority: true,
      },
      {
        date: "2026-04-01",
        label: "Fall 2026 final deadline",
        deadlineType: "final",
        intake: "Fall 2026",
      },
    ],
    gre: { status: "optional", note: "Recommended" },
    letters: { required: true, count: 3 },
    cv: { required: true },
    sop: { required: true, note: "1,000-1,500 words" },
    credits: "8 courses",
    duration: "1-2 years",
    applicationCycle: "Fall 2026",
  },
  insights: {
    specializations: [
      { name: "Thesis" },
      { name: "Non-thesis" },
      { name: "Professional track" },
    ],
    bestFit: ["Students who want flexibility between thesis, coursework and professional experience"],
    highlights: ["Thesis, non-thesis and professional options"],
    riskFactors: ["Fall 2027 deadlines and language-score minimums require confirmation"],
  },
  tuition: notFoundTuition("USD", brownProgram),
  sources: {
    programWebsite: brownProgram,
    departmentWebsite: "https://engineering.brown.edu/",
    applicationWebsite: brownProgram,
    admissionRequirementSource: brownProgram,
    tuitionSource: brownProgram,
    curriculumSource: brownProgram,
  },
  verification: {
    deadline: field("2026-04-01", "historical", brownProgram),
    applicationRound: field(
      [
        { date: "2026-02-01", deadlineType: "priority" },
        { date: "2026-04-01", deadlineType: "final" },
      ],
      "historical",
      brownProgram,
    ),
    gre: field("recommended", "historical", brownProgram),
    letters: field(3, "historical", brownProgram),
    cv: field(true, "historical", brownProgram),
    sop: field("1,000-1,500 words", "historical", brownProgram),
    credits: field("8 courses", "verified", brownProgram),
    duration: field("1-2 years", "verified", brownProgram),
    specializations: field(["Thesis", "Non-thesis", "Professional track"], "verified", brownProgram),
    bestFit: field(
      ["Students who want flexibility between thesis, coursework and professional experience"],
      "verified",
      brownProgram,
    ),
    highlights: field(["Thesis, non-thesis and professional options"], "verified", brownProgram),
    riskFactors: field(
      ["Fall 2027 deadlines and language-score minimums require confirmation"],
      "pending",
      brownProgram,
    ),
    tuition: tuitionVerification(brownProgram),
  },
});

const berkeleyAdmissions = "https://me.berkeley.edu/graduate/meng-admissions/";
const berkeleyCurriculum =
  "https://me.berkeley.edu/graduate/meng/meng-degree-requirements/";
const berkeleyCore: CoreData = {
  school: "University of California, Berkeley",
  schoolZh: "加州大学伯克利分校",
  program: "Mechanical Engineering",
  programZh: "机械工程",
  degree: "MEng",
  field: "Mechanical Engineering",
  country: "United States",
  state: "California",
  city: "Berkeley",
  programStatus: "ACTIVE",
};
const berkeley = makeOverride({
  id: "berkeley-me-meng",
  legacyId: "berkeley-me",
  core: berkeleyCore,
  sourceUrl: berkeleyAdmissions,
  applicationRequirements: {
    deadline: "2027-01-06",
    applicationRound: [
      {
        date: "2027-01-06",
        label: "Fall 2027 final deadline, 8:59 PM PST",
        deadlineType: "final",
        intake: "Fall 2027",
      },
    ],
    gre: { status: "not-required" },
    letters: { required: true, count: 2 },
    cv: { required: false, note: "Optional, but preferred" },
    credits: "25 units",
    applicationCycle: "Fall 2027",
  },
  insights: {
    curriculum: [
      { name: "Technical concentration", courses: [] },
      { name: "Engineering leadership", courses: [] },
    ],
    bestFit: ["Students seeking a professional mechanical engineering degree with leadership training"],
    highlights: ["25-unit professional curriculum combining technical depth and leadership"],
    riskFactors: ["English-score scale wording requires exact structured confirmation"],
  },
  tuition: notFoundTuition("USD", berkeleyAdmissions),
  sources: {
    programWebsite: berkeleyAdmissions,
    departmentWebsite: "https://me.berkeley.edu/",
    applicationWebsite: berkeleyAdmissions,
    admissionRequirementSource: berkeleyAdmissions,
    tuitionSource: berkeleyAdmissions,
    curriculumSource: berkeleyCurriculum,
  },
  verification: {
    deadline: field("2027-01-06", "verified", berkeleyAdmissions),
    gre: field("not-required", "verified", berkeleyAdmissions),
    letters: field(2, "verified", berkeleyAdmissions),
    cv: field("optional, but preferred", "verified", berkeleyAdmissions),
    credits: field("25 units", "verified", berkeleyCurriculum),
    curriculum: field(
      ["Technical concentration", "Engineering leadership"],
      "verified",
      berkeleyCurriculum,
    ),
    bestFit: field(
      ["Students seeking a professional mechanical engineering degree with leadership training"],
      "verified",
      berkeleyCurriculum,
    ),
    highlights: field(
      ["25-unit professional curriculum combining technical depth and leadership"],
      "verified",
      berkeleyCurriculum,
    ),
    riskFactors: field(
      ["English-score scale wording requires exact structured confirmation"],
      "pending",
      berkeleyAdmissions,
    ),
    tuition: tuitionVerification(berkeleyAdmissions),
  },
});

const uclaAdmissions = "https://www.mae.ucla.edu/graduate-admissions/";
const uclaFaq = "https://www.mae.ucla.edu/graduate-admissions-2/";
const uclaCore: CoreData = {
  school: "University of California, Los Angeles",
  schoolZh: "加州大学洛杉矶分校",
  program: "Mechanical Engineering",
  programZh: "机械工程",
  degree: "MS",
  field: "Mechanical Engineering",
  country: "United States",
  state: "California",
  city: "Los Angeles",
  programStatus: "ACTIVE",
};
const ucla = makeOverride({
  id: "ucla-mae-ms",
  legacyId: "ucla-me",
  core: uclaCore,
  sourceUrl: uclaAdmissions,
  applicationRequirements: {
    deadline: null,
    applicationRound: [
      {
        date: null,
        label: "Annual December 1 deadline; target cycle not confirmed",
        deadlineType: "final",
        intake: "Fall",
      },
    ],
    gre: { status: "unknown", note: "Current FAQ says required; Fall 2027 policy pending" },
    toefl: { required: true, minimumScore: 87 },
    ielts: { required: true, minimumScore: 7 },
    intake: ["Fall"],
  },
  insights: {
    bestFit: ["Students with strong preparation for graduate-level mechanical engineering"],
    highlights: ["Fall-only admission"],
    riskFactors: ["GRE language may not yet reflect the Fall 2027 admissions cycle"],
  },
  tuition: notFoundTuition("USD", uclaAdmissions),
  sources: {
    programWebsite: uclaAdmissions,
    departmentWebsite: "https://www.mae.ucla.edu/",
    applicationWebsite: uclaAdmissions,
    admissionRequirementSource: uclaFaq,
    tuitionSource: uclaAdmissions,
    curriculumSource: uclaAdmissions,
  },
  verification: {
    deadline: field(null, "pending", uclaAdmissions),
    gre: field(null, "pending", uclaFaq, "Current FAQ says required; target-cycle policy pending"),
    toefl: field(87, "pending", uclaFaq),
    ielts: field(7, "pending", uclaFaq),
    bestFit: field(
      ["Students with strong preparation for graduate-level mechanical engineering"],
      "verified",
      uclaFaq,
    ),
    highlights: field(["Fall-only admission"], "verified", uclaAdmissions),
    riskFactors: field(
      ["GRE language may not yet reflect the Fall 2027 admissions cycle"],
      "pending",
      uclaFaq,
    ),
    tuition: tuitionVerification(uclaAdmissions),
  },
});

const vanderbiltProgram =
  "https://engineering.vanderbilt.edu/departments/mechanical-engineering/graduate-programs/";
const vanderbiltAdmissions = "https://engineering.vanderbilt.edu/graduate-admissions/";
const vanderbiltCore: CoreData = {
  school: "Vanderbilt University",
  schoolZh: "范德堡大学",
  program: "Mechanical Engineering",
  programZh: "机械工程",
  degree: "MS",
  field: "Mechanical Engineering",
  country: "United States",
  state: "Tennessee",
  city: "Nashville",
  programStatus: "ACTIVE",
};
const vanderbiltSpecializations = [
  { name: "Surgical Robotics" },
  { name: "Rehabilitation Engineering and Socially Assistive Robotics" },
  { name: "Mechatronics, Control and Design" },
  { name: "Energy" },
  { name: "Fluids" },
  { name: "Nanotechnology" },
  { name: "Advanced Manufacturing" },
];
const vanderbilt = makeOverride({
  id: "vanderbilt-me-ms",
  legacyId: "vanderbilt-me",
  core: vanderbiltCore,
  sourceUrl: vanderbiltProgram,
  applicationRequirements: {
    deadline: null,
    gre: { status: "not-required", note: "2026-27 admissions cycle" },
    toefl: { required: true, minimumScore: 89 },
    ielts: { required: true, minimumScore: 7 },
    credits: "30 coursework credits or 24 coursework plus 6 research credits",
    applicationCycle: "2026-27",
  },
  insights: {
    specializations: vanderbiltSpecializations,
    bestFit: ["Students seeking a research-oriented MS with coursework or research-credit options"],
    highlights: ["Broad robotics, design, energy, fluids and manufacturing focus areas"],
    riskFactors: [
      "Official department and school pages publish conflicting Fall 2026 MS deadlines",
    ],
  },
  tuition: notFoundTuition("USD", vanderbiltProgram),
  sources: {
    programWebsite: vanderbiltProgram,
    departmentWebsite: vanderbiltProgram,
    applicationWebsite: "https://apply.vanderbilt.edu/apply/",
    admissionRequirementSource: vanderbiltAdmissions,
    tuitionSource: vanderbiltProgram,
    curriculumSource: vanderbiltProgram,
  },
  verification: {
    deadline: field(
      null,
      "pending",
      vanderbiltAdmissions,
      "Department page says January 1; engineering admissions page says March 15.",
    ),
    gre: field("not-required", "historical", vanderbiltAdmissions),
    toefl: field(89, "historical", vanderbiltAdmissions),
    ielts: field(7, "historical", vanderbiltAdmissions),
    credits: field(
      "30 coursework credits or 24 coursework plus 6 research credits",
      "verified",
      vanderbiltProgram,
    ),
    specializations: field(vanderbiltSpecializations, "verified", vanderbiltProgram),
    bestFit: field(
      ["Students seeking a research-oriented MS with coursework or research-credit options"],
      "verified",
      vanderbiltProgram,
    ),
    highlights: field(
      ["Broad robotics, design, energy, fluids and manufacturing focus areas"],
      "verified",
      vanderbiltProgram,
    ),
    riskFactors: field(
      ["Official department and school pages publish conflicting Fall 2026 MS deadlines"],
      "pending",
      vanderbiltAdmissions,
    ),
    tuition: tuitionVerification(vanderbiltProgram),
  },
});

const notreDameGraduate = "https://ame.nd.edu/graduate/";
const notreDameCore: CoreData = {
  school: "University of Notre Dame",
  schoolZh: "圣母大学",
  program: "Mechanical Engineering",
  programZh: "机械工程",
  degree: "MS",
  field: "Mechanical Engineering",
  country: "United States",
  state: "Indiana",
  city: "Notre Dame",
  programStatus: "REVIEW",
};
const notreDameRisk = [
  "未确认存在独立面向外部申请者的 Mechanical Engineering MS",
];
const notreDame = makeOverride({
  id: "notredame-me-review",
  legacyId: "notredame-me",
  core: notreDameCore,
  sourceUrl: notreDameGraduate,
  applicationRequirements: {
    deadline: null,
    applicationFee: null,
    gre: { status: "unknown" },
    toefl: { required: null },
    ielts: { required: null },
    letters: { required: null },
    cv: { required: null },
    sop: { required: null },
    credits: null,
    duration: null,
  },
  insights: { riskFactors: notreDameRisk },
  tuition: notFoundTuition("USD", notreDameGraduate),
  sources: {
    programWebsite: notreDameGraduate,
    departmentWebsite: "https://ame.nd.edu/",
    applicationWebsite: notreDameGraduate,
    admissionRequirementSource: notreDameGraduate,
    tuitionSource: notreDameGraduate,
    curriculumSource: notreDameGraduate,
  },
  verification: {
    deadline: field(null, "pending", notreDameGraduate),
    applicationFee: field(null, "pending", notreDameGraduate),
    gre: field(null, "pending", notreDameGraduate),
    toefl: field(null, "pending", notreDameGraduate),
    ielts: field(null, "pending", notreDameGraduate),
    letters: field(null, "pending", notreDameGraduate),
    cv: field(null, "pending", notreDameGraduate),
    sop: field(null, "pending", notreDameGraduate),
    credits: field(null, "pending", notreDameGraduate),
    duration: field(null, "pending", notreDameGraduate),
    riskFactors: field(notreDameRisk, "pending", notreDameGraduate),
    tuition: tuitionVerification(notreDameGraduate),
  },
});

const wustlDeadlines =
  "https://engineering.washu.edu/academics/graduate-admissions/deadlines.html";
const wustlAdmissions =
  "https://engineering.washu.edu/academics/graduate-admissions/index.html";
const wustlCore: CoreData = {
  school: "Washington University in St. Louis",
  schoolZh: "圣路易斯华盛顿大学",
  program: "Mechanical Engineering",
  programZh: "机械工程",
  degree: "MS",
  field: "Mechanical Engineering",
  country: "United States",
  state: "Missouri",
  city: "St. Louis",
  programStatus: "ACTIVE",
};
const wustl = makeOverride({
  id: "wustl-me-ms",
  legacyId: "wustl-me",
  core: wustlCore,
  sourceUrl: wustlAdmissions,
  applicationRequirements: {
    deadline: null,
    applicationRound: [
      {
        date: null,
        label: "Early decision: December 31",
        deadlineType: "priority",
        intake: "Fall",
        isPriority: true,
      },
      {
        date: null,
        label: "Full-time master's final deadline: March 1",
        deadlineType: "final",
        intake: "Fall",
      },
    ],
    gre: { status: "unknown" },
    toefl: { required: null },
    ielts: { required: null },
    letters: { required: null },
    cv: { required: null },
    sop: { required: null },
  },
  insights: {
    riskFactors: [
      "Central engineering deadlines require confirmation for the target cycle and program",
    ],
  },
  tuition: notFoundTuition("USD", wustlAdmissions),
  sources: {
    programWebsite: wustlAdmissions,
    departmentWebsite: wustlAdmissions,
    applicationWebsite: wustlAdmissions,
    admissionRequirementSource: wustlDeadlines,
    tuitionSource: wustlAdmissions,
    curriculumSource: wustlAdmissions,
  },
  verification: {
    deadline: field(null, "pending", wustlDeadlines),
    applicationRound: field(
      ["December 31 early decision", "March 1 final"],
      "pending",
      wustlDeadlines,
    ),
    gre: field(null, "pending", wustlAdmissions),
    toefl: field(null, "pending", wustlAdmissions),
    ielts: field(null, "pending", wustlAdmissions),
    letters: field(null, "pending", wustlAdmissions),
    cv: field(null, "pending", wustlAdmissions),
    sop: field(null, "pending", wustlAdmissions),
    riskFactors: field(
      ["Central engineering deadlines require confirmation for the target cycle and program"],
      "pending",
      wustlDeadlines,
    ),
    tuition: tuitionVerification(wustlAdmissions),
  },
});

const uvaAdmissions =
  "https://engineering.virginia.edu/department/mechanical-and-aerospace-engineering/apply-mae/apply-mae-information-prospective-graduate-students";
const uvaMs =
  "https://engineering.virginia.edu/department/mechanical-and-aerospace-engineering/academics/graduate-programs/ms-mechanical-and-aerospace-engineering";
const uvaFaq =
  "https://engineering.virginia.edu/department/mechanical-and-aerospace-engineering/graduate-program-faqs";
const uvaCore = {
  school: "University of Virginia",
  schoolZh: "弗吉尼亚大学",
  program: "Mechanical and Aerospace Engineering",
  programZh: "机械与航空航天工程",
  field: "Mechanical and Aerospace Engineering",
  country: "United States",
  state: "Virginia",
  city: "Charlottesville",
  programStatus: "ACTIVE" as const,
};
const uvaMsRecord = makeOverride({
  id: "uva-mae-ms",
  legacyId: "uva-mae",
  core: { ...uvaCore, degree: "MS" },
  sourceUrl: uvaMs,
  applicationRequirements: {
    deadline: null,
    applicationRound: [
      {
        date: "2025-12-16",
        label: "Fall 2026 MS deadline",
        deadlineType: "final",
        intake: "Fall 2026",
      },
    ],
    applicationFee: { amount: 0, currency: "USD", displayText: "Fee waived for 2026" },
    gre: { status: "optional" },
    credits: "24 graduate credits including thesis research",
    applicationCycle: "Fall 2026",
  },
  insights: {
    bestFit: ["Students seeking a faculty-supervised research and thesis master's degree"],
    highlights: ["Research MS with thesis"],
    riskFactors: ["Admission depends substantially on faculty interest and research funding"],
  },
  tuition: notFoundTuition("USD", uvaAdmissions),
  sources: {
    programWebsite: uvaMs,
    departmentWebsite: "https://engineering.virginia.edu/department/mechanical-and-aerospace-engineering",
    applicationWebsite: uvaAdmissions,
    admissionRequirementSource: uvaAdmissions,
    tuitionSource: uvaAdmissions,
    curriculumSource: uvaFaq,
  },
  verification: {
    deadline: field("2025-12-16", "historical", uvaAdmissions),
    applicationFee: field(0, "historical", uvaAdmissions),
    gre: field("optional", "historical", uvaAdmissions),
    credits: field("24 graduate credits including thesis research", "verified", uvaFaq),
    bestFit: field(
      ["Students seeking a faculty-supervised research and thesis master's degree"],
      "verified",
      uvaMs,
    ),
    highlights: field(["Research MS with thesis"], "verified", uvaMs),
    riskFactors: field(
      ["Admission depends substantially on faculty interest and research funding"],
      "verified",
      uvaAdmissions,
    ),
    tuition: tuitionVerification(uvaAdmissions),
  },
});
const uvaMengRecord = makeOverride({
  id: "uva-mae-meng",
  legacyId: "uva-mae",
  core: { ...uvaCore, degree: "MEng" },
  sourceUrl: uvaAdmissions,
  applicationRequirements: {
    deadline: null,
    applicationRound: [
      {
        date: "2026-03-20",
        label: "Fall 2026 international deadline",
        deadlineType: "international",
        intake: "Fall 2026",
      },
      {
        date: "2026-07-31",
        label: "Fall 2026 domestic deadline",
        deadlineType: "domestic",
        intake: "Fall 2026",
      },
    ],
    applicationFee: { amount: 0, currency: "USD", displayText: "Fee waived for 2026" },
    gre: { status: "optional" },
    credits: "30 credits",
    duration: null,
    applicationCycle: "Fall 2026",
  },
  insights: {
    bestFit: ["Students seeking a course-based mechanical and aerospace engineering degree"],
    highlights: ["Course-based degree with no research requirement"],
    riskFactors: ["Fall 2027 deadlines and fee policy have not yet been verified"],
  },
  tuition: notFoundTuition("USD", uvaAdmissions),
  sources: {
    programWebsite: uvaAdmissions,
    departmentWebsite: "https://engineering.virginia.edu/department/mechanical-and-aerospace-engineering",
    applicationWebsite: uvaAdmissions,
    admissionRequirementSource: uvaAdmissions,
    tuitionSource: uvaAdmissions,
    curriculumSource: uvaFaq,
  },
  verification: {
    deadline: field("2026-03-20", "historical", uvaAdmissions),
    applicationRound: field(
      [
        { date: "2026-03-20", deadlineType: "international" },
        { date: "2026-07-31", deadlineType: "domestic" },
      ],
      "historical",
      uvaAdmissions,
    ),
    applicationFee: field(0, "historical", uvaAdmissions),
    gre: field("optional", "historical", uvaAdmissions),
    credits: field("30 credits", "verified", uvaFaq),
    duration: field(null, "pending", uvaFaq),
    bestFit: field(
      ["Students seeking a course-based mechanical and aerospace engineering degree"],
      "verified",
      uvaAdmissions,
    ),
    highlights: field(
      ["Course-based degree with no research requirement"],
      "verified",
      uvaAdmissions,
    ),
    riskFactors: field(
      ["Fall 2027 deadlines and fee policy have not yet been verified"],
      "pending",
      uvaAdmissions,
    ),
    tuition: tuitionVerification(uvaAdmissions),
  },
});

const ufAdmissions = "https://mae.ufl.edu/students/graduate/admissions/";
const ufCore: CoreData = {
  school: "University of Florida",
  schoolZh: "佛罗里达大学",
  program: "Mechanical Engineering",
  programZh: "机械工程",
  degree: "MS",
  field: "Mechanical Engineering",
  country: "United States",
  state: "Florida",
  city: "Gainesville",
  programStatus: "ACTIVE",
};
const uf = makeOverride({
  id: "uf-me-ms",
  legacyId: "uf-me",
  core: ufCore,
  sourceUrl: ufAdmissions,
  applicationRequirements: {
    deadline: null,
    applicationRound: [
      {
        date: null,
        label: "Fall priority: January 5",
        deadlineType: "priority",
        intake: "Fall",
      },
      {
        date: null,
        label: "Fall international: March 1",
        deadlineType: "international",
        intake: "Fall",
      },
      {
        date: null,
        label: "Fall domestic: June 1",
        deadlineType: "domestic",
        intake: "Fall",
      },
    ],
    gre: { status: "not-required" },
    letters: { required: true, count: 2 },
    cv: { required: true },
    sop: { required: true, note: "500 words or fewer" },
  },
  insights: {
    backgroundRequirement: {
      preferredMajors: ["Engineering", "Mathematics", "Physics", "Statistics"],
    },
    bestFit: ["Applicants with engineering or quantitative science preparation"],
    highlights: ["GRE is not required"],
    riskFactors: ["Published month/day deadlines are not tied to the Fall 2027 cycle"],
  },
  tuition: notFoundTuition("USD", ufAdmissions),
  sources: {
    programWebsite: ufAdmissions,
    departmentWebsite: "https://mae.ufl.edu/",
    applicationWebsite: ufAdmissions,
    admissionRequirementSource: ufAdmissions,
    tuitionSource: ufAdmissions,
    curriculumSource: ufAdmissions,
  },
  verification: {
    deadline: field(null, "pending", ufAdmissions),
    applicationRound: field(
      ["January 5 priority", "March 1 international", "June 1 domestic"],
      "pending",
      ufAdmissions,
    ),
    gre: field("not-required", "verified", ufAdmissions),
    letters: field(2, "verified", ufAdmissions),
    cv: field(true, "verified", ufAdmissions),
    sop: field("500 words or fewer", "verified", ufAdmissions),
    backgroundRequirement: field(
      ["Engineering", "Mathematics", "Physics", "Statistics"],
      "verified",
      ufAdmissions,
    ),
    bestFit: field(
      ["Applicants with engineering or quantitative science preparation"],
      "verified",
      ufAdmissions,
    ),
    highlights: field(["GRE is not required"], "verified", ufAdmissions),
    riskFactors: field(
      ["Published month/day deadlines are not tied to the Fall 2027 cycle"],
      "pending",
      ufAdmissions,
    ),
    tuition: tuitionVerification(ufAdmissions),
  },
});

const utAdmissions =
  "https://www.me.utexas.edu/academics/graduate-program/graduate-admissions";
const utCore: CoreData = {
  school: "The University of Texas at Austin",
  schoolZh: "得克萨斯大学奥斯汀分校",
  program: "Mechanical Engineering",
  programZh: "机械工程",
  degree: "MS",
  field: "Mechanical Engineering",
  country: "United States",
  state: "Texas",
  city: "Austin",
  programStatus: "ACTIVE",
};
const utAustin = makeOverride({
  id: "utaustin-me-ms",
  legacyId: "utaustin-me",
  core: utCore,
  sourceUrl: utAdmissions,
  applicationRequirements: {
    deadline: null,
    applicationRound: [
      {
        date: null,
        label: "Fall deadline: December 1",
        deadlineType: "final",
        intake: "Fall",
      },
      {
        date: null,
        label: "Spring deadline: October 1",
        deadlineType: "final",
        intake: "Spring",
      },
    ],
    gre: { status: "optional" },
    toefl: { required: true },
    ielts: { required: true },
    letters: { required: true, count: 3 },
    cv: { required: true },
    sop: { required: true },
  },
  insights: {
    backgroundRequirement: {
      preferredMajors: ["Engineering", "Physical Sciences"],
    },
    bestFit: ["Students with engineering or physical-science preparation"],
    highlights: ["Holistic admissions review and optional GRE"],
    riskFactors: ["Published month/day deadlines are not tied to the Fall 2027 cycle"],
  },
  tuition: notFoundTuition("USD", utAdmissions),
  sources: {
    programWebsite: utAdmissions,
    departmentWebsite: "https://www.me.utexas.edu/",
    applicationWebsite: utAdmissions,
    admissionRequirementSource: utAdmissions,
    tuitionSource: utAdmissions,
    curriculumSource: utAdmissions,
  },
  verification: {
    deadline: field(null, "pending", utAdmissions),
    applicationRound: field(["December 1 Fall", "October 1 Spring"], "pending", utAdmissions),
    gre: field("optional", "verified", utAdmissions),
    toefl: field(true, "verified", utAdmissions),
    ielts: field(true, "verified", utAdmissions),
    letters: field(3, "verified", utAdmissions),
    cv: field(true, "verified", utAdmissions),
    sop: field(true, "verified", utAdmissions),
    backgroundRequirement: field(
      ["Engineering", "Physical Sciences"],
      "verified",
      utAdmissions,
    ),
    bestFit: field(
      ["Students with engineering or physical-science preparation"],
      "verified",
      utAdmissions,
    ),
    highlights: field(
      ["Holistic admissions review and optional GRE"],
      "verified",
      utAdmissions,
    ),
    riskFactors: field(
      ["Published month/day deadlines are not tied to the Fall 2027 cycle"],
      "pending",
      utAdmissions,
    ),
    tuition: tuitionVerification(utAdmissions),
  },
});

const nyuProgram = "https://mechatronics.engineering.nyu.edu/ms-degree/";
const nyuCourses =
  "https://mechatronics.engineering.nyu.edu/ms-degree/courses/required-courses.php";
const nyuRequirements = "https://engineering.nyu.edu/admissions/graduate/apply/requirements";
const nyuCore: CoreData = {
  school: "New York University",
  schoolZh: "纽约大学",
  program: "Mechatronics and Robotics",
  programZh: "机电一体化与机器人",
  degree: "MS",
  field: "Mechatronics and Robotics",
  country: "United States",
  state: "New York",
  city: "Brooklyn",
  programStatus: "ACTIVE",
};
const nyuSpecializations = [
  { name: "Assistive Mechatronic and Robotic Technologies" },
  { name: "Mobile Robotics" },
  { name: "Microrobotics" },
];
const nyu = makeOverride({
  id: "nyu-mechatronics-robotics-ms",
  legacyId: "nyu-me",
  core: nyuCore,
  sourceUrl: nyuProgram,
  applicationRequirements: {
    deadline: null,
    applicationFee: { amount: 90, currency: "USD", displayText: "$90" },
    gre: { status: "unknown" },
    toefl: { required: null },
    ielts: { required: null },
    letters: { required: null },
    cv: { required: null },
    sop: { required: null },
  },
  insights: {
    specializations: nyuSpecializations,
    curriculum: [
      {
        name: "Required courses",
        courses: [
          { code: "ROB-GY 5103", name: "Mechatronics", credits: 3, sourceUrl: nyuCourses },
          {
            code: "ROB-GY 6003",
            name: "Foundations of Robotics",
            credits: 3,
            sourceUrl: nyuCourses,
          },
        ],
      },
    ],
    bestFit: ["Students seeking hands-on interdisciplinary robotics and mechatronics training"],
    highlights: ["Coursework plus experiential, project or thesis work"],
    riskFactors: ["Program-specific current-cycle admissions requirements remain unverified"],
  },
  tuition: notFoundTuition("USD", nyuRequirements),
  sources: {
    programWebsite: nyuProgram,
    departmentWebsite: nyuProgram,
    applicationWebsite: nyuRequirements,
    admissionRequirementSource: nyuRequirements,
    tuitionSource: nyuRequirements,
    curriculumSource: nyuCourses,
  },
  verification: {
    deadline: field(null, "pending", nyuRequirements),
    applicationFee: field(90, "verified", nyuRequirements),
    gre: field(null, "pending", nyuRequirements),
    toefl: field(null, "pending", nyuRequirements),
    ielts: field(null, "pending", nyuRequirements),
    letters: field(null, "pending", nyuRequirements),
    cv: field(null, "pending", nyuRequirements),
    sop: field(null, "pending", nyuRequirements),
    specializations: field(nyuSpecializations, "verified", nyuProgram),
    curriculum: field(["ROB-GY 5103", "ROB-GY 6003"], "verified", nyuCourses),
    bestFit: field(
      ["Students seeking hands-on interdisciplinary robotics and mechatronics training"],
      "verified",
      nyuProgram,
    ),
    highlights: field(
      ["Coursework plus experiential, project or thesis work"],
      "verified",
      nyuProgram,
    ),
    riskFactors: field(
      ["Program-specific current-cycle admissions requirements remain unverified"],
      "pending",
      nyuRequirements,
    ),
    tuition: tuitionVerification(nyuRequirements),
  },
});

const tuftsProgram = "https://engineering.tufts.edu/me/prospective-students/masters";
const tuftsCore: CoreData = {
  school: "Tufts University",
  schoolZh: "塔夫茨大学",
  program: "Mechanical Engineering",
  programZh: "机械工程",
  degree: "MS",
  field: "Mechanical Engineering",
  country: "United States",
  state: "Massachusetts",
  city: "Medford",
  programStatus: "ACTIVE",
};
const tufts = makeOverride({
  id: "tufts-me-ms",
  legacyId: "tufts-me",
  core: tuftsCore,
  sourceUrl: tuftsProgram,
  applicationRequirements: {
    deadline: null,
    applicationFee: { amount: 85, currency: "USD", displayText: "$85" },
    gre: { status: "not-required" },
    toefl: { required: true, minimumScore: 100 },
    ielts: { required: true, minimumScore: 7.5 },
    letters: { required: true, count: null },
    cv: { required: true },
    sop: { required: true },
    duration: "1-2 years",
  },
  insights: {
    specializations: [{ name: "Coursework" }, { name: "Thesis option after matriculation" }],
    bestFit: ["Students seeking a personalized mechanical engineering path in small classes"],
    highlights: ["Full-time one- or two-year schedules and an optional thesis route"],
    riskFactors: ["Recommendation count and target-cycle deadline require confirmation"],
  },
  tuition: notFoundTuition("USD", tuftsProgram),
  sources: {
    programWebsite: tuftsProgram,
    departmentWebsite: "https://engineering.tufts.edu/me/",
    applicationWebsite: tuftsProgram,
    admissionRequirementSource: tuftsProgram,
    tuitionSource: tuftsProgram,
    curriculumSource: tuftsProgram,
  },
  verification: {
    deadline: field(null, "pending", tuftsProgram),
    applicationFee: field(85, "verified", tuftsProgram),
    gre: field("not-required", "verified", tuftsProgram),
    toefl: field(100, "verified", tuftsProgram),
    ielts: field(7.5, "verified", tuftsProgram),
    letters: field(null, "pending", tuftsProgram),
    cv: field(true, "verified", tuftsProgram),
    sop: field(true, "verified", tuftsProgram),
    duration: field("1-2 years", "verified", tuftsProgram),
    specializations: field(
      ["Coursework", "Thesis option after matriculation"],
      "verified",
      tuftsProgram,
    ),
    bestFit: field(
      ["Students seeking a personalized mechanical engineering path in small classes"],
      "verified",
      tuftsProgram,
    ),
    highlights: field(
      ["Full-time one- or two-year schedules and an optional thesis route"],
      "verified",
      tuftsProgram,
    ),
    riskFactors: field(
      ["Recommendation count and target-cycle deadline require confirmation"],
      "pending",
      tuftsProgram,
    ),
    tuition: tuitionVerification(tuftsProgram),
  },
});

const ucsbApply = "https://me.ucsb.edu/graduate/how-apply";
const ucsbProgram = "https://me.ucsb.edu/graduate/graduate-admissions";
const ucsbCore: CoreData = {
  school: "University of California, Santa Barbara",
  schoolZh: "加州大学圣塔芭芭拉分校",
  program: "Mechanical Engineering",
  programZh: "机械工程",
  degree: "MS",
  field: "Mechanical Engineering",
  country: "United States",
  state: "California",
  city: "Santa Barbara",
  programStatus: "ACTIVE",
};
const ucsbSpecializations = [
  { name: "Bioengineering and Systems Biology" },
  { name: "Computational Science and Engineering" },
  { name: "Dynamic Systems, Control and Robotics" },
  { name: "Micro and Nanoscale Engineering" },
  { name: "Solid Mechanics, Materials and Structures" },
  { name: "Thermal Sciences and Fluid Mechanics" },
];
const ucsb = makeOverride({
  id: "ucsb-me-ms",
  legacyId: "ucsb-me",
  core: ucsbCore,
  sourceUrl: ucsbProgram,
  applicationRequirements: {
    deadline: "2026-12-15",
    applicationRound: [
      {
        date: "2026-12-15",
        label: "Fall 2027 final deadline",
        deadlineType: "final",
        intake: "Fall 2027",
      },
    ],
    gre: { status: "not-required" },
    letters: { required: true, count: 3 },
    intake: ["Fall"],
    applicationCycle: "Fall 2027",
  },
  insights: {
    specializations: ucsbSpecializations,
    bestFit: ["Research-oriented applicants with clear faculty and area alignment"],
    highlights: ["Six official research specialization areas"],
    riskFactors: ["Research experience and faculty fit are important review criteria"],
  },
  tuition: notFoundTuition("USD", ucsbProgram),
  sources: {
    programWebsite: ucsbProgram,
    departmentWebsite: "https://me.ucsb.edu/",
    applicationWebsite: ucsbApply,
    admissionRequirementSource: ucsbApply,
    tuitionSource: ucsbProgram,
    curriculumSource: ucsbProgram,
  },
  verification: {
    deadline: field("2026-12-15", "verified", ucsbApply),
    gre: field("not-required", "verified", ucsbApply),
    letters: field(3, "verified", ucsbApply),
    specializations: field(ucsbSpecializations, "verified", ucsbProgram),
    bestFit: field(
      ["Research-oriented applicants with clear faculty and area alignment"],
      "verified",
      ucsbApply,
    ),
    highlights: field(["Six official research specialization areas"], "verified", ucsbProgram),
    riskFactors: field(
      ["Research experience and faculty fit are important review criteria"],
      "verified",
      ucsbApply,
    ),
    tuition: tuitionVerification(ucsbProgram),
  },
});

const lehighAdmissions = "https://engineering.lehigh.edu/meche/graduate/admissions";
const lehighProgram =
  "https://engineering.lehigh.edu/academics/graduate/masters/masters-mechanical-engineering";
const lehighCore: CoreData = {
  school: "Lehigh University",
  schoolZh: "理海大学",
  program: "Mechanical Engineering",
  programZh: "机械工程",
  degree: "MS",
  field: "Mechanical Engineering",
  country: "United States",
  state: "Pennsylvania",
  city: "Bethlehem",
  programStatus: "ACTIVE",
};
const lehigh = makeOverride({
  id: "lehigh-me-ms",
  legacyId: "lehigh-me",
  core: lehighCore,
  sourceUrl: lehighProgram,
  applicationRequirements: {
    deadline: null,
    applicationRound: [
      {
        date: null,
        label: "Fall final deadline: July 15",
        deadlineType: "final",
        intake: "Fall",
      },
      {
        date: null,
        label: "Financial-support deadline: December 15",
        deadlineType: "funding",
      },
      {
        date: null,
        label: "Spring deadline: December 1",
        deadlineType: "final",
        intake: "Spring",
      },
    ],
    applicationFee: { amount: 50, currency: "USD", displayText: "$50" },
    gre: { status: "not-required" },
    letters: { required: true, count: 2 },
    cv: { required: true },
    sop: { required: true },
  },
  insights: {
    bestFit: ["Applicants with a related Bachelor of Science background"],
    highlights: ["GRE is not required"],
    riskFactors: ["Published deadline dates are not tied to the Fall 2027 cycle"],
  },
  tuition: notFoundTuition("USD", lehighAdmissions),
  sources: {
    programWebsite: lehighProgram,
    departmentWebsite: "https://engineering.lehigh.edu/meche",
    applicationWebsite: lehighAdmissions,
    admissionRequirementSource: lehighAdmissions,
    tuitionSource: lehighAdmissions,
    curriculumSource: lehighProgram,
  },
  verification: {
    deadline: field(null, "pending", lehighAdmissions),
    applicationRound: field(
      ["July 15 Fall final", "December 15 funding", "December 1 Spring"],
      "pending",
      lehighAdmissions,
    ),
    applicationFee: field(50, "verified", lehighAdmissions),
    gre: field("not-required", "verified", lehighProgram),
    letters: field(2, "verified", lehighProgram),
    cv: field(true, "verified", lehighProgram),
    sop: field(true, "verified", lehighProgram),
    bestFit: field(
      ["Applicants with a related Bachelor of Science background"],
      "verified",
      lehighProgram,
    ),
    highlights: field(["GRE is not required"], "verified", lehighProgram),
    riskFactors: field(
      ["Published deadline dates are not tied to the Fall 2027 cycle"],
      "pending",
      lehighAdmissions,
    ),
    tuition: tuitionVerification(lehighAdmissions),
  },
});

const northwesternApply =
  "https://www.mccormick.northwestern.edu/mechanical/academics/graduate/prospective-masters/how-to-apply.html";
const northwesternProgram =
  "https://www.mccormick.northwestern.edu/mechanical/academics/graduate/prospective-masters/";
const northwesternCurriculum =
  "https://www.mccormick.northwestern.edu/mechanical/academics/graduate/student-resources/masters-curriculum.html";
const northwesternCore: CoreData = {
  school: "Northwestern University",
  schoolZh: "西北大学",
  program: "Mechanical Engineering",
  programZh: "机械工程",
  degree: "MS",
  field: "Mechanical Engineering",
  country: "United States",
  state: "Illinois",
  city: "Evanston",
  programStatus: "ACTIVE",
};
const northwestern = makeOverride({
  id: "northwestern-me-ms",
  legacyId: "northwestern-me",
  core: northwesternCore,
  sourceUrl: northwesternProgram,
  applicationRequirements: {
    deadline: null,
    applicationRound: [
      {
        date: "2026-07-21",
        label: "Fall 2026 final deadline",
        deadlineType: "final",
        intake: "Fall 2026",
      },
    ],
    applicationFee: { amount: 95, currency: "USD", displayText: "$95" },
    gre: { status: "not-required", note: "2025-26 cycle" },
    toefl: { required: true, minimumScore: 90 },
    ielts: { required: true, minimumScore: 7 },
    letters: { required: true, count: 2 },
    cv: { required: true },
    sop: { required: true },
    duration: "9-15 months",
    applicationCycle: "Fall 2026",
  },
  insights: {
    specializations: [{ name: "Course-based terminal MS" }, { name: "Thesis MS" }],
    curriculum: [
      {
        name: "Breadth areas",
        courses: [
          { name: "Solids" },
          { name: "Fluids, Thermodynamics and Energy" },
          { name: "Dynamics and Controls" },
          { name: "Design, Manufacturing and Tribology" },
          { name: "MEMS and Nanotechnology" },
          { name: "Biomedical and Biology" },
          { name: "Mathematics and Sciences" },
          { name: "Engineering Management" },
        ],
      },
    ],
    bestFit: ["Students seeking either a fast course-based MS or a thesis route"],
    highlights: ["Course-based and thesis options with interdisciplinary breadth"],
    riskFactors: ["Fall 2027 deadline and GRE policy have not yet been verified"],
  },
  tuition: notFoundTuition("USD", northwesternApply),
  sources: {
    programWebsite: northwesternProgram,
    departmentWebsite: "https://www.mccormick.northwestern.edu/mechanical/",
    applicationWebsite: northwesternApply,
    admissionRequirementSource: northwesternApply,
    tuitionSource: northwesternApply,
    curriculumSource: northwesternCurriculum,
  },
  verification: {
    deadline: field("2026-07-21", "historical", northwesternApply),
    applicationFee: field(95, "historical", northwesternApply),
    gre: field("not-required", "historical", northwesternApply),
    toefl: field(90, "historical", northwesternApply),
    ielts: field(7, "historical", northwesternApply),
    letters: field(2, "historical", northwesternApply),
    cv: field(true, "historical", northwesternApply),
    sop: field(true, "historical", northwesternApply),
    duration: field("9-15 months", "verified", northwesternProgram),
    curriculum: field(
      [
        "Solids",
        "Fluids, Thermodynamics and Energy",
        "Dynamics and Controls",
        "Design, Manufacturing and Tribology",
        "MEMS and Nanotechnology",
        "Biomedical and Biology",
        "Mathematics and Sciences",
        "Engineering Management",
      ],
      "verified",
      northwesternCurriculum,
    ),
    specializations: field(
      ["Course-based terminal MS", "Thesis MS"],
      "verified",
      northwesternProgram,
    ),
    bestFit: field(
      ["Students seeking either a fast course-based MS or a thesis route"],
      "verified",
      northwesternProgram,
    ),
    highlights: field(
      ["Course-based and thesis options with interdisciplinary breadth"],
      "verified",
      northwesternProgram,
    ),
    riskFactors: field(
      ["Fall 2027 deadline and GRE policy have not yet been verified"],
      "pending",
      northwesternApply,
    ),
    tuition: tuitionVerification(northwesternApply),
  },
});

const riceAdmissions =
  "https://mech.rice.edu/academics/graduate-programs/graduate-admissions";
const riceMsProgram =
  "https://mech.rice.edu/academics/graduate-programs/master-science-program";
const riceCore = {
  school: "Rice University",
  schoolZh: "莱斯大学",
  program: "Mechanical Engineering",
  programZh: "机械工程",
  field: "Mechanical Engineering",
  country: "United States",
  state: "Texas",
  city: "Houston",
  programStatus: "ACTIVE" as const,
};
const riceAreas = [
  { name: "Aerospace Engineering" },
  { name: "Biomechanics and Biomedical Systems" },
  { name: "Computational Fluid Dynamics" },
  { name: "Computational Mechanics" },
  { name: "Energy and the Environment" },
  { name: "Fluids and Thermal Science" },
  { name: "Mechanical Design" },
  { name: "Robotics" },
  { name: "System Dynamics and Controls" },
  { name: "Tribology" },
];
const riceSharedRequirements: Pick<
  ApplicationRequirement,
  "gre" | "toefl" | "ielts" | "letters"
> = {
  gre: { status: "optional", note: "Optional but recommended" },
  toefl: { required: true, minimumScore: 90 },
  ielts: { required: true, minimumScore: 7 },
  letters: { required: true, count: 3 },
};
const riceMs = makeOverride({
  id: "rice-me-ms",
  legacyId: "rice-me",
  core: { ...riceCore, degree: "MS" },
  sourceUrl: riceMsProgram,
  applicationRequirements: {
    deadline: null,
    applicationRound: [
      {
        date: null,
        label: "Fall deadline: December 15",
        deadlineType: "final",
        intake: "Fall",
      },
    ],
    ...riceSharedRequirements,
    duration: "2 years",
  },
  insights: {
    specializations: riceAreas,
    bestFit: ["Students seeking a research-based MS with a thesis"],
    highlights: ["Research graduate program with thesis"],
    riskFactors: ["Published deadline is not tied to the Fall 2027 cycle"],
  },
  tuition: notFoundTuition("USD", riceAdmissions),
  sources: {
    programWebsite: riceMsProgram,
    departmentWebsite: "https://mech.rice.edu/",
    applicationWebsite: riceAdmissions,
    admissionRequirementSource: riceAdmissions,
    tuitionSource: riceAdmissions,
    curriculumSource: riceMsProgram,
  },
  verification: {
    deadline: field(null, "pending", riceAdmissions),
    gre: field("optional but recommended", "pending", riceAdmissions),
    toefl: field(90, "verified", riceAdmissions),
    ielts: field(7, "verified", riceAdmissions),
    letters: field(3, "verified", riceAdmissions),
    duration: field("2 years", "verified", riceMsProgram),
    specializations: field(riceAreas, "verified", riceAdmissions),
    bestFit: field(["Students seeking a research-based MS with a thesis"], "verified", riceMsProgram),
    highlights: field(["Research graduate program with thesis"], "verified", riceMsProgram),
    riskFactors: field(
      ["Published deadline is not tied to the Fall 2027 cycle"],
      "pending",
      riceAdmissions,
    ),
    tuition: tuitionVerification(riceAdmissions),
  },
});
const riceMme = makeOverride({
  id: "rice-me-mme",
  legacyId: "rice-me",
  core: { ...riceCore, degree: "MME" },
  sourceUrl: riceAdmissions,
  applicationRequirements: {
    deadline: null,
    applicationRound: [
      {
        date: null,
        label: "Fall international deadline: May 1",
        deadlineType: "international",
        intake: "Fall",
      },
      {
        date: null,
        label: "Fall domestic deadline: July 1",
        deadlineType: "domestic",
        intake: "Fall",
      },
    ],
    ...riceSharedRequirements,
  },
  insights: {
    specializations: riceAreas,
    bestFit: ["Students seeking a professional non-thesis mechanical engineering degree"],
    highlights: ["Professional master's route"],
    riskFactors: ["Published deadlines are not tied to the Fall 2027 cycle"],
  },
  tuition: notFoundTuition("USD", riceAdmissions),
  sources: {
    programWebsite: riceAdmissions,
    departmentWebsite: "https://mech.rice.edu/",
    applicationWebsite: riceAdmissions,
    admissionRequirementSource: riceAdmissions,
    tuitionSource: riceAdmissions,
    curriculumSource: riceAdmissions,
  },
  verification: {
    deadline: field(null, "pending", riceAdmissions),
    applicationRound: field(
      ["May 1 international", "July 1 domestic"],
      "pending",
      riceAdmissions,
    ),
    gre: field("optional but recommended", "pending", riceAdmissions),
    toefl: field(90, "verified", riceAdmissions),
    ielts: field(7, "verified", riceAdmissions),
    letters: field(3, "verified", riceAdmissions),
    specializations: field(riceAreas, "verified", riceAdmissions),
    bestFit: field(
      ["Students seeking a professional non-thesis mechanical engineering degree"],
      "verified",
      riceAdmissions,
    ),
    highlights: field(["Professional master's route"], "verified", riceAdmissions),
    riskFactors: field(
      ["Published deadlines are not tied to the Fall 2027 cycle"],
      "pending",
      riceAdmissions,
    ),
    tuition: tuitionVerification(riceAdmissions),
  },
});

const gatechGraduate = "https://www.me.gatech.edu/graduate";
const gatechFaq = "https://www.me.gatech.edu/faqs-3";
const gatechGre = "https://www.me.gatech.edu/bsms-0";
const gatechCore: CoreData = {
  school: "Georgia Institute of Technology",
  schoolZh: "佐治亚理工学院",
  program: "Mechanical Engineering",
  programZh: "机械工程",
  degree: "MSME",
  field: "Mechanical Engineering",
  country: "United States",
  state: "Georgia",
  city: "Atlanta",
  programStatus: "ACTIVE",
};
const gatech = makeOverride({
  id: "gatech-me-msme",
  legacyId: "gatech-me",
  core: gatechCore,
  sourceUrl: gatechGraduate,
  applicationRequirements: {
    deadline: null,
    gre: { status: "not-required" },
    toefl: { required: null },
    ielts: { required: null },
    letters: { required: null },
    cv: { required: null },
    sop: { required: null },
  },
  insights: {
    specializations: [{ name: "Thesis" }, { name: "Non-thesis" }],
    backgroundRequirement: {
      preferredMajors: ["Mechanical Engineering", "Equivalent Engineering Degree"],
    },
    bestFit: ["Applicants with mechanical engineering or equivalent engineering preparation"],
    highlights: ["Thesis and non-thesis degree routes"],
    riskFactors: ["Official Woodruff pages contain historical and program-specific requirement conflicts"],
  },
  tuition: notFoundTuition("USD", gatechGraduate),
  sources: {
    programWebsite: gatechGraduate,
    departmentWebsite: "https://www.me.gatech.edu/",
    applicationWebsite: gatechGraduate,
    admissionRequirementSource: gatechFaq,
    tuitionSource: gatechGraduate,
    curriculumSource: gatechGraduate,
    additionalSources: [{ label: "GRE policy notice", sourceUrl: gatechGre }],
  },
  verification: {
    deadline: field(null, "pending", gatechGraduate),
    gre: field("not-required", "pending", gatechGre),
    toefl: field(null, "pending", gatechGraduate),
    ielts: field(null, "pending", gatechGraduate),
    letters: field(null, "pending", gatechGraduate),
    cv: field(null, "pending", gatechGraduate),
    sop: field(null, "pending", gatechGraduate),
    specializations: field(["Thesis", "Non-thesis"], "verified", gatechGraduate),
    backgroundRequirement: field(
      ["Mechanical Engineering", "Equivalent Engineering Degree"],
      "verified",
      gatechFaq,
    ),
    bestFit: field(
      ["Applicants with mechanical engineering or equivalent engineering preparation"],
      "verified",
      gatechFaq,
    ),
    highlights: field(["Thesis and non-thesis degree routes"], "verified", gatechGraduate),
    riskFactors: field(
      ["Official Woodruff pages contain historical and program-specific requirement conflicts"],
      "pending",
      gatechFaq,
    ),
    tuition: tuitionVerification(gatechGraduate),
  },
});

const hkuProgram = "https://mech.hku.hk/tpg/";
const hkuCurriculum =
  "https://admissions.hku.hk/tpg/sites/default/files/R51_REGULATIONSYLLABUS_2.pdf";
const hkuHistoricalAdmissions =
  "https://admissions.hku.hk/tpg/sites/default/files/R363_PROGRAMINFORMATION_3.pdf";
const hkuCore: CoreData = {
  school: "The University of Hong Kong",
  schoolZh: "香港大学",
  program: "Mechanical Engineering",
  programZh: "机械工程",
  degree: "MSc(Eng)",
  field: "Mechanical Engineering",
  country: "China",
  state: "Hong Kong",
  city: "Hong Kong",
  programStatus: "ACTIVE",
};
const hku = makeOverride({
  id: "hku-me-msceng",
  legacyId: "hku-me",
  core: hkuCore,
  sourceUrl: hkuProgram,
  applicationRequirements: {
    deadline: null,
    gre: { status: "unknown" },
    toefl: { required: null },
    ielts: { required: null },
    letters: { required: null },
    cv: { required: null },
    sop: { required: null },
    credits: "72 credits",
    duration: "1 year full-time or 2 years part-time",
  },
  insights: {
    specializations: [
      { name: "Energy and Power" },
      { name: "Environmental Engineering" },
      { name: "Material Technology" },
      { name: "Theoretical Mechanics" },
      { name: "Computer-integrated Design and Manufacturing" },
      { name: "Robotics, Drones and Control" },
    ],
    curriculum: [
      { name: "Discipline courses", description: "At least 30 credits", courses: [] },
      { name: "Elective courses", description: "No more than 18 credits", courses: [] },
      { name: "Dissertation", description: "24 credits", courses: [] },
    ],
    bestFit: ["Students seeking a one-year taught engineering program with a dissertation"],
    highlights: ["72-credit curriculum with a 24-credit dissertation"],
    riskFactors: ["Current-cycle admissions requirements and tuition have not been published in the checked sources"],
  },
  tuition: notFoundTuition("HKD", hkuProgram),
  sources: {
    programWebsite: hkuProgram,
    departmentWebsite: "https://mech.hku.hk/",
    applicationWebsite: "https://hku.hk/tpg",
    admissionRequirementSource: hkuHistoricalAdmissions,
    tuitionSource: hkuProgram,
    curriculumSource: hkuCurriculum,
  },
  verification: {
    deadline: field(null, "pending", hkuProgram),
    gre: field(null, "pending", hkuProgram),
    toefl: field(null, "pending", hkuHistoricalAdmissions),
    ielts: field(null, "pending", hkuHistoricalAdmissions),
    letters: field(null, "pending", hkuHistoricalAdmissions),
    cv: field(null, "pending", hkuHistoricalAdmissions),
    sop: field(null, "pending", hkuHistoricalAdmissions),
    credits: field("72 credits", "verified", hkuCurriculum),
    duration: field("1 year full-time or 2 years part-time", "verified", hkuProgram),
    specializations: field(
      [
        "Energy and Power",
        "Environmental Engineering",
        "Material Technology",
        "Theoretical Mechanics",
        "Computer-integrated Design and Manufacturing",
        "Robotics, Drones and Control",
      ],
      "verified",
      hkuCurriculum,
    ),
    curriculum: field(
      ["30+ discipline credits", "up to 18 elective credits", "24-credit dissertation"],
      "verified",
      hkuCurriculum,
    ),
    bestFit: field(
      ["Students seeking a one-year taught engineering program with a dissertation"],
      "verified",
      hkuProgram,
    ),
    highlights: field(
      ["72-credit curriculum with a 24-credit dissertation"],
      "verified",
      hkuCurriculum,
    ),
    riskFactors: field(
      ["Current-cycle admissions requirements and tuition have not been published in the checked sources"],
      "pending",
      hkuProgram,
    ),
    tuition: tuitionVerification(hkuProgram),
  },
});

const torontoProgram =
  "https://www.mie.utoronto.ca/programs/graduate/master-of-engineering/";
const torontoAdmissions = "https://www.mie.utoronto.ca/graduate./";
const torontoCore: CoreData = {
  school: "University of Toronto",
  schoolZh: "多伦多大学",
  program: "Master of Engineering",
  programZh: "工程硕士",
  degree: "MEng",
  field: "Mechanical and Industrial Engineering",
  country: "Canada",
  state: "Ontario",
  city: "Toronto",
  programStatus: "ACTIVE",
};
const toronto = makeOverride({
  id: "utoronto-mie-meng",
  legacyId: "utoronto-me",
  core: torontoCore,
  sourceUrl: torontoProgram,
  applicationRequirements: {
    deadline: "2026-09-15",
    applicationRound: [
      {
        date: "2026-02-04",
        label: "Fall 2026 co-op deadline",
        deadlineType: "final",
        intake: "Fall 2026",
      },
      {
        date: "2026-05-31",
        label: "Fall 2026 non-co-op deadline",
        deadlineType: "final",
        intake: "Fall 2026",
      },
      {
        date: "2026-09-15",
        label: "Winter 2027 international deadline",
        deadlineType: "international",
        intake: "Winter 2027",
      },
      {
        date: "2026-11-15",
        label: "Winter 2027 domestic deadline",
        deadlineType: "domestic",
        intake: "Winter 2027",
      },
    ],
    gre: { status: "unknown" },
    toefl: { required: null },
    ielts: { required: null },
    letters: { required: true, count: 2 },
    cv: { required: true },
    sop: { required: true, note: "Letter of Intent" },
    applicationCycle: "Fall 2026 / Winter 2027",
  },
  insights: {
    specializations: [
      { name: "Full-time" },
      { name: "Extended full-time" },
      { name: "Part-time" },
    ],
    bestFit: ["Students seeking a self-funded professional engineering master's degree"],
    highlights: ["Multiple study modes and optional co-op route"],
    riskFactors: ["Fall 2027 deadlines, detailed ELP scores and tuition remain unverified"],
  },
  tuition: notFoundTuition("CAD", torontoProgram),
  sources: {
    programWebsite: torontoProgram,
    departmentWebsite: "https://www.mie.utoronto.ca/",
    applicationWebsite: torontoProgram,
    admissionRequirementSource: torontoAdmissions,
    tuitionSource: torontoProgram,
    curriculumSource: torontoProgram,
  },
  verification: {
    deadline: field("2026-09-15", "verified", torontoProgram, "Winter 2027 international intake only"),
    applicationRound: field(
      [
        { date: "2026-02-04", status: "historical" },
        { date: "2026-05-31", status: "historical" },
        { date: "2026-09-15", status: "verified" },
        { date: "2026-11-15", status: "verified" },
      ],
      "verified",
      torontoProgram,
    ),
    gre: field(null, "pending", torontoProgram),
    toefl: field(null, "pending", torontoAdmissions),
    ielts: field(null, "pending", torontoAdmissions),
    letters: field(2, "verified", torontoProgram),
    cv: field(true, "verified", torontoProgram),
    sop: field("Letter of Intent", "verified", torontoProgram),
    specializations: field(
      ["Full-time", "Extended full-time", "Part-time"],
      "verified",
      torontoProgram,
    ),
    bestFit: field(
      ["Students seeking a self-funded professional engineering master's degree"],
      "verified",
      torontoProgram,
    ),
    highlights: field(
      ["Multiple study modes and optional co-op route"],
      "verified",
      torontoProgram,
    ),
    riskFactors: field(
      ["Fall 2027 deadlines, detailed ELP scores and tuition remain unverified"],
      "pending",
      torontoProgram,
    ),
    tuition: tuitionVerification(torontoProgram),
  },
});

export const TOP20_PROGRAM_V2_OVERRIDES: ProgramV2Override[] = [
  princetonMse,
  princetonMeng,
  upenn,
  brown,
  berkeley,
  ucla,
  vanderbilt,
  notreDame,
  wustl,
  uvaMsRecord,
  uvaMengRecord,
  uf,
  utAustin,
  nyu,
  tufts,
  ucsb,
  lehigh,
  northwestern,
  riceMs,
  riceMme,
  gatech,
  hku,
  toronto,
];
