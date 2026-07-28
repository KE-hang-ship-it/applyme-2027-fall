"use client";

import type { ProgramV2 } from "@/types/application";
import { fieldVerification, localizedDetailText, NO_OFFICIAL_DATA } from "@/lib/program-detail-view";
import { VerificationStatus } from "../VerificationStatus";

type Props = { program: ProgramV2; language: "zh" | "en" };

export function ProgramHighlights({ program, language }: Props) {
  const zh = language === "zh";
  const insight = program.insights;
  const localizedBestFit = (insight?.bestFit || []).filter(item => localizedDetailText(item, language));
  const localizedHighlights = (insight?.highlights || []).filter(item => localizedDetailText(item, language));
  const localizedRisks = (insight?.riskFactors || []).filter(item => localizedDetailText(item, language));
  const bestFit = localizedBestFit.length
    ? localizedBestFit
    : program.tracks?.length
      ? [zh ? `适合关注 ${program.tracks.slice(0, 3).map(item => item.name).join("、")} 的申请者` : `Applicants interested in ${program.tracks.slice(0, 3).map(item => item.name).join(", ")}`]
      : [NO_OFFICIAL_DATA[language]];
  const highlights = localizedHighlights.length
    ? localizedHighlights
    : localizedDetailText(program.programSummary, language)
      ? [localizedDetailText(program.programSummary, language)!]
      : [NO_OFFICIAL_DATA[language]];
  const risks = localizedRisks.length ? localizedRisks : [NO_OFFICIAL_DATA[language]];
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
