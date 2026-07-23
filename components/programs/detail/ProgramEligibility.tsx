"use client";

import type { ProgramV2 } from "@/types/application";
import {
  fieldVerification,
  formatGRE,
  formatLanguageRequirement,
  NO_OFFICIAL_DATA,
} from "@/lib/program-detail-view";
import { VerificationStatus } from "../VerificationStatus";

type Props = { program: ProgramV2; language: "zh" | "en" };

export function ProgramEligibility({ program, language }: Props) {
  const zh = language === "zh";
  const background = program.insights?.backgroundRequirement;
  const req = program.applicationRequirements;
  const backgroundText = background?.note ||
    [
      ...(background?.preferredMajors || []),
      ...(background?.acceptedRelatedMajors || []),
    ].join(", ") ||
    program.field ||
    NO_OFFICIAL_DATA[language];
  const fields = [
    { label: zh ? "本科背景" : "Undergraduate Background", value: backgroundText, field: "backgroundRequirement" as const },
    { label: "GRE", value: formatGRE(req?.gre, language), field: "gre" as const },
    { label: "TOEFL", value: formatLanguageRequirement(req?.toefl, language), field: "toefl" as const },
    { label: "IELTS", value: formatLanguageRequirement(req?.ielts, language), field: "ielts" as const },
  ];
  const status = fieldVerification(program, "backgroundRequirement") ??
    fieldVerification(program, "gre") ??
    { status: "pending" as const };

  return (
    <section id="eligibility" className="program-detail-section program-eligibility">
      <div className="program-detail-section-header">
        <span className="program-detail-section-badge">{zh ? "申请资格" : "Eligibility"}</span>
        <h2 className="program-detail-section-title">{zh ? "申请资格" : "Eligibility"}</h2>
        <VerificationStatus verification={status} language={language} />
      </div>
      <div className="program-eligibility-grid">
        {fields.map(item => (
          <div key={item.field} className="program-eligibility-item">
            <span className="program-eligibility-label">{item.label}</span>
            <b className="program-eligibility-value">{item.value}</b>
            <VerificationStatus verification={fieldVerification(program, item.field) ?? { status: "pending" }} language={language} />
          </div>
        ))}
      </div>
      {background?.prerequisiteCourses?.length ? (
        <div className="program-detail-summary">
          <h3 className="program-detail-summary-title">{zh ? "先修课程" : "Prerequisites"}</h3>
          <ul className="program-detail-summary-list">
            {background.prerequisiteCourses.map(course => <li key={course}>{course}</li>)}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
