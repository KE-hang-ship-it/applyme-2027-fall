import type { Ranking } from "@/types/application";

interface RankingBadgeProps {
  ranking: Ranking | null;
  language: "zh" | "en";
  compact?: boolean;
  rankingType?: "national-university" | "graduate-mechanical-engineering";
}

export function RankingBadge({ ranking, language, compact = false, rankingType }: RankingBadgeProps) {
  if (!ranking) {
    return (
      <span className={`ranking-badge is-pending ${compact ? "is-compact" : ""}`}>
        {language === "en" ? "Not currently verified" : "当前未能核实"}
      </span>
    );
  }

  const yearLabel = `${ranking.year}–${String(ranking.year + 1).slice(-2)}`;
  const rankDisplay = ranking.rank === null ? "—" : `#${ranking.rank}`;
  const tieLabel = ranking.tied ? (language === "en" ? " (tie)" : "（并列）") : "";

  const title = `${ranking.source} ${ranking.category} · ${yearLabel}`;
  
  const content = (
    <>
      <b>{rankDisplay}{tieLabel}</b>
      <span className="ranking-year">{yearLabel}</span>
      <span className={`ranking-status ${ranking.verified ? "is-verified" : "is-pending"}`}>
        {ranking.verified ? (language === "en" ? "Verified" : "已确认") : (language === "en" ? "Reference" : "参考数据")}
      </span>
    </>
  );

  return ranking.sourceUrl ? (
    <a
      className={`ranking-badge ${compact ? "is-compact" : ""}`}
      href={ranking.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
    >
      {content}
    </a>
  ) : (
    <span className={`ranking-badge ${compact ? "is-compact" : ""}`} title={title}>
      {content}
    </span>
  );
}