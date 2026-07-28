export const PROGRAM_V2_MIGRATION_REGISTRY = {
  "princeton-mae": ["princeton-mae-mse", "princeton-mae-meng"],
  "upenn-robotics": ["upenn-robotics-mse"],
  "brown-me": ["brown-meam-scm"],
  "berkeley-me": ["berkeley-me-meng"],
  "ucla-me": ["ucla-mae-ms"],
  "vanderbilt-me": ["vanderbilt-me-ms"],
  "notredame-me": ["notredame-me-review"],
  "wustl-me": ["wustl-me-ms"],
  "uva-mae": ["uva-mae-ms", "uva-mae-meng"],
  "uf-me": ["uf-me-ms"],
  "utaustin-me": ["utaustin-me-ms"],
  "nyu-me": ["nyu-mechatronics-robotics-ms"],
  "tufts-me": ["tufts-me-ms"],
  "ucsb-me": ["ucsb-me-ms"],
  "lehigh-me": ["lehigh-me-ms"],
  "northwestern-me": ["northwestern-me-ms"],
  "rice-me": ["rice-me-mme", "rice-me-ms"],
  "gatech-me": ["gatech-me-msme"],
  "hku-me": ["hku-me-msceng"],
  "utoronto-me": ["utoronto-mie-meng"],
  "vtech-me": ["vtech-me-ms-v2"],
  "neu-me": ["neu-me-ms-v2"],
  "osu-me": ["osu-me-ms-v2"],
  "uiuc-me": ["uiuc-me-meng-v2"],
  "wisc-me": ["wisc-me-ms-v2"],
  "umd-me": ["umd-me-meng-v2"],
  "duke-me": ["duke-me-ms-v2"],
} as const;

export type MigratedLegacyProgramId = keyof typeof PROGRAM_V2_MIGRATION_REGISTRY;

export function getProgramV2Ids(legacyId: string): readonly string[] {
  return PROGRAM_V2_MIGRATION_REGISTRY[legacyId as MigratedLegacyProgramId] ?? [];
}

export function getDefaultProgramV2Id(legacyId: string): string | undefined {
  return getProgramV2Ids(legacyId)[0];
}
