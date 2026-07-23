"use client";

import type { ProgramV2 } from "@/types/application";
import { fieldVerification, NO_OFFICIAL_DATA } from "@/lib/program-detail-view";
import { VerificationStatus } from "../VerificationStatus";

type Props = { program: ProgramV2; language: "zh" | "en" };

export function ProgramHighlights({ program, language }: Props) {
  const zh = language === "zh";
  const insight = program.insights;
  const bestFit = insight?.bestFit?.length
    ? insight.bestFit
    : program.tracks?.length
      ? [zh ? `适合关注 ${program.tracks.slice(0, 3).map(item => item.name).join("、")} 的申请者` : `Applicants interested in ${program.tracks.slice(0, 3).map(item => item.name).join(", ")}`]
      : [NO_OFFICIAL_DATA[language]];
  const highlights = insight?.highlights?.length
    ? insight.highlights
    : program.programSummary
      ? [program.programSummary]
      : [NO_OFFICIAL_DATA[language]];
  const risks = insight?.riskFactors?.length ? insight.riskFactors : [NO_OFFICIAL_DATA[language]];
  const status = fieldVerification(program, "riskFactors") ??
    fieldVerification(program, "highlights") ??
    fieldVerification(program, "bestFit") ??
    { status: "pending" as const };

  const sections = [
    { title: zh ? "适合人群" : "Best Fit", items: bestFit },
    { title: zh ? "项目优势" : "Highlights", items: highlights },
    { title: zh ? "风险提示" : "Risk Factors", items: risks },
  ];

  return (
    <section id="highlights" className="program-detail-section program-highlights">
      <div className="program-detail-section-header">
        <span className="program-detail-section-badge">{zh ? "项目分析" : "Program Insights"}</span>
        <h2 className="program-detail-section-title">{zh ? "项目分析" : "Program Insights"}</h2>
        <VerificationStatus verification={status} language={language} />
      </div>
      <div className="program-highlights-sections">
        {sections.map(section => (
          <div key={section.title} className="program-highlights-section">
            <h3 className="program-highlights-section-title">{section.title}</h3>
            <ul className="program-highlights-list">
              {section.items.map((item, index) => <li key={index} className="program-highlights-item">{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
