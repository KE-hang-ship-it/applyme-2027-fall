"use client";

import type { Program } from "@/types/application";

type ProgramEligibilityProps = {
  program: Program;
  language: "zh" | "en";
};

const t = {
  zh: {
    title: "适不适合我",
    undergraduateBackground: "本科背景",
    requiresMe: "是否要求机械工程本科",
    acceptsRelated: "是否接受相关工科",
    acceptsNonRelated: "是否接受跨专业",
    prerequisites: "先修课程",
    gpa: "GPA",
    gre: "GRE",
    toefl: "TOEFL",
    ielts: "IELTS",
    workExperience: "工作经验",
    advisorRequired: "是否需要联系导师",
    summary: "总结",
    suitableBackground: "适合什么背景",
    crossMajorNote: "跨专业申请需要注意",
    unconfirmed: "当前无法确认",
    notVerified: "暂未核实",
    yes: "是",
    no: "否",
  },
  en: {
    title: "Am I Eligible?",
    undergraduateBackground: "Undergraduate Background",
    requiresMe: "ME Undergrad Required?",
    acceptsRelated: "Accepts Related Engineering?",
    acceptsNonRelated: "Accepts Non-Related?",
    prerequisites: "Prerequisites",
    gpa: "GPA",
    gre: "GRE",
    toefl: "TOEFL",
    ielts: "IELTS",
    workExperience: "Work Experience",
    advisorRequired: "Advisor Contact Required?",
    summary: "Summary",
    suitableBackground: "Suitable Background",
    crossMajorNote: "Cross-Major Considerations",
    unconfirmed: "Cannot confirm at this time",
    notVerified: "Not verified",
    yes: "Yes",
    no: "No",
  },
};

function getEligibilitySummary(program: Program, language: "zh" | "en") {
  const texts = t[language];
  const items = [];
  
  if (program.degree) {
    items.push(language === "zh" 
      ? `适合希望攻读${program.degree}的学生` 
      : `Suitable for students pursuing a ${program.degree}`);
  }
  
  if (program.tracks && program.tracks.length > 0) {
    const tracks = program.tracks.slice(0, 2).map(t => t.name).join("、");
    items.push(language === "zh"
      ? `核心方向包括${tracks}`
      : `Core areas include ${tracks}`);
  }
  
  if (program.gre) {
    items.push(language === "zh"
      ? `GRE${program.gre}`
      : `GRE ${program.gre}`);
  }
  
  if (items.length === 0) {
    items.push(texts.notVerified);
  }
  
  return items;
}

export function ProgramEligibility({ program, language }: ProgramEligibilityProps) {
  const texts = t[language];
  
  const fields = [
    { label: texts.undergraduateBackground, value: program.field || texts.notVerified },
    { label: texts.requiresMe, value: texts.notVerified },
    { label: texts.acceptsRelated, value: texts.notVerified },
    { label: texts.acceptsNonRelated, value: texts.notVerified },
    { label: texts.prerequisites, value: "-" },
    { label: texts.gpa, value: "-" },
    { label: texts.gre, value: program.gre || texts.notVerified },
    { label: texts.toefl, value: "-" },
    { label: texts.ielts, value: "-" },
    { label: texts.workExperience, value: "-" },
    { label: texts.advisorRequired, value: "-" },
  ];

  return (
    <section id="eligibility" className="program-detail-section program-eligibility">
      <div className="program-detail-section-header">
        <span className="program-detail-section-badge">{texts.title}</span>
        <h2 className="program-detail-section-title">{texts.title}</h2>
        <span className="program-detail-section-status">暂未核实</span>
      </div>
      
      <div className="program-eligibility-grid">
        {fields.map((field, index) => (
          <div key={index} className="program-eligibility-item">
            <span className="program-eligibility-label">{field.label}</span>
            <b className="program-eligibility-value">{field.value}</b>
          </div>
        ))}
      </div>

      <div className="program-detail-summary">
        <h3 className="program-detail-summary-title">{texts.summary}</h3>
        <ul className="program-detail-summary-list">
          {getEligibilitySummary(program, language).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}