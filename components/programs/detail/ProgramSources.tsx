"use client";

import type { Program } from "@/types/application";

type ProgramSourcesProps = {
  program: Program;
  language: "zh" | "en";
};

const t = {
  zh: {
    title: "来源与核实状态",
    officialProgramPage: "官方项目页",
    officialDepartmentPage: "官方院系页",
    courseCatalog: "课程目录",
    admissionRequirements: "申请要求页",
    tuitionPage: "学费页",
    rankingSource: "排名来源",
    rankingYear: "排名年份",
    lastVerified: "最后核实日期",
    verifiedFields: "已核实字段",
    pendingFields: "待核实字段",
    notAvailable: "暂无链接",
  },
  en: {
    title: "Sources & Verification",
    officialProgramPage: "Official Program Page",
    officialDepartmentPage: "Official Department Page",
    courseCatalog: "Course Catalog",
    admissionRequirements: "Admission Requirements",
    tuitionPage: "Tuition Page",
    rankingSource: "Ranking Source",
    rankingYear: "Ranking Year",
    lastVerified: "Last Verified",
    verifiedFields: "Verified Fields",
    pendingFields: "Pending Fields",
    notAvailable: "Not available",
  },
};

export function ProgramSources({ program, language }: ProgramSourcesProps) {
  const texts = t[language];

  const sources = [
    { label: texts.officialProgramPage, url: program.programUrl },
    { label: texts.officialDepartmentPage, url: program.departmentUrl },
    { label: texts.courseCatalog, url: program.curriculumUrl },
    { label: texts.admissionRequirements, url: program.admissionRequirementsUrl },
    { label: texts.tuitionPage, url: program.tuitionUrl },
  ];

  const verifiedFields = [];
  const pendingFields = [];

  if (program.deadline && program.verified === "已核实") verifiedFields.push(texts.rankingYear);
  else if (program.deadline) pendingFields.push(texts.rankingYear);

  if (program.tuitionReference?.status === "verified") verifiedFields.push(texts.tuitionPage);
  else if (program.tuitionReference) pendingFields.push(texts.tuitionPage);

  if (program.nationalUniversityRanking?.verified) verifiedFields.push(texts.rankingSource);
  else if (program.nationalUniversityRanking) pendingFields.push(texts.rankingSource);

  if (program.mechanicalEngineeringRanking?.verified) verifiedFields.push(texts.rankingSource);
  else if (program.mechanicalEngineeringRanking) pendingFields.push(texts.rankingSource);

  if (verifiedFields.length === 0) verifiedFields.push("-");
  if (pendingFields.length === 0) pendingFields.push("-");

  return (
    <section id="sources" className="program-detail-section program-sources">
      <div className="program-detail-section-header">
        <span className="program-detail-section-badge">{texts.title}</span>
        <h2 className="program-detail-section-title">{texts.title}</h2>
        <span className="program-detail-section-status">部分核实</span>
      </div>
      
      <div className="program-sources-links">
        {sources.map((source, index) => (
          <div key={index} className="program-sources-link-item">
            <span className="program-sources-link-label">{source.label}</span>
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="program-sources-link-url"
              >
                {source.url} ↗
              </a>
            ) : (
              <span className="program-sources-link-unavailable">{texts.notAvailable}</span>
            )}
          </div>
        ))}
      </div>

      <div className="program-sources-info">
        <div className="program-sources-info-item">
          <span className="program-sources-info-label">{texts.rankingSource}</span>
          <span className="program-sources-info-value">US News</span>
        </div>
        <div className="program-sources-info-item">
          <span className="program-sources-info-label">{texts.rankingYear}</span>
          <span className="program-sources-info-value">{program.rankYear || "2026"}</span>
        </div>
        <div className="program-sources-info-item">
          <span className="program-sources-info-label">{texts.lastVerified}</span>
          <span className="program-sources-info-value">{program.lastVerifiedAt || "-"}</span>
        </div>
      </div>

      <div className="program-sources-verification">
        <div className="program-sources-verification-item">
          <span className="program-sources-verification-label">{texts.verifiedFields}</span>
          <div className="program-sources-verification-list">
            {verifiedFields.map((field, index) => (
              <span key={index} className="program-sources-verification-tag verified">
                {field}
              </span>
            ))}
          </div>
        </div>
        <div className="program-sources-verification-item">
          <span className="program-sources-verification-label">{texts.pendingFields}</span>
          <div className="program-sources-verification-list">
            {pendingFields.map((field, index) => (
              <span key={index} className="program-sources-verification-tag pending">
                {field}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}