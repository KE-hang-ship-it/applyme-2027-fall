import assert from "node:assert/strict";
import test from "node:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { createPDFReportSnapshot } = await import(
  pathToFileURL(join(tmpdir(), "applyme-pdf-report-snapshot.mjs")).href
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
  });
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
