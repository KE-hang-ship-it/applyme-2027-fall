import type { SchoolListStats as SchoolListStatsType } from "@/types/application";

type SchoolListStatsProps = {
  stats: SchoolListStatsType;
  total: number;
  en: boolean;
};

export function SchoolListStats({ stats, total, en }: SchoolListStatsProps) {
  const cards = [
    {
      key: "total",
      title: en ? "Total" : "总数",
      value: total,
      description: en ? "All programs" : "全部项目",
      className: "school-list-stat-card school-list-stat-total",
    },
    {
      key: "reach",
      title: en ? "Reach" : "冲刺",
      value: stats.reach,
      description: en ? "Dream schools" : "梦想冲刺",
      className: "school-list-stat-card school-list-stat-reach",
    },
    {
      key: "match",
      title: en ? "Match" : "匹配",
      value: stats.match,
      description: en ? "Target schools" : "目标匹配",
      className: "school-list-stat-card school-list-stat-match",
    },
    {
      key: "safety",
      title: en ? "Safety" : "保底",
      value: stats.safety,
      description: en ? "Safe options" : "稳妥保底",
      className: "school-list-stat-card school-list-stat-safety",
    },
    {
      key: "unclassified",
      title: en ? "Unclassified" : "未分类",
      value: stats.unclassified,
      description: en ? "Not categorized" : "待分类",
      className: "school-list-stat-card school-list-stat-unclassified",
    },
  ];

  return (
    <div className="school-list-stats">
      {cards.map((card) => (
        <div key={card.key} className={card.className}>
          <span className="school-list-stat-title">{card.title}</span>
          <b className="school-list-stat-value">{card.value}</b>
          <span className="school-list-stat-description">{card.description}</span>
        </div>
      ))}
    </div>
  );
}