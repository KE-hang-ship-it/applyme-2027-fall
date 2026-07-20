"use client";

import type { Program } from "@/types/application";
import { RankingBadge } from "../RankingBadge";

type ProgramDifficultyReferenceProps = {
  program: Program;
  language: "zh" | "en";
  userCategory?: string;
};

const t = {
  zh: {
    title: "申请难度参考",
    nationalRank: "综合排名",
    meRank: "机械工程排名",
    rankYear: "排名年份",
    programType: "项目类型",
    thesisOption: "Thesis Option",
    advisorRequired: "导师匹配",
    classSize: "班级规模",
    userCategory: "我的分类",
    disclaimer: "冲刺、匹配、保底由用户根据个人背景设置，不代表官方录取概率。",
    courseBased: "课程型",
    researchBased: "研究型",
    hybrid: "混合型",
    notVerified: "暂未核实",
    reach: "冲刺",
    match: "匹配",
    safety: "保底",
    unclassified: "未分类",
  },
  en: {
    title: "Difficulty Reference",
    nationalRank: "National Ranking",
    meRank: "ME Ranking",
    rankYear: "Rank Year",
    programType: "Program Type",
    thesisOption: "Thesis Option",
    advisorRequired: "Advisor Matching",
    classSize: "Class Size",
    userCategory: "My Label",
    disclaimer: "Reach, match, and safety labels are user-defined and do not represent official admission probabilities.",
    courseBased: "Course-based",
    researchBased: "Research-based",
    hybrid: "Hybrid",
    notVerified: "Not verified",
    reach: "Reach",
    match: "Match",
    safety: "Safety",
    unclassified: "Unclassified",
  },
};

export function ProgramDifficultyReference({ program, language, userCategory }: ProgramDifficultyReferenceProps) {
  const texts = t[language];
  
  const nationalRanking = program.nationalUniversityRanking || (program.rank
    ? {
        source: "US News" as const,
        category: language === "en" ? "National University" : "全美大学",
        year: parseInt(program.rankYear || "2026", 10),
        rank: program.rank,
        verified: program.verified === "已核实",
      }
    : null);

  const meRanking = program.mechanicalEngineeringRanking;

  const categoryLabels: Record<string, string> = {
    reach: texts.reach,
    match: texts.match,
    safety: texts.safety,
    unclassified: texts.unclassified,
  };

  return (
    <section id="difficulty" className="program-detail-section program-difficulty">
      <div className="program-detail-section-header">
        <span className="program-detail-section-badge">{texts.title}</span>
        <h2 className="program-detail-section-title">{texts.title}</h2>
        <span className="program-detail-section-status">部分核实</span>
      </div>
      
      <div className="program-difficulty-content">
        <div className="program-difficulty-rankings">
          {nationalRanking && (
            <div className="program-difficulty-ranking">
              <span className="program-difficulty-label">{texts.nationalRank}</span>
              <RankingBadge ranking={nationalRanking} language={language} compact />
            </div>
          )}
          {meRanking && (
            <div className="program-difficulty-ranking">
              <span className="program-difficulty-label">{texts.meRank}</span>
              <RankingBadge ranking={meRanking} language={language} compact />
            </div>
          )}
        </div>

        <div className="program-difficulty-grid">
          <div className="program-difficulty-item">
            <span className="program-difficulty-label">{texts.programType}</span>
            <b className="program-difficulty-value">{texts.courseBased}</b>
          </div>
          <div className="program-difficulty-item">
            <span className="program-difficulty-label">{texts.thesisOption}</span>
            <b className="program-difficulty-value">{texts.notVerified}</b>
          </div>
          <div className="program-difficulty-item">
            <span className="program-difficulty-label">{texts.advisorRequired}</span>
            <b className="program-difficulty-value">{texts.notVerified}</b>
          </div>
          <div className="program-difficulty-item">
            <span className="program-difficulty-label">{texts.classSize}</span>
            <b className="program-difficulty-value">{texts.notVerified}</b>
          </div>
          <div className="program-difficulty-item">
            <span className="program-difficulty-label">{texts.userCategory}</span>
            <b className={`program-difficulty-value program-difficulty-category ${userCategory}`}>
              {categoryLabels[userCategory || "unclassified"] || texts.unclassified}
            </b>
          </div>
        </div>

        <div className="program-difficulty-disclaimer">
          {texts.disclaimer}
        </div>
      </div>
    </section>
  );
}