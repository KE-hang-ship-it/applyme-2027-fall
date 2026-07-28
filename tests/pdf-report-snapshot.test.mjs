import assert from "node:assert/strict";
import test from "node:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { createPDFReportSnapshot } = await import(
  pathToFileURL(
    process.env.APPLYME_SNAPSHOT_MODULE ??
      join(tmpdir(), "applyme-pdf-report-snapshot.mjs"),
  ).href
);

const fixed = {
  generatedAt: "2026-07-27T00:00:00.000Z",
  reportId: "report-test",
  applicationCycle: "2027",
};

function legacy(id, overrides = {}) {
  return {
    id,
    school: "Example University",
    normalizedSchoolName: "example university",
    rank: 1,
    program: "Mechanical Engineering",
    degree: "MS",
    field: "Mechanical Engineering",
    deadline: "2027-01-01",
    letters: "3",
    cv: "Required",
    sop: "Required",
    gre: "Required",
    credits: "30",
    duration: "2 years",
    verified: "待复核",
    source: "https://example.edu/program",
    tracks: [],
    ...overrides,
  };
}

function selection(programId, category = "match", priority = "medium") {
  return {
    programId,
    category,
    priority,
    status: "considering",
    note: "",
    addedAt: "2026-07-01",
  };
}

test("legacy-only, missing profile, bilingual output, JSON stability and immutability", () => {
  const programs = [legacy("legacy-one")];
  const selections = [selection("legacy-one")];
  const before = JSON.stringify({ programs, selections });
  const zh = createPDFReportSnapshot({ ...fixed, programs, selections, language: "zh" });
  const en = createPDFReportSnapshot({ ...fixed, programs, selections, language: "en" });
  assert.equal(zh.ok, true);
  assert.equal(en.ok, true);
  assert.ok(zh.warnings.some((item) => item.code === "LEGACY_ONLY_PROGRAM"));
  assert.ok(zh.warnings.some((item) => item.code === "MISSING_USER_PROFILE"));
  assert.notEqual(zh.warnings[0].message, en.warnings[0].message);
  assert.equal(JSON.stringify({ programs, selections }), before);
  assert.deepEqual(JSON.parse(JSON.stringify(zh.snapshot)), zh.snapshot);
  assert.equal(
    JSON.stringify(zh),
    JSON.stringify(createPDFReportSnapshot({ ...fixed, programs, selections, language: "zh" })),
  );
});

test("split projects remain unresolved without an explicit canonical selection", () => {
  for (const id of ["princeton-mae", "uva-mae", "rice-me"]) {
    const result = createPDFReportSnapshot({
      ...fixed,
      programs: [legacy(id)],
      selections: [selection(id)],
    });
    assert.equal(result.ok, true);
    assert.equal(result.snapshot.programs[0].canonicalProgramId, null);
    assert.ok(result.warnings.some((item) => item.code === "SPLIT_PROGRAM_UNRESOLVED"));
  }
});

test("unknown project and invalid canonical mappings are errors", () => {
  const unknown = createPDFReportSnapshot({
    ...fixed,
    programs: [],
    selections: [selection("missing")],
  });
  assert.ok(unknown.errors.some((item) => item.code === "UNKNOWN_PROGRAM"));

  const invalid = createPDFReportSnapshot({
    ...fixed,
    programs: [legacy("princeton-mae")],
    selections: [selection("princeton-mae")],
    canonicalProgramSelections: { "princeton-mae": "invalid-id" },
  });
  assert.ok(invalid.errors.some((item) => item.code === "INVALID_CANONICAL_MAPPING"));
});

test("program ordering and Reach / Match / Safety counts are stable", () => {
  const programs = [
    legacy("legacy-z", { school: "Zulu University", normalizedSchoolName: "zulu university" }),
    legacy("legacy-a", { school: "Alpha University", normalizedSchoolName: "alpha university" }),
    legacy("legacy-m", { school: "Middle University", normalizedSchoolName: "middle university" }),
  ];
  const selections = [
    selection("legacy-m", "safety", "low"),
    selection("legacy-z", "reach", "high"),
    selection("legacy-a", "match", "medium"),
  ];
  const first = createPDFReportSnapshot({ ...fixed, programs, selections });
  const second = createPDFReportSnapshot({
    ...fixed,
    programs: [...programs].reverse(),
    selections: [...selections].reverse(),
  });
  assert.deepEqual(first.snapshot.programs, second.snapshot.programs);
  assert.deepEqual(first.snapshot.selectionSummary, {
    totalPrograms: 3,
    reachCount: 1,
    matchCount: 1,
    safetyCount: 1,
    reviewCount: 0,
    missingDataCount: 3,
    historicalDataCount: 0,
    unclassifiedCount: 0,
  });
});

test("all four user categories remain authoritative and keep PDF / Excel ordering", () => {
  const categories = ["reach", "match", "safety", "unclassified"];
  const programs = categories.map((category, index) =>
    legacy(`category-${category}`, {
      school: `${index} ${category} University`,
      normalizedSchoolName: `${index} ${category} university`,
    }),
  );
  const result = createPDFReportSnapshot({
    ...fixed,
    programs,
    selections: categories.map((category) => selection(`category-${category}`, category)),
  });
  assert.deepEqual(result.snapshot.programs.map((program) => program.category), categories);
  assert.deepEqual(result.snapshot.selectionSummary, {
    totalPrograms: 4,
    reachCount: 1,
    matchCount: 1,
    safetyCount: 1,
    reviewCount: 0,
    missingDataCount: 4,
    historicalDataCount: 0,
    unclassifiedCount: 1,
  });
});

test("missing profile downgrades to a candidate list without misleading zero categories", () => {
  const programs = [
    legacy("candidate-a"),
    legacy("candidate-b"),
  ];
  const selections = [
    selection("candidate-a", "unclassified"),
    selection("candidate-b", "unclassified"),
  ];
  const result = createPDFReportSnapshot({ ...fixed, programs, selections, language: "zh" });
  assert.equal(result.snapshot.reportMeta.reportMode, "candidate-list");
  assert.equal(result.snapshot.reportMeta.title, "ApplyME 候选项目清单");
  assert.equal(result.snapshot.selectionSummary.unclassifiedCount, 2);
  assert.equal(result.snapshot.programs[0].categoryDecision.origin, "unclassified");
  assert.ok(result.snapshot.reportMeta.profileMissingFields.includes("gpa"));
});

test("complete profile produces explainable reference categories for unclassified selections", () => {
  const profile = {
    applicationYear: "2027",
    targetDegree: ["MS"],
    targetMajor: ["Mechanical Engineering"],
    undergraduateSchool: "Example University",
    undergraduateMajor: "Mechanical Engineering",
    gpa: { value: 3.8, scale: 4 },
    toefl: { score: 105 },
    gre: { quantitative: 168 },
    researchExperience: [{ title: "Robotics research" }],
    workExperience: [{ title: "Engineering internship" }],
    projects: [],
    targetAreas: ["Robotics"],
    targetRegions: ["美国"],
    budget: { amount: 100000, currency: "USD", period: "program" },
    preferredProgramType: ["research"],
  };
  const result = createPDFReportSnapshot({
    ...fixed,
    userProfile: profile,
    programs: [legacy("profile-program")],
    selections: [selection("profile-program", "unclassified")],
    language: "en",
  });
  const program = result.snapshot.programs[0];
  assert.equal(result.snapshot.reportMeta.reportMode, "personalized");
  assert.equal(program.category, "unclassified");
  assert.equal(program.categoryDecision.origin, "rule");
  assert.equal(program.categoryDecision.referenceOnly, true);
  assert.notEqual(program.categoryDecision.value, "unclassified");
  assert.ok(program.categoryDecision.rationale.some(item => item.includes("not an admission probability")));
});

test("the seven mechanical-engineering regression projects use ProgramV2, classify, and normalize locations", () => {
  const ids = ["vtech-me", "neu-me", "osu-me", "uiuc-me", "wisc-me", "umd-me", "duke-me"];
  const schools = {
    "vtech-me": "Virginia Polytechnic Institute and State University",
    "neu-me": "Northeastern University",
    "osu-me": "Ohio State University",
    "uiuc-me": "University of Illinois Urbana-Champaign",
    "wisc-me": "University of Wisconsin–Madison",
    "umd-me": "University of Maryland, College Park",
    "duke-me": "Duke University",
  };
  const profile = {
    applicationYear: "2027",
    targetDegree: ["MS", "MEng"],
    targetMajor: ["Mechanical Engineering"],
    undergraduateSchool: "Example Engineering University",
    undergraduateMajor: "Mechanical Engineering",
    gpa: { value: 3.65, scale: 4 },
    toefl: { score: 105 },
    gre: { quantitative: 167, verbal: 158, analyticalWriting: 4 },
    researchExperience: [{ title: "Robotics laboratory research" }],
    internshipExperience: [{ title: "Mechanical engineering internship" }],
    projects: [{ title: "Autonomous vehicle project" }],
    targetAreas: ["Robotics", "Controls", "Thermal fluids"],
    targetRegions: ["United States"],
    budget: { amount: 120000, currency: "USD", period: "program" },
    preferredProgramType: ["research", "professional"],
  };
  const result = createPDFReportSnapshot({
    ...fixed,
    userProfile: profile,
    language: "zh",
    programs: ids.map(id => legacy(id, {
      school: schools[id],
      normalizedSchoolName: schools[id].toLowerCase(),
      region: id === "vtech-me" ? "美国" : "United States",
    })),
    selections: ids.map(id => selection(id, "unclassified")),
  });
  assert.equal(result.snapshot.reportMeta.reportMode, "personalized");
  assert.equal(result.snapshot.selectionSummary.totalPrograms, 7);
  assert.equal(result.snapshot.selectionSummary.unclassifiedCount, 7);
  assert.equal(result.snapshot.selectionSummary.reachCount, 0);
  assert.equal(result.snapshot.selectionSummary.matchCount, 0);
  assert.equal(result.snapshot.selectionSummary.safetyCount, 0);
  assert.ok(result.snapshot.programs.every(program => program.categoryDecision.origin === "rule"));
  assert.ok(result.snapshot.programs.every(program => program.canonicalProgramId));
  const vtech = result.snapshot.programs.find(program => program.legacyId === "vtech-me");
  assert.deepEqual(
    { city: vtech.university.city, state: vtech.university.state, country: vtech.university.country },
    { city: "Blacksburg", state: "Virginia", country: "United States" },
  );
  const wisconsin = result.snapshot.programs.find(program => program.legacyId === "wisc-me");
  assert.equal(wisconsin.programStatus, "REVIEW");
  assert.ok(result.warnings.some(item => item.code === "SOURCE_CONFLICT" && item.legacyId === "wisc-me"));
  const ohioState = result.snapshot.programs.find(program => program.legacyId === "osu-me");
  assert.ok(
    ohioState.deadlineSummary.length === 0 ||
      ohioState.deadlineSummary.every(deadline => deadline.fieldMeta.status === "not-yet-published"),
  );
});

test("location normalization prevents country values from occupying state", () => {
  const result = createPDFReportSnapshot({
    ...fixed,
    programs: [
      legacy("vtech-legacy", {
        school: "Virginia Polytechnic Institute and State University",
        normalizedSchoolName: "virginia polytechnic institute and state university",
        state: "美国",
        region: "美国",
        country: undefined,
      }),
    ],
    selections: [selection("vtech-legacy", "unclassified")],
  });
  const location = result.snapshot.programs[0].university;
  assert.equal(location.city, "Blacksburg");
  assert.equal(location.state, "Virginia");
  assert.equal(location.country, "United States");
  assert.ok(result.warnings.some(item => item.code === "LOCATION_CORRECTED"));
});

test("allowPartial=false blocks unresolved reports", () => {
  const result = createPDFReportSnapshot({
    ...fixed,
    programs: [legacy("princeton-mae")],
    selections: [selection("princeton-mae")],
    allowPartial: false,
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === "PARTIAL_REPORT_NOT_ALLOWED"));
});

test("field and URL source de-duplication is deterministic", () => {
  const result = createPDFReportSnapshot({
    ...fixed,
    programs: [legacy("berkeley-me")],
    selections: [selection("berkeley-me")],
  });
  const sources = result.snapshot.programs[0].officialSources;
  const keys = sources.map((item) => `${item.field}|${item.url}`);
  assert.equal(new Set(keys).size, keys.length);
});

test("historical deadline, tuition not-found, pending requirement, and REVIEW are disclosed", () => {
  const verified = createPDFReportSnapshot({
    ...fixed,
    programs: [legacy("berkeley-me")],
    selections: [selection("berkeley-me")],
  });
  assert.equal(verified.snapshot.programs[0].deadlineSummary[0].verificationStatus, "verified");
  assert.equal(verified.snapshot.programs[0].deadlineSummary[0].isCurrentCycle, true);
  assert.equal(verified.snapshot.programs[0].tuitionSummary.amount, null);
  assert.equal(verified.snapshot.programs[0].tuitionSummary.unavailable, true);
  assert.ok(verified.warnings.some((item) => item.code === "NOT_FOUND" && item.field === "tuition"));

  const brown = createPDFReportSnapshot({
    ...fixed,
    programs: [legacy("brown-me")],
    selections: [selection("brown-me")],
  });
  assert.ok(brown.warnings.some((item) => item.code === "HISTORICAL_DEADLINE"));
  assert.equal(brown.snapshot.programs[0].deadlineSummary[0]?.isCurrentCycle, false);

  const notreDame = createPDFReportSnapshot({
    ...fixed,
    programs: [legacy("notredame-me")],
    selections: [selection("notredame-me")],
  });
  const program = notreDame.snapshot.programs[0];
  assert.equal(program.programStatus, "REVIEW");
  assert.ok(program.riskFactors.some((item) => item.includes("未确认")));
  assert.ok(notreDame.warnings.some((item) => item.code === "REVIEW_PROGRAM"));
  assert.ok(
    notreDame.warnings.some((item) =>
      ["PENDING_VERIFICATION", "NOT_FOUND", "NOT_PUBLISHED"].includes(item.code),
    ),
  );

  const pendingCase = createPDFReportSnapshot({
    ...fixed,
    programs: [legacy("hku-me")],
    selections: [selection("hku-me")],
  });
  assert.ok(pendingCase.warnings.some((item) => item.code === "PENDING_VERIFICATION"));
});

test("multi-school education, GPA scales, and TOEFL scale remain unchanged in the snapshot", () => {
  const profile = {
    applicationYear: "2027",
    targetDegree: ["MS"],
    targetMajor: ["Mechanical Engineering"],
    educationExperiences: [
      {
        id: "cn-stage",
        school: "Hubei Polytechnic University",
        countryOrRegion: "China",
        major: "Mechanical Engineering",
        studyType: "2+2-first",
        gpa: { value: 86.7, scale: 100 },
        awardsDegree: false,
        finalGraduationSchool: false,
      },
      {
        id: "overseas-stage",
        school: "Partner University",
        countryOrRegion: "United States",
        major: "Mechanical Engineering",
        studyType: "2+2-second",
        gpa: { value: 3.62, scale: 4 },
        awardsDegree: true,
        finalGraduationSchool: true,
      },
    ],
    degreeMode: "single",
    toefl: { score: 5, scale: "1-6" },
    targetAreas: ["Robotics"],
  };
  const result = createPDFReportSnapshot({
    ...fixed,
    userProfile: profile,
    programs: [legacy("berkeley-me")],
    selections: [selection("berkeley-me", "match")],
  });
  assert.equal(result.snapshot.applicant.educationExperiences.length, 2);
  assert.equal(result.snapshot.applicant.educationExperiences[0].gpa.value, 86.7);
  assert.equal(result.snapshot.applicant.educationExperiences[0].gpa.scale, 100);
  assert.equal(result.snapshot.applicant.educationExperiences[1].gpa.value, 3.62);
  assert.equal(result.snapshot.applicant.educationExperiences[1].gpa.scale, 4);
  assert.equal(result.snapshot.applicant.degreeMode, "single");
  assert.equal(result.snapshot.applicant.toefl.score, 5);
  assert.equal(result.snapshot.applicant.toefl.scale, "1-6");
});

test("TOEFL not-taken is explicit and legacy single-school profiles remain compatible", () => {
  const notTaken = createPDFReportSnapshot({
    ...fixed,
    userProfile: {
      undergraduateSchool: "Legacy University",
      undergraduateMajor: "Mechanical Engineering",
      gpa: { value: 3.85, scale: 4 },
      toefl: { score: null, scale: "not-taken" },
      targetDegree: ["MEng"],
      targetMajor: ["Mechanical Engineering"],
      targetAreas: ["Manufacturing"],
    },
    programs: [legacy("berkeley-me")],
    selections: [selection("berkeley-me")],
  });
  assert.equal(notTaken.snapshot.applicant.educationExperiences[0].school, "Legacy University");
  assert.equal(notTaken.snapshot.applicant.educationExperiences[0].gpa.value, 3.85);
  assert.equal(notTaken.snapshot.applicant.toefl.score, null);
  assert.equal(notTaken.snapshot.applicant.toefl.scale, "not-taken");
});
