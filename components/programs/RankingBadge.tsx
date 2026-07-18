import type { Ranking } from "@/types/application";

export function RankingBadge({ ranking, language, compact = false }: { ranking: Ranking | null; language: "zh" | "en"; compact?: boolean }) {
  if (!ranking) return <span className={`ranking-badge is-pending ${compact ? "is-compact" : ""}`}>{language === "en" ? "Ranking data pending verification" : "排名数据待核实"}</span>;
  const title = `${ranking.source} ${ranking.category} · ${ranking.year}`;
  const content = <><b>{ranking.rank === null ? "—" : `#${ranking.rank}`}</b><span>{title}</span></>;
  return ranking.sourceUrl ? <a className={`ranking-badge ${compact ? "is-compact" : ""}`} href={ranking.sourceUrl} target="_blank" rel="noopener noreferrer" title={title}>{content}</a> : <span className={`ranking-badge ${compact ? "is-compact" : ""}`} title={title}>{content}</span>;
}
