import {
  TOP20_PROGRAM_V2_OVERRIDES,
  type ProgramV2Override,
} from "../data/program-v2-top20";
import type {
  FieldVerificationV2,
  Program,
  ProgramV2,
  ProgramVerificationField,
} from "../types/application";
import { toProgramV2 } from "./program-v2";
import { getDefaultProgramV2Id, getProgramV2Ids } from "./program-v2-registry";

const overrideById = new Map(
  TOP20_PROGRAM_V2_OVERRIDES.map((override) => [override.id, override] as const),
);

const PROGRAM_VERIFICATION_FIELDS = new Set<ProgramVerificationField>([
  "programWebsite",
  "deadline",
  "applicationFee",
  "gre",
  "toefl",
  "ielts",
  "letters",
  "cv",
  "sop",
  "credits",
  "duration",
  "tuition",
  "ranking",
  "curriculum",
  "backgroundRequirement",
  "applicationLink",
]);

function toVerificationFields(
  override: ProgramV2Override,
): Partial<Record<ProgramVerificationField, FieldVerificationV2>> {
  const fields: Partial<Record<ProgramVerificationField, FieldVerificationV2>> = {};

  for (const [name, verification] of Object.entries(override.verification)) {
    if (!PROGRAM_VERIFICATION_FIELDS.has(name as ProgramVerificationField)) continue;
    fields[name as ProgramVerificationField] = {
      status: verification.status,
      lastVerifiedAt: verification.lastVerifiedAt,
      sourceUrl: verification.sourceUrl,
      note: verification.note,
    };
  }

  const programWebsite = override.data.sources?.programWebsite;
  if (programWebsite) {
    fields.programWebsite = {
      status: "verified",
      lastVerifiedAt: override.data.dataMetadata?.lastReviewedAt,
      sourceUrl: programWebsite,
    };
  }

  const applicationWebsite = override.data.sources?.applicationWebsite;
  if (applicationWebsite) {
    fields.applicationLink = {
      status: "verified",
      lastVerifiedAt: override.data.dataMetadata?.lastReviewedAt,
      sourceUrl: applicationWebsite,
    };
  }

  return fields;
}

function mergeOverride(legacy: Program, override: ProgramV2Override): ProgramV2 {
  const compatible = toProgramV2(legacy);

  return {
    ...compatible,
    ...override.data,
    id: override.id,
    school: override.school,
    program: override.program,
    degree: override.degree,
    programStatus: override.programStatus,
    applicationRequirements: {
      ...compatible.applicationRequirements,
      ...override.data.applicationRequirements,
    },
    insights: {
      ...compatible.insights,
      ...override.data.insights,
    },
    sources: {
      ...compatible.sources,
      ...override.data.sources,
    },
    verificationV2: {
      ...compatible.verificationV2,
      fields: {
        ...compatible.verificationV2?.fields,
        ...toVerificationFields(override),
      },
      overallStatus:
        override.programStatus === "REVIEW" ? "NEEDS_REVIEW" : "PARTIAL",
      lastReviewedAt: override.data.dataMetadata?.lastReviewedAt,
      note: "Top 20 ProgramV2 migration override; legacy Program remains unchanged.",
    },
  };
}

export function adaptProgramToV2(
  legacy: Program,
  programV2Id?: string,
): ProgramV2 {
  const selectedId = programV2Id ?? getDefaultProgramV2Id(legacy.id);
  if (!selectedId) return toProgramV2(legacy);

  const override = overrideById.get(selectedId);
  if (!override || override.legacyId !== legacy.id) return toProgramV2(legacy);

  return mergeOverride(legacy, override);
}

export function adaptProgramToAllV2Records(legacy: Program): ProgramV2[] {
  const migratedIds = getProgramV2Ids(legacy.id);
  if (migratedIds.length === 0) return [toProgramV2(legacy)];

  return migratedIds
    .map((id) => overrideById.get(id))
    .filter((override): override is ProgramV2Override => Boolean(override))
    .map((override) => mergeOverride(legacy, override));
}

export function getTop20ProgramV2Override(
  programV2Id: string,
): ProgramV2Override | undefined {
  return overrideById.get(programV2Id);
}
