"use client";

import type { Program } from "@/types/application";
import { DataStatusBadge } from "../DataStatusBadge";

type ProgramCostsProps = {
  program: Program;
  language: "zh" | "en";
};

const t = {
  zh: {
    title: "费用与时间",
    duration: "项目时长",
    credits: "学分要求",
    tuitionBasis: "学费计算方式",
    estimatedTuition: "预计学费",
    livingCost: "生活成本",
    totalCost: "预计总成本",
    applicationFee: "申请费",
    scholarships: "奖学金",
    tara: "TA / RA",
    intake: "入学季",
    notVerified: "暂未核实",
    notAvailable: "暂无数据",
    reference: "参考",
  },
  en: {
    title: "Costs & Timeline",
    duration: "Program Duration",
    credits: "Credits",
    tuitionBasis: "Tuition Basis",
    estimatedTuition: "Estimated Tuition",
    livingCost: "Living Costs",
    totalCost: "Estimated Total",
    applicationFee: "Application Fee",
    scholarships: "Scholarships",
    tara: "TA / RA",
    intake: "Intake",
    notVerified: "Not verified",
    notAvailable: "No data",
    reference: "Reference",
  },
};

export function ProgramCosts({ program, language }: ProgramCostsProps) {
  const texts = t[language];

  const fields = [
    { label: texts.duration, value: program.duration || texts.notVerified, status: program.verified === "已核实" ? "verified" as const : "reference" as const },
    { label: texts.credits, value: program.credits || texts.notVerified, status: program.verified === "已核实" ? "verified" as const : "reference" as const },
    { label: texts.tuitionBasis, value: "-", status: "reference" as const },
    { label: texts.estimatedTuition, value: program.tuitionReference?.amount || texts.notVerified, status: program.tuitionReference?.status === "verified" ? "verified" as const : "reference" as const },
    { label: texts.livingCost, value: "-", status: "reference" as const },
    { label: texts.totalCost, value: "-", status: "reference" as const },
    { label: texts.applicationFee, value: "-", status: "reference" as const },
    { label: texts.scholarships, value: "-", status: "reference" as const },
    { label: texts.tara, value: "-", status: "reference" as const },
    { label: texts.intake, value: "Fall", status: "verified" as const },
  ];

  return (
    <section id="costs" className="program-detail-section program-costs">
      <div className="program-detail-section-header">
        <span className="program-detail-section-badge">{texts.title}</span>
        <h2 className="program-detail-section-title">{texts.title}</h2>
        <span className="program-detail-section-status">部分核实</span>
      </div>
      
      <div className="program-costs-grid">
        {fields.map((field, index) => (
          <div key={index} className="program-costs-item">
            <span className="program-costs-label">{field.label}</span>
            <div className="program-costs-value-row">
              <b className="program-costs-value">{field.value}</b>
              {field.status !== "verified" && (
                <DataStatusBadge status={field.status} language={language} inline />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="program-costs-note">
        <DataStatusBadge status="reference" language={language} inline />
        {language === "zh"
          ? "学费与生活费仅为规划参考，申请前请务必在大学官网核实最新信息。"
          : "Tuition and living costs are for planning reference only. Always verify the latest information on the official university website before applying."}
      </div>
    </section>
  );
}