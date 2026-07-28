import type { ProgramV2Override, VerifiedOverrideField } from "./program-v2-top20";
import type { ProgramV2, VerificationState } from "../types/application";

const REVIEWED_AT = "2026-07-28";

function verified<T>(
  value: T,
  status: VerificationState,
  sourceUrl: string,
  note?: string,
): VerifiedOverrideField<T> {
  return { value, status, sourceUrl, lastVerifiedAt: REVIEWED_AT, ...(note ? { note } : {}) };
}

function base(args: {
  id: string;
  legacyId: string;
  school: string;
  schoolZh: string;
  program: string;
  programZh: string;
  degree: string;
  city: string;
  state: string;
  programUrl: string;
  data: Partial<ProgramV2>;
  verification: ProgramV2Override["verification"];
  review?: boolean;
}): ProgramV2Override {
  const programStatus = args.review ? "REVIEW" : "ACTIVE";
  const core = {
    school: verified(args.school, "verified", args.programUrl),
    schoolZh: verified(args.schoolZh, "verified", args.programUrl),
    program: verified(args.program, "verified", args.programUrl),
    programZh: verified(args.programZh, "verified", args.programUrl),
    degree: verified(args.degree, "verified", args.programUrl),
    field: verified("Mechanical Engineering", "verified", args.programUrl),
    city: verified(args.city, "verified", args.programUrl),
    state: verified(args.state, "verified", args.programUrl),
    country: verified("United States", "verified", args.programUrl),
    programStatus: verified(
      programStatus,
      args.review ? "needs-manual-review" : "verified",
      args.programUrl,
      args.review ? "The saved generic project requires manual scope confirmation." : undefined,
    ),
    programWebsite: verified(args.programUrl, "verified", args.programUrl),
  };
  const applicationRound = args.data.applicationRequirements?.applicationRound;
  const deadlineVerification = args.verification.deadline;
  const applicationRoundVerification: Record<string, VerifiedOverrideField> =
    applicationRound && deadlineVerification
      ? {
          applicationRound: verified(
            applicationRound,
            deadlineVerification.status,
            deadlineVerification.sourceUrl,
            deadlineVerification.note,
          ),
        }
      : {};
  const programSummary = args.data.insights?.programSummary;
  const programSummaryVerification: Record<string, VerifiedOverrideField> = programSummary
    ? { programSummary: verified(programSummary, "verified", args.programUrl) }
    : {};
  return {
    id: args.id,
    legacyId: args.legacyId,
    school: args.school,
    program: args.program,
    degree: args.degree,
    programStatus,
    data: {
      schemaVersion: 2,
      schoolZh: args.schoolZh,
      normalizedSchoolName: args.school,
      programZh: args.programZh,
      field: "Mechanical Engineering",
      city: args.city,
      state: args.state,
      country: "United States",
      sources: { programWebsite: args.programUrl, ...args.data.sources },
      dataMetadata: {
        updatedAt: REVIEWED_AT,
        lastReviewedAt: REVIEWED_AT,
        migrationVersion: "report7-2026-07-28",
        dataOwner: "ApplyME",
      },
      ...args.data,
    },
    verification: {
      ...core,
      ...applicationRoundVerification,
      ...programSummaryVerification,
      ...args.verification,
    },
  };
}

const vtAdmissions = "https://me.vt.edu/for-students/graduate/admissions-funding.html";
const vtProgram = "https://me.vt.edu/for-students/graduate/mechanical-engineering.html";
const neuProgram = "https://graduate.northeastern.edu/programs/msme-mechanical-engineering/master-of-science-in-mechanical-engineering/";
const osuAdmissions = "https://mae.osu.edu/graduate/program/admissions";
const osuRequirements = "https://mae.osu.edu/spring-2027-requirements";
const osuHandbook = "https://mae.osu.edu/sites/default/files/uploads/GradForms/graduate_programs_handbook_web.pdf";
const uiucAdmissions = "https://mechse.illinois.edu/graduate/MEngME/apply";
const uiucProgram = "https://mechse.illinois.edu/graduate/graduate-degree-programs/master-engineering-mechanical-engineering";
const wiscProgram = "https://guide.wisc.edu/graduate/mechanical-engineering/mechanical-engineering-ms/";
const umdCatalog = "https://academiccatalog.umd.edu/graduate/programs/mechanical-engineering-pmme/";
const umdProgram = "https://mage.umd.edu/programs/mechanical";
const dukeProgram = "https://gradschool.duke.edu/academics/programs-degrees/mechanical-engineering-and-materials-science-ms/";
const dukeDeadline = "https://gradschool.duke.edu/admissions/application-deadlines/";

export const REPORT7_PROGRAM_V2_OVERRIDES: ProgramV2Override[] = [
  base({
    id: "vtech-me-ms-v2",
    legacyId: "vtech-me",
    school: "Virginia Polytechnic Institute and State University",
    schoolZh: "弗吉尼亚理工大学",
    program: "Mechanical Engineering",
    programZh: "机械工程理学硕士",
    degree: "MS",
    city: "Blacksburg",
    state: "Virginia",
    programUrl: vtProgram,
    data: {
      applicationRequirements: {
        applicationCycle: "Fall 2027",
        applicationRound: [
          { date: "2027-01-04", label: "Priority funding", deadlineType: "funding", intake: "Fall 2027", isPriority: true },
          { date: "2027-03-01", label: "MS final deadline", deadlineType: "final", intake: "Fall 2027" },
        ],
        applicationFee: { amount: 75, currency: "USD" },
        gre: { status: "optional", note: "GRE is optional." },
        toefl: { required: true, recommendedScore: 105 },
        ielts: { required: true, recommendedScore: 7 },
        letters: { required: true, count: 3 },
        cv: { required: true },
        sop: { required: true },
        credits: "30 credit hours",
        duration: "Typically 2 years",
      },
      insights: {
        highlights: ["MS offers thesis and non-thesis pathways.", "Research areas span autonomy, controls, design, manufacturing, mechanics and thermal-fluid systems."],
        bestFit: ["Applicants seeking a research-oriented MS with a possible thesis route.", "Students targeting controls, robotics, mechanics or thermal-fluid research."],
        riskFactors: ["Funding priority is earlier than the final MS deadline.", "Recommended English scores are higher than many university-wide minimums."],
        programSummary: "Research-oriented MS with thesis and non-thesis options.",
      },
      sources: { admissionRequirementSource: vtAdmissions, curriculumSource: vtProgram, applicationWebsite: vtAdmissions },
    },
    verification: {
      deadline: verified(["2027-01-04", "2027-03-01"], "verified", vtAdmissions),
      applicationFee: verified(75, "verified", vtAdmissions),
      gre: verified("optional", "optional", vtAdmissions),
      toefl: verified(105, "verified", vtProgram, "Program target score"),
      ielts: verified(7, "verified", vtProgram, "Program target score"),
      letters: verified(3, "verified", vtAdmissions),
      cv: verified(true, "verified", vtAdmissions),
      sop: verified(true, "verified", vtAdmissions),
      credits: verified("30 credit hours", "verified", vtProgram),
      duration: verified("Typically 2 years", "needs-manual-review", vtProgram, "No single fixed completion time is guaranteed."),
      tuition: verified(null, "not-found", vtAdmissions, "Program-specific official tuition was not located on the checked program pages."),
      highlights: verified(true, "verified", vtProgram),
      bestFit: verified(true, "verified", vtProgram),
      riskFactors: verified(true, "verified", vtAdmissions),
      curriculum: verified(true, "verified", vtProgram),
    },
  }),
  base({
    id: "neu-me-ms-v2",
    legacyId: "neu-me",
    school: "Northeastern University",
    schoolZh: "东北大学",
    program: "Mechanical Engineering",
    programZh: "机械工程理学硕士",
    degree: "MS",
    city: "Boston",
    state: "Massachusetts",
    programUrl: neuProgram,
    data: {
      applicationRequirements: {
        applicationCycle: "2025–2026 historical reference",
        applicationRound: [
          { date: "2025-12-01", label: "Early action", deadlineType: "priority", intake: "Fall (historical)" },
          { date: "2026-06-01", label: "International outside U.S.", deadlineType: "international", intake: "Fall (historical)" },
          { date: "2026-07-01", label: "International in U.S.", deadlineType: "international", intake: "Fall (historical)" },
          { date: "2026-08-01", label: "Domestic", deadlineType: "domestic", intake: "Fall (historical)" },
        ],
        gre: { status: "not-required", note: "Not required for the 2025–2026 cycle; historical reference only." },
        toefl: { required: true, waiverAvailable: true },
        ielts: { required: true, waiverAvailable: true },
        letters: { required: true, count: 2 },
        cv: { required: true },
        sop: { required: true },
        duration: "2 years",
      },
      tuition: {
        amount: 61728,
        currency: "USD",
        year: "2025–2026",
        billingBasis: "program",
        isInternationalStudent: null,
        includesFees: false,
        sourceUrl: neuProgram,
        verificationStatus: "historical",
        note: "Official estimated tuition shown for 2025–2026; historical reference, not Fall 2027 pricing.",
      },
      insights: {
        specializations: [
          { name: "Materials Science" }, { name: "Mechanics and Design" },
          { name: "Thermofluids" }, { name: "Mechatronics" },
        ],
        highlights: ["Thesis and non-thesis pathways.", "Optional cooperative education experience."],
        bestFit: ["Applicants seeking career-oriented coursework with an optional co-op.", "Students interested in mechatronics, thermofluids, mechanics/design or materials."],
        riskFactors: ["Published admissions and tuition values are historical for the target Fall 2027 report."],
      },
      sources: { admissionRequirementSource: neuProgram, tuitionSource: neuProgram, curriculumSource: neuProgram, applicationWebsite: neuProgram },
    },
    verification: {
      deadline: verified("2025–2026 deadlines", "historical", neuProgram),
      gre: verified("not required", "historical", neuProgram),
      toefl: verified("required unless waived", "historical", neuProgram),
      ielts: verified("required unless waived", "historical", neuProgram),
      letters: verified(2, "historical", neuProgram),
      cv: verified(true, "historical", neuProgram),
      sop: verified(true, "historical", neuProgram),
      duration: verified("2 years", "verified", neuProgram),
      tuition: verified(61728, "historical", neuProgram),
      specializations: verified(true, "verified", neuProgram),
      curriculum: verified(true, "verified", neuProgram),
      highlights: verified(true, "verified", neuProgram),
      bestFit: verified(true, "verified", neuProgram),
      riskFactors: verified(true, "verified", neuProgram),
    },
  }),
  base({
    id: "osu-me-ms-v2",
    legacyId: "osu-me",
    school: "Ohio State University",
    schoolZh: "俄亥俄州立大学",
    program: "Mechanical Engineering",
    programZh: "机械工程理学硕士",
    degree: "MS",
    city: "Columbus",
    state: "Ohio",
    programUrl: osuAdmissions,
    data: {
      applicationRequirements: {
        applicationCycle: "Spring/Autumn 2027",
        gre: { status: "not-required", note: "GRE permanently removed beginning Spring 2023." },
        toefl: { required: true, minimumScore: 79, waiverAvailable: true },
        ielts: { required: true, minimumScore: 7, waiverAvailable: true },
        letters: { required: true, count: 3 },
        cv: { required: true },
        sop: { required: true },
        credits: "30 graduate credit hours",
      },
      insights: {
        highlights: ["MS supports thesis and non-thesis/experiential pathways.", "Broad graduate course offerings in controls, mechanics, manufacturing and thermal sciences."],
        bestFit: ["Applicants seeking either a research thesis or structured non-thesis pathway."],
        riskFactors: ["Autumn 2027 deadlines were not yet published at the last verification date."],
      },
      sources: { admissionRequirementSource: osuRequirements, curriculumSource: osuHandbook, applicationWebsite: osuAdmissions },
    },
    verification: {
      deadline: verified(null, "not-published", osuAdmissions, "Autumn 2027 deadlines announced as forthcoming."),
      gre: verified("not required", "not-required", osuRequirements),
      toefl: verified(79, "verified", osuRequirements),
      ielts: verified(7, "verified", osuRequirements),
      letters: verified(3, "verified", osuRequirements),
      cv: verified(true, "verified", osuRequirements),
      sop: verified(true, "verified", osuRequirements),
      credits: verified(30, "verified", osuHandbook),
      tuition: verified(null, "not-found", osuAdmissions),
      curriculum: verified(true, "verified", osuHandbook),
      highlights: verified(true, "verified", osuHandbook),
      bestFit: verified(true, "verified", osuHandbook),
      riskFactors: verified(true, "verified", osuAdmissions),
    },
  }),
  base({
    id: "uiuc-me-meng-v2",
    legacyId: "uiuc-me",
    school: "University of Illinois Urbana-Champaign",
    schoolZh: "伊利诺伊大学厄巴纳-香槟分校",
    program: "Mechanical Engineering",
    programZh: "机械工程专业硕士",
    degree: "MEng",
    city: "Urbana",
    state: "Illinois",
    programUrl: uiucProgram,
    data: {
      applicationRequirements: {
        applicationCycle: "Spring 2027 / Fall 2027 pending",
        applicationRound: [{ date: "2026-10-01", label: "Spring 2027", deadlineType: "final", intake: "Spring 2027" }],
        applicationFee: { amount: 90, currency: "USD" },
        letters: { required: true, count: 3 },
        cv: { required: true },
        sop: { required: true },
        credits: "32 credit hours",
        duration: "1 year",
      },
      insights: {
        highlights: ["Coursework-focused professional MEng.", "Designed for rapid completion with technical and professional development coursework."],
        bestFit: ["Applicants prioritizing industry preparation and a one-year professional degree."],
        riskFactors: ["Fall 2027 deadline was not confirmed on the checked MEng page."],
      },
      sources: { admissionRequirementSource: uiucAdmissions, curriculumSource: uiucProgram, applicationWebsite: uiucAdmissions },
    },
    verification: {
      deadline: verified("2026-10-01 Spring 2027", "verified", uiucAdmissions, "Fall 2027 remains not yet published."),
      applicationFee: verified(90, "verified", uiucAdmissions),
      letters: verified(3, "verified", uiucAdmissions),
      cv: verified(true, "verified", uiucAdmissions),
      sop: verified(true, "verified", uiucAdmissions),
      gre: verified(null, "not-found", uiucAdmissions),
      toefl: verified(null, "not-found", uiucAdmissions),
      ielts: verified(null, "not-found", uiucAdmissions),
      credits: verified(32, "verified", uiucProgram),
      duration: verified("1 year", "verified", uiucProgram),
      tuition: verified(null, "not-found", uiucProgram),
      curriculum: verified(true, "verified", uiucProgram),
      highlights: verified(true, "verified", uiucProgram),
      bestFit: verified(true, "verified", uiucProgram),
      riskFactors: verified(true, "verified", uiucAdmissions),
    },
  }),
  base({
    id: "wisc-me-ms-v2",
    legacyId: "wisc-me",
    school: "University of Wisconsin–Madison",
    schoolZh: "威斯康星大学麦迪逊分校",
    program: "Mechanical Engineering",
    programZh: "机械工程理学硕士",
    degree: "MS",
    city: "Madison",
    state: "Wisconsin",
    programUrl: wiscProgram,
    review: true,
    data: {
      insights: {
        highlights: ["Official catalog lists multiple named MS options, including Research and Accelerated."],
        bestFit: ["Applicants who will confirm the specific named option before relying on deadlines or requirements."],
        riskFactors: ["The saved generic MS record does not identify a named option; requirements differ by option."],
      },
      sources: { curriculumSource: wiscProgram, admissionRequirementSource: wiscProgram, applicationWebsite: wiscProgram },
    },
    verification: {
      deadline: verified(null, "needs-manual-review", wiscProgram, "Named MS option is unresolved."),
      gre: verified(null, "needs-manual-review", wiscProgram, "Requirements vary by named option."),
      toefl: verified(null, "needs-manual-review", wiscProgram),
      ielts: verified(null, "needs-manual-review", wiscProgram),
      letters: verified(null, "needs-manual-review", wiscProgram),
      credits: verified(null, "needs-manual-review", wiscProgram),
      duration: verified(null, "needs-manual-review", wiscProgram),
      tuition: verified(null, "not-found", wiscProgram),
      curriculum: verified(true, "verified", wiscProgram),
      highlights: verified(true, "verified", wiscProgram),
      bestFit: verified(true, "verified", wiscProgram),
      riskFactors: verified(true, "verified", wiscProgram),
    },
  }),
  base({
    id: "umd-me-meng-v2",
    legacyId: "umd-me",
    school: "University of Maryland, College Park",
    schoolZh: "马里兰大学帕克分校",
    program: "Mechanical Engineering",
    programZh: "机械工程专业硕士",
    degree: "MEng",
    city: "College Park",
    state: "Maryland",
    programUrl: umdProgram,
    data: {
      applicationRequirements: {
        applicationCycle: "Fall 2027",
        applicationRound: [
          { date: "2027-03-09", label: "International", deadlineType: "international", intake: "Fall 2027" },
          { date: "2027-07-31", label: "Domestic", deadlineType: "domestic", intake: "Fall 2027" },
        ],
        gre: { status: "optional" },
        letters: { required: true, count: 2 },
        cv: { required: false, note: "Optional" },
        credits: "30 credits",
      },
      insights: {
        specializations: [{ name: "General Mechanical Engineering" }, { name: "Energy and the Environment" }],
        highlights: ["Professional coursework degree with General Mechanical and Energy & Environment pathways."],
        bestFit: ["Applicants seeking a professional, non-thesis MEng with flexible engineering coursework."],
        riskFactors: ["International and domestic applicants have different deadlines."],
      },
      sources: { admissionRequirementSource: umdCatalog, curriculumSource: umdProgram, applicationWebsite: umdCatalog },
    },
    verification: {
      deadline: verified(["2027-03-09", "2027-07-31"], "verified", umdCatalog),
      gre: verified("optional", "optional", umdCatalog),
      letters: verified(2, "verified", umdCatalog),
      cv: verified(false, "optional", umdCatalog),
      credits: verified(30, "verified", umdCatalog),
      toefl: verified(null, "not-found", umdCatalog),
      ielts: verified(null, "not-found", umdCatalog),
      sop: verified(null, "not-found", umdCatalog),
      tuition: verified(null, "not-found", umdProgram),
      specializations: verified(true, "verified", umdProgram),
      curriculum: verified(true, "verified", umdProgram),
      highlights: verified(true, "verified", umdProgram),
      bestFit: verified(true, "verified", umdProgram),
      riskFactors: verified(true, "verified", umdCatalog),
    },
  }),
  base({
    id: "duke-me-ms-v2",
    legacyId: "duke-me",
    school: "Duke University",
    schoolZh: "杜克大学",
    program: "Mechanical Engineering and Materials Science",
    programZh: "机械工程与材料科学理学硕士",
    degree: "MS",
    city: "Durham",
    state: "North Carolina",
    programUrl: dukeProgram,
    data: {
      applicationRequirements: {
        applicationCycle: "Fall 2026 historical / Fall 2027 not yet published",
        applicationRound: [{ date: "2026-01-15", label: "Fall 2026", deadlineType: "final", intake: "Fall 2026" }],
        gre: { status: "optional" },
        toefl: { required: true, waiverAvailable: true },
        ielts: { required: true, waiverAvailable: true },
        letters: { required: true, count: 3 },
        cv: { required: true },
        sop: { required: true },
      },
      insights: {
        specializations: [
          { name: "Aerospace Engineering" }, { name: "Dynamics, Robotics and Controls" },
          { name: "Materials Science" }, { name: "Mechanics and Design" }, { name: "Thermal Fluids" },
        ],
        highlights: ["Five formal areas of specialization.", "Flexible MS combining advanced coursework with optional research."],
        bestFit: ["Applicants seeking a flexible MS spanning robotics, mechanics, materials or thermal fluids."],
        riskFactors: ["The published Fall deadline is historical; Fall 2027 must be rechecked."],
      },
      sources: { admissionRequirementSource: dukeProgram, curriculumSource: dukeProgram, applicationWebsite: dukeDeadline },
    },
    verification: {
      deadline: verified("2026-01-15", "historical", dukeDeadline),
      gre: verified("optional", "optional", dukeProgram),
      toefl: verified("required unless waived", "verified", dukeProgram),
      ielts: verified("required unless waived", "verified", dukeProgram),
      letters: verified(3, "verified", dukeProgram),
      cv: verified(true, "verified", dukeProgram),
      sop: verified(true, "verified", dukeProgram),
      tuition: verified(null, "not-found", dukeProgram),
      specializations: verified(true, "verified", dukeProgram),
      curriculum: verified(true, "verified", dukeProgram),
      highlights: verified(true, "verified", dukeProgram),
      bestFit: verified(true, "verified", dukeProgram),
      riskFactors: verified(true, "verified", dukeDeadline),
    },
  }),
];
