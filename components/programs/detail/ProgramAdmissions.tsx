"use client";

import type { Program } from "@/types/application";
import { DataStatusBadge, getDataStatus } from "../DataStatusBadge";

type ProgramAdmissionsProps = {
  program: Program;
  language: "zh" | "en";
};

const t = {
  zh: {
    title: "怎么申请",
    applicationOpen: "申请开放时间",
    deadline: "截止日期",
    applicationFee: "申请费",
    transcripts: "成绩单",
    resume: "简历",
    sop: "Statement of Purpose",
    ps: "Personal Statement",
    recommendations: "推荐信",
    gre: "GRE",
    toefl: "TOEFL",
    ielts: "IELTS",
    portfolio: "作品集",
    applyNow: "官方申请入口",
    verified: "已核实",
    notVerified: "暂未核实",
    notRequired: "不要求",
    optional: "可选",
  },
  en: {
    title: "How to Apply",
    applicationOpen: "Application Opens",
    deadline: "Deadline",
    applicationFee: "Application Fee",
    transcripts: "Transcripts",
    resume: "Resume",
    sop: "Statement of Purpose",
    ps: "Personal Statement",
    recommendations: "Recommendations",
    gre: "GRE",
    toefl: "TOEFL",
    ielts: "IELTS",
    portfolio: "Portfolio",
    applyNow: "Apply Now",
    verified: "Verified",
    notVerified: "Not verified",
    notRequired: "Not required",
    optional: "Optional",
  },
};

type MaterialStatus = "verified" | "not-verified" | "not-required" | "optional";

interface ApplicationMaterial {
  label: string;
  value: string;
  status: MaterialStatus;
}

function getApplicationMaterials(program: Program, language: "zh" | "en"): ApplicationMaterial[] {
  const texts = t[language];
  return [
    { label: texts.applicationOpen, value: "-", status: "not-verified" },
    { label: texts.deadline, value: program.deadline || texts.notVerified, status: program.verified === "已核实" ? "verified" : "not-verified" },
    { label: texts.applicationFee, value: "-", status: "not-verified" },
    { label: texts.transcripts, value: texts.verified, status: "verified" },
    { label: texts.resume, value: program.cv || texts.notVerified, status: program.cv ? "verified" : "not-verified" },
    { label: texts.sop, value: program.sop || texts.notVerified, status: program.sop ? "verified" : "not-verified" },
    { label: texts.recommendations, value: program.letters || texts.notVerified, status: program.letters ? "verified" : "not-verified" },
    { label: texts.gre, value: program.gre || texts.notVerified, status: program.gre ? "verified" : "not-verified" },
    { label: texts.toefl, value: "-", status: "not-verified" },
    { label: texts.ielts, value: "-", status: "not-verified" },
    { label: texts.portfolio, value: texts.notRequired, status: "not-required" },
  ];
}

export function ProgramAdmissions({ program, language }: ProgramAdmissionsProps) {
  const texts = t[language];
  const materials = getApplicationMaterials(program, language);

  const statusStyles: Record<MaterialStatus, { bg: string; text: string; border: string }> = {
    verified: { bg: "#e5f5ea", text: "#287044", border: "#a3d9b8" },
    "not-verified": { bg: "#fff3cd", text: "#856404", border: "#ffeeba" },
    "not-required": { bg: "#f8f9fa", text: "#6c757d", border: "#dee2e6" },
    optional: { bg: "#d1ecf1", text: "#0c5460", border: "#bee5eb" },
  };

  return (
    <section id="admissions" className="program-detail-section program-admissions">
      <div className="program-detail-section-header">
        <span className="program-detail-section-badge">{texts.title}</span>
        <h2 className="program-detail-section-title">{texts.title}</h2>
        <span className="program-detail-section-status">部分核实</span>
      </div>
      
      <div className="program-admissions-materials">
        {materials.map((material, index) => {
          const style = statusStyles[material.status];
          return (
            <div key={index} className="program-admissions-material">
              <span className="program-admissions-material-label">{material.label}</span>
              <div className="program-admissions-material-value-row">
                <b className="program-admissions-material-value">{material.value}</b>
                <span
                  className="program-admissions-material-status"
                  style={{
                    backgroundColor: style.bg,
                    color: style.text,
                    borderColor: style.border,
                  }}
                >
                  {texts[material.status.replace("-", "") as keyof typeof texts]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {program.applicationUrl && (
        <a
          href={program.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="program-admissions-apply-link"
        >
          {texts.applyNow} ↗
        </a>
      )}
    </section>
  );
}