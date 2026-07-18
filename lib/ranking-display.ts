import type { Program, Ranking } from "@/types/application";

export function getTrustedRanking(program: Program): Ranking | null {
  if (program.ranking?.verified && program.ranking.source && program.ranking.category && program.ranking.year) return program.ranking;
  if (program.rankValue !== undefined && program.rankSource && program.rankYear && program.rankType) {
    const source = program.rankSource.toLowerCase().includes("qs") ? "QS" : program.rankSource.toLowerCase().includes("news") ? "US News" : null;
    const year = Number(program.rankYear);
    if (source && Number.isFinite(year)) return { source, category: program.rankType, year, rank: program.rankValue, verified: true, sourceUrl: program.rankUrl };
  }
  return null;
}
