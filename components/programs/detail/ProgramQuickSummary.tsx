"use client";

import type { Program } from "@/types/application";
import { SchoolLogo } from "@/components/SchoolLogo";
import { RankingBadge } from "../RankingBadge";

type ProgramQuickSummaryProps = {
  program: Program;
  language: "zh" | "en";
};

const t = {
  zh: {
    location: "地点",
    duration: "项目时长",
    tuition: "预计学费",
    nationalRank: "综合大学排名",
    meRank: "机械工程排名",
    deadline: "截止日期",
    intake: "入学季",
    viewDetails: "查看详情",
    officialPage: "官方项目页",
    basicInfoOnly: "当前仅收录基础项目信息",
  },
  en: {
    location: "Location",
    duration: "Duration",
    tuition: "Estimated Tuition",
    nationalRank: "National University Ranking",
    meRank: "ME Ranking",
    deadline: "Deadline",
    intake: "Intake",
    viewDetails: "View Details",
    officialPage: "Official Page",
    basicInfoOnly: "Basic program information only",
  },
};

function getQuickSummary(program: Program, language: "zh" | "en"): string {
  const hasDegree = !!program.degree;
  const hasTracks = program.tracks && program.tracks.length > 0;
  const hasDuration = !!program.duration;
  
  if (hasDegree && hasTracks && hasDuration) {
    const degreeType = program.degree.includes("Master") ? "硕士" : program.degree;
    const mainTrack = program.tracks[0].name;
    return language === "zh"
      ? `这是一个${degreeType}项目，核心方向包括${mainTrack}。${program.duration}`
      : `This is a ${program.degree} program focusing on ${mainTrack}. ${program.duration}`;
  }
  
  if (hasDegree && hasDuration) {
    return language === "zh"
      ? `这是一个${program.degree}项目，${program.duration}`
      : `This is a ${program.degree} program. ${program.duration}`;
  }
  
  return t[language].basicInfoOnly;
}

export function ProgramQuickSummary({ program, language }: ProgramQuickSummaryProps) {
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

  return (
    <section className="program-quick-summary">
      <div className="program-quick-summary-header">
        <div className="program-quick-summary-logo">
          <SchoolLogo program={program} />
        </div>
        <div className="program-quick-summary-info">
          <span className="program-quick-summary-school">{program.school}</span>
          <h1 className="program-quick-summary-program">{program.program}</h1>
          <div className="program-quick-summary-tags">
            <span className="program-quick-summary-degree">{program.degree}</span>
            {program.field && <span className="program-quick-summary-field">{program.field}</span>}
          </div>
        </div>
      </div>

      <p className="program-quick-summary-summary">{getQuickSummary(program, language)}</p>

      <div className="program-quick-summary-grid">
        <div className="program-quick-summary-item">
          <span className="program-quick-summary-label">{texts.location}</span>
          <b className="program-quick-summary-value">
            {program.city && program.state ? `${program.city}, ${program.state}` : program.region || "-"}
          </b>
        </div>
        <div className="program-quick-summary-item">
          <span className="program-quick-summary-label">{texts.duration}</span>
          <b className="program-quick-summary-value">{program.duration || "-"}</b>
        </div>
        <div className="program-quick-summary-item">
          <span className="program-quick-summary-label">{texts.intake}</span>
          <b className="program-quick-summary-value">Fall</b>
        </div>
        <div className="program-quick-summary-item">
          <span className="program-quick-summary-label">{texts.deadline}</span>
          <b className="program-quick-summary-value">{program.deadline || "-"}</b>
        </div>
        <div className="program-quick-summary-item">
          <span className="program-quick-summary-label">{texts.tuition}</span>
          <b className="program-quick-summary-value">
            {program.tuitionReference?.amount || "-"}
          </b>
        </div>
      </div>

      <div className="program-quick-summary-rankings">
        {nationalRanking && (
          <div className="program-quick-summary-ranking">
            <span className="program-quick-summary-ranking-label">{texts.nationalRank}</span>
            <RankingBadge ranking={nationalRanking} language={language} compact />
          </div>
        )}
        {meRanking && (
          <div className="program-quick-summary-ranking">
            <span className="program-quick-summary-ranking-label">{texts.meRank}</span>
            <RankingBadge ranking={meRanking} language={language} compact />
          </div>
        )}
      </div>

      {program.programUrl && (
        <a
          href={program.programUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="program-quick-summary-official-link"
        >
          {texts.officialPage} ↗
        </a>
      )}
    </section>
  );
}