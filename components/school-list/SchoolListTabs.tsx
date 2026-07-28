import type { SchoolListCategory, SchoolListStats } from "@/types/application";

type TabKey = "all" | SchoolListCategory;

type SchoolListTabsProps = {
  activeTab: TabKey;
  stats: SchoolListStats;
  total: number;
  en: boolean;
  personalized?: boolean;
  onTabChange: (tab: TabKey) => void;
};

export function SchoolListTabs({ activeTab, stats, total, en, personalized = false, onTabChange }: SchoolListTabsProps) {
  const allTabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: en ? "All" : "全部", count: total },
    { key: "reach", label: en ? "Reach" : "冲刺", count: stats.reach },
    { key: "match", label: en ? "Match" : "匹配", count: stats.match },
    { key: "safety", label: en ? "Safety" : "保底", count: stats.safety },
    { key: "unclassified", label: en ? "Unclassified" : "未分类", count: stats.unclassified },
  ];
  const tabs = allTabs.filter(tab => personalized || tab.key === "all" || tab.count > 0);

  return (
    <div className="school-list-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`school-list-tab ${activeTab === tab.key ? "school-list-tab-active" : ""} school-list-tab-${tab.key}`}
          onClick={() => onTabChange(tab.key)}
        >
          <span>{tab.label}</span>
          <small>{tab.count}</small>
        </button>
      ))}
    </div>
  );
}
