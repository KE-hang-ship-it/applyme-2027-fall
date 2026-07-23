import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import {
  calculateDataQualityScore,
  classifyProgramStatus,
  isPlaceholderValue,
  isValidHttpUrl,
  resolveApplicationRequirement,
  resolveProgramSources,
  toProgramV2,
} from "../lib/program-v2.ts";
import { TOP20_PROGRAM_V2_OVERRIDES } from "../data/program-v2-top20.ts";
import { PROGRAM_V2_MIGRATION_REGISTRY } from "../lib/program-v2-registry.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function propertyName(node) {
  if (
    ts.isIdentifier(node) ||
    ts.isStringLiteral(node) ||
    ts.isNumericLiteral(node)
  ) {
    return node.text;
  }
  return undefined;
}

function readValue(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;

  if (ts.isArrayLiteralExpression(node)) return node.elements.map(readValue);

  if (ts.isObjectLiteralExpression(node)) {
    const result = {};
    for (const property of node.properties) {
      if (ts.isPropertyAssignment(property)) {
        result[propertyName(property.name)] = readValue(property.initializer);
      } else if (ts.isSpreadAssignment(property)) {
        Object.assign(result, readValue(property.expression));
      }
    }
    return result;
  }

  if (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "relatedProgram"
  ) {
    const args = node.arguments.map(readValue);
    return {
      id: args[0],
      school: args[1],
      rank: args[2],
      program: args[3],
      degree: args[4],
      field: args[5],
      source: args[6],
      tracks: args[7],
      verified: "已核实",
      deadline: "待公布",
      programUrl: args[6],
      regionalOrder: args[2],
      regionalOrderLabel: "分区参考序号",
      letters: "待复核",
      cv: "需要",
      sop: "需要",
      gre: "待复核",
      credits: "待复核",
      duration: "1–2年",
    };
  }

  return undefined;
}

function readDeclarations(relativePath) {
  const filename = path.join(root, relativePath);
  const content = fs.readFileSync(filename, "utf8");
  const source = ts.createSourceFile(
    filename,
    content,
    ts.ScriptTarget.Latest,
    true,
    filename.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const declarations = {};

  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      declarations[node.name.text] = readValue(node.initializer);
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return declarations;
}

function loadActivePrograms() {
  const dashboard = readDeclarations("app/dashboard/page.tsx");
  const added = readDeclarations("data/us-mechanical-programs-added.ts");
  const officialLinks = dashboard.OFFICIAL_LINKS ?? {};
  const groups = [
    dashboard.PROGRAMS,
    dashboard.EXTRA_PROGRAMS,
    dashboard.REGIONAL_PROGRAMS,
    dashboard.EXPANDED_PROGRAMS,
    added.US_MECHANICAL_PROGRAMS_ADDED,
  ];

  if (groups.some((group) => !Array.isArray(group))) {
    throw new Error("Could not safely parse one or more active program arrays.");
  }

  return groups.flat().map((program) => ({
    ...program,
    regionalOrder: program.regionalOrder ?? program.rank,
    regionalOrderLabel: program.regionalOrderLabel || "分区参考序号",
    ...(officialLinks[program.id] ?? {}),
  }));
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = key(item);
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function duplicates(programs, key) {
  const grouped = new Map();
  for (const program of programs) {
    const value = key(program);
    const records = grouped.get(value) ?? [];
    records.push(program.id);
    grouped.set(value, records);
  }
  return [...grouped.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([value, ids]) => ({ value, ids }));
}

function missingFields(program) {
  const v2 = toProgramV2(program);
  const requirements = resolveApplicationRequirement(v2);
  const sources = resolveProgramSources(v2);
  const missing = [];

  if (isPlaceholderValue(program.school)) missing.push("school");
  if (isPlaceholderValue(program.program)) missing.push("program");
  if (!isValidHttpUrl(sources.programWebsite)) missing.push("programWebsite");
  if (!requirements.deadline) missing.push("deadline");
  if (!isValidHttpUrl(sources.applicationWebsite)) missing.push("applicationWebsite");
  if (!v2.verificationV2?.fields || Object.keys(v2.verificationV2.fields).length === 0) {
    missing.push("verificationSources");
  }
  if (requirements.gre?.status === "unknown") missing.push("gre");
  if (requirements.letters?.required == null) missing.push("letters");
  if (!v2.tuition) missing.push("tuition");
  if (!v2.insights?.curriculum?.length) missing.push("curriculum");

  return missing;
}

function invalidUrls(program) {
  const candidates = {
    source: program.source,
    programUrl: program.programUrl,
    departmentUrl: program.departmentUrl,
    applicationUrl: program.applicationUrl,
    officialProgramUrl: program.officialProgramUrl,
    officialDepartmentUrl: program.officialDepartmentUrl,
    admissionRequirementsUrl: program.admissionRequirementsUrl,
    tuitionUrl: program.tuitionUrl,
    curriculumUrl: program.curriculumUrl,
  };
  return Object.entries(candidates)
    .filter(([, value]) => value !== undefined && !isValidHttpUrl(value))
    .map(([field, value]) => ({ field, value }));
}

const programs = loadActivePrograms();
const assessed = programs.map((program) => {
  const programStatus = classifyProgramStatus(program);
  const v2 = { ...toProgramV2(program), programStatus };
  return {
    program,
    programStatus,
    quality: calculateDataQualityScore(v2),
    missing: missingFields(v2),
    invalidUrls: invalidUrls(v2),
  };
});

const idDuplicates = duplicates(programs, (program) => program.id);
const programDuplicates = duplicates(
  programs,
  (program) => `${program.school}|${program.program}|${program.degree}`.toLowerCase(),
);

const placeholderMarkedVerified = programs
  .filter(
    (program) =>
      program.verified === "已核实" &&
      [program.deadline, program.gre, program.letters, program.credits].some(isPlaceholderValue),
  )
  .map((program) => program.id);

const statusConflicts = assessed
  .filter(
    ({ program, programStatus }) =>
      (programStatus === "PHD" || programStatus === "NOT_ME_PROGRAM") &&
      program.programStatus === "ACTIVE",
  )
  .map(({ program }) => program.id);

const regionalTuitionAsOfficial = assessed
  .filter(({ program }) => {
    const tuition = program.tuition;
    if (!tuition) return false;
    return /地区平均|regional average|区域平均/i.test(`${tuition.note ?? ""} ${tuition.displayText ?? ""}`);
  })
  .map(({ program }) => program.id);

const rankedForPriority = assessed
  .filter(({ programStatus }) => programStatus === "ACTIVE" || programStatus === "REVIEW")
  .sort((a, b) => {
    if (a.quality.total !== b.quality.total) return a.quality.total - b.quality.total;
    const aRank = typeof a.program.rank === "number" ? a.program.rank : 999;
    const bRank = typeof b.program.rank === "number" ? b.program.rank : 999;
    return aRank - bRank;
  })
  .slice(0, 20)
  .map(({ program, programStatus, quality, missing }) => ({
    id: program.id,
    school: program.school,
    program: program.program,
    programStatus,
    score: quality.total,
    grade: quality.grade,
    missing,
  }));

const validVerificationStates = new Set([
  "verified",
  "historical",
  "pending",
  "not-published",
  "not-found",
]);

function isVerificationRecord(value) {
  return (
    value &&
    typeof value === "object" &&
    Object.hasOwn(value, "value") &&
    validVerificationStates.has(value.status) &&
    isValidHttpUrl(value.sourceUrl) &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.lastVerifiedAt)
  );
}

function expectedVerificationKeys(override) {
  const keys = new Set([
    "school",
    "schoolZh",
    "program",
    "programZh",
    "degree",
    "field",
    "country",
    "state",
    "city",
    "programStatus",
    "tuition",
  ]);

  for (const key of Object.keys(override.data.applicationRequirements ?? {})) {
    if (key !== "intake" && key !== "applicationCycle") keys.add(key);
  }
  for (const key of Object.keys(override.data.insights ?? {})) keys.add(key);
  return [...keys];
}

function verificationCoverage(override) {
  const expected = expectedVerificationKeys(override);
  const valid = expected.filter((key) => isVerificationRecord(override.verification[key]));
  return {
    expected: expected.length,
    covered: valid.length,
    missing: expected.filter((key) => !valid.includes(key)),
  };
}

function toCheckedProgramV2(legacyProgram, override) {
  const base = toProgramV2(legacyProgram);
  const verificationFields = Object.fromEntries(
    Object.entries(override.verification)
      .filter(([, value]) => isVerificationRecord(value))
      .map(([field, value]) => [
        field,
        {
          status: value.status,
          sourceUrl: value.sourceUrl,
          lastVerifiedAt: value.lastVerifiedAt,
          note: value.note,
        },
      ]),
  );

  return {
    ...base,
    ...override.data,
    id: override.id,
    school: override.school,
    program: override.program,
    degree: override.degree,
    programStatus: override.programStatus,
    applicationRequirements: {
      ...base.applicationRequirements,
      ...override.data.applicationRequirements,
    },
    insights: {
      ...base.insights,
      ...override.data.insights,
    },
    sources: {
      ...base.sources,
      ...override.data.sources,
    },
    verificationV2: {
      overallStatus: override.programStatus === "REVIEW" ? "NEEDS_REVIEW" : "PARTIAL",
      fields: verificationFields,
    },
  };
}

const legacyById = new Map(programs.map((program) => [program.id, program]));
const legacyAssessmentById = new Map(assessed.map((item) => [item.program.id, item]));
const overrideIds = new Set(TOP20_PROGRAM_V2_OVERRIDES.map((override) => override.id));
const coverage = TOP20_PROGRAM_V2_OVERRIDES.map((override) => ({
  id: override.id,
  ...verificationCoverage(override),
}));

const missingLegacyRecords = TOP20_PROGRAM_V2_OVERRIDES
  .filter((override) => !legacyById.has(override.legacyId))
  .map((override) => ({ id: override.id, legacyId: override.legacyId }));

const historicalCurrentDeadlines = TOP20_PROGRAM_V2_OVERRIDES
  .filter(
    (override) =>
      override.verification.deadline?.status === "historical" &&
      override.data.applicationRequirements?.deadline,
  )
  .map((override) => override.id);

const invalidNotFoundTuition = TOP20_PROGRAM_V2_OVERRIDES
  .filter(
    (override) =>
      override.data.tuition?.verificationStatus === "not-found" &&
      (!isValidHttpUrl(override.data.tuition.sourceUrl) ||
        override.data.tuition.amount !== null),
  )
  .map((override) => override.id);

const registryIds = Object.values(PROGRAM_V2_MIGRATION_REGISTRY).flat();
const invalidRegistryReferences = registryIds.filter((id) => !overrideIds.has(id));
const unregisteredOverrides = [...overrideIds].filter((id) => !registryIds.includes(id));
const duplicateOverrideIds = duplicates(TOP20_PROGRAM_V2_OVERRIDES, (override) => override.id);
const duplicateCanonicalPrograms = duplicates(
  TOP20_PROGRAM_V2_OVERRIDES,
  (override) => `${override.school}|${override.program}|${override.degree}`.toLowerCase(),
);

const notreDame = TOP20_PROGRAM_V2_OVERRIDES.find(
  (override) => override.legacyId === "notredame-me",
);
const notreDameValid =
  notreDame?.programStatus === "REVIEW" &&
  notreDame.data.insights?.riskFactors?.includes(
    "未确认存在独立面向外部申请者的 Mechanical Engineering MS",
  ) &&
  ["deadline", "applicationFee", "gre", "toefl", "ielts", "letters", "cv", "sop"].every(
    (field) => notreDame.verification[field]?.status === "pending",
  );

const scoreChanges = TOP20_PROGRAM_V2_OVERRIDES.map((override) => {
  const legacy = legacyById.get(override.legacyId);
  const current = legacyAssessmentById.get(override.legacyId);
  if (!legacy || !current) {
    return {
      id: override.id,
      legacyId: override.legacyId,
      before: null,
      after: null,
      missing: ["legacyRecord"],
    };
  }
  const migrated = toCheckedProgramV2(legacy, override);
  const quality = calculateDataQualityScore(migrated);
  return {
    id: override.id,
    legacyId: override.legacyId,
    before: current.quality.total,
    after: quality.total,
    gradeBefore: current.quality.grade,
    gradeAfter: quality.grade,
    missing: missingFields(migrated),
  };
});

const migrationValidationErrors = [
  ...coverage
    .filter((item) => item.missing.length > 0)
    .map((item) => ({ check: "verificationCoverage", id: item.id, missing: item.missing })),
  ...missingLegacyRecords.map((item) => ({ check: "legacyRecord", ...item })),
  ...historicalCurrentDeadlines.map((id) => ({ check: "historicalCurrentDeadline", id })),
  ...invalidNotFoundTuition.map((id) => ({ check: "notFoundTuitionSource", id })),
  ...invalidRegistryReferences.map((id) => ({ check: "registryReference", id })),
  ...unregisteredOverrides.map((id) => ({ check: "unregisteredOverride", id })),
  ...duplicateOverrideIds.map((item) => ({ check: "duplicateOverrideId", ...item })),
  ...duplicateCanonicalPrograms.map((item) => ({ check: "duplicateCanonicalProgram", ...item })),
  ...(!notreDameValid ? [{ check: "notreDameReview" }] : []),
];

const report = {
  generatedAt: new Date().toISOString(),
  scoringVersion: "1.0.0",
  summary: {
    totalPrograms: programs.length,
    uniquePrograms: new Set(programs.map((program) => program.id)).size,
    statusCounts: countBy(assessed, (item) => item.programStatus),
    gradeCounts: countBy(
      assessed.filter(({ programStatus }) => programStatus === "ACTIVE" || programStatus === "REVIEW"),
      (item) => item.quality.grade,
    ),
  },
  duplicates: {
    ids: idDuplicates,
    schoolProgramDegree: programDuplicates,
  },
  fieldMissingCounts: countBy(
    assessed.flatMap(({ missing }) => missing.map((field) => ({ field }))),
    (item) => item.field,
  ),
  validationIssues: {
    invalidUrls: assessed
      .filter(({ invalidUrls: values }) => values.length > 0)
      .map(({ program, invalidUrls: values }) => ({ id: program.id, values })),
    placeholderMarkedVerified,
    statusConflicts,
    regionalTuitionAsOfficial,
  },
  priorityPrograms: rankedForPriority,
  migration: {
    legacyTop20Count: Object.keys(PROGRAM_V2_MIGRATION_REGISTRY).length,
    canonicalProgramV2Count: TOP20_PROGRAM_V2_OVERRIDES.length,
    splitRecordCount:
      TOP20_PROGRAM_V2_OVERRIDES.length - Object.keys(PROGRAM_V2_MIGRATION_REGISTRY).length,
    verification: {
      expectedFields: coverage.reduce((sum, item) => sum + item.expected, 0),
      coveredFields: coverage.reduce((sum, item) => sum + item.covered, 0),
      coveragePercent: Math.round(
        (coverage.reduce((sum, item) => sum + item.covered, 0) /
          coverage.reduce((sum, item) => sum + item.expected, 0)) *
          100,
      ),
    },
    checks: {
      passed: migrationValidationErrors.length === 0,
      errors: migrationValidationErrors,
    },
    scoreChanges,
  },
};

console.log(JSON.stringify(report, null, 2));
if (migrationValidationErrors.length > 0) process.exitCode = 1;
