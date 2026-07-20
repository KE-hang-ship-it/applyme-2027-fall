import type { Program, Ranking } from "@/types/application";

export type RankingType = "national-university" | "graduate-mechanical-engineering";

export function getTrustedRanking(program: Program): Ranking | null {
  if (program.ranking?.verified && program.ranking.source && program.ranking.category && program.ranking.year) return program.ranking;
  if (program.rankValue !== undefined && program.rankSource && program.rankYear && program.rankType) {
    const source = program.rankSource.toLowerCase().includes("qs") ? "QS" : program.rankSource.toLowerCase().includes("news") ? "US News" : null;
    const year = Number(program.rankYear);
    if (source && Number.isFinite(year)) return { source, category: program.rankType, year, rank: program.rankValue, verified: true, sourceUrl: program.rankUrl };
  }
  return null;
}

export function getRankingByType(program: Program, rankingType: RankingType): Ranking | null {
  if (rankingType === "national-university") {
    if (program.nationalUniversityRanking?.verified && program.nationalUniversityRanking.rank !== null) {
      return program.nationalUniversityRanking;
    }
    return getNationalUniversityRanking(program);
  }
  
  if (rankingType === "graduate-mechanical-engineering") {
    if (program.mechanicalEngineeringRanking?.verified && program.mechanicalEngineeringRanking.rank !== null) {
      return program.mechanicalEngineeringRanking;
    }
    return null;
  }
  
  return null;
}

function getNationalUniversityRanking(program: Program): Ranking | null {
  if (program.nationalUniversityRanking?.verified && program.nationalUniversityRanking.rank !== null) {
    return program.nationalUniversityRanking;
  }
  
  if (program.ranking?.verified && program.ranking.category?.toLowerCase().includes("national") && program.ranking.rank !== null) {
    return program.ranking;
  }
  
  if (program.rank && program.rank > 0) {
    return {
      source: "US News",
      category: "National Universities",
      year: 2025,
      rank: program.rank,
      verified: false,
    };
  }
  
  return null;
}

export function getRankingValue(program: Program, rankingType: RankingType): number | null {
  const ranking = getRankingByType(program, rankingType);
  return ranking?.rank ?? null;
}