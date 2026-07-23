"use client";

import type { FieldVerificationV2, ProgramV2, ProgramVerificationField } from "@/types/application";
import {
  fieldVerification,
  formatDocument,
  formatGRE,
  formatLanguageRequirement,
  formatMoney,
  NO_OFFICIAL_DATA,
} from "@/lib/program-detail-view";
import { VerificationStatus } from "../VerificationStatus";

type Props = { program: ProgramV2; language: "zh" | "en" };
type Row = { label: string; value: string; field: ProgramVerificationField };

export function ProgramAdmissions({ program, language }: Props) {
  const zh = language === "zh";
  const req = program.applicationRequirements;
  const rows: Row[] = [];
  const deadlines = req?.applicationRound?.length
    ? req.applicationRound
    : req?.deadline
      ? [{ date: req.deadline, intake: req.applicationCycle }]
      : [];

  for (const deadline of deadlines) {
    const labels = [
      zh ? "截止日期" : "Deadline",
      deadline.label || deadline.round,
      deadline.deadlineType,
      deadline.intake,
    ].filter(Boolean);
    rows.push({ label: labels.join(" · "), value: deadline.date || NO_OFFICIAL_DATA[language], field: "deadline" });
  }
  if (!deadlines.length) {
    rows.push({
      label: zh ? "截止日期" : "Deadline",
      value: fieldVerification(program, "deadline") ? NO_OFFICIAL_DATA[language] : program.deadline || NO_OFFICIAL_DATA[language],
      field: "deadline",
    });
  }

  rows.push(
    { label: zh ? "申请费" : "Application Fee", value: formatMoney(req?.applicationFee, language), field: "applicationFee" },
    { label: "GRE", value: formatGRE(req?.gre, language), field: "gre" },
    { label: "TOEFL", value: formatLanguageRequirement(req?.toefl, language), field: "toefl" },
    { label: "IELTS", value: formatLanguageRequirement(req?.ielts, language), field: "ielts" },
    { label: zh ? "推荐信" : "Recommendations", value: formatDocument(req?.letters, language), field: "letters" },
    { label: "CV / Resume", value: formatDocument(req?.cv, language), field: "cv" },
    { label: "SOP / Personal Statement", value: formatDocument(req?.sop, language), field: "sop" },
  );

  const sectionVerification =
    rows.map(row => fieldVerification(program, row.field)).find(Boolean) ??
    ({ status: "pending" } satisfies FieldVerificationV2);
  const applicationUrl = program.sources?.applicationWebsite || program.applicationUrl;

  return (
    <section id="admissions" className="program-detail-section program-admissions">
      <div className="program-detail-section-header">
        <span className="program-detail-section-badge">{zh ? "申请要求" : "Admissions"}</span>
        <h2 className="program-detail-section-title">{zh ? "申请要求" : "Admissions"}</h2>
        <VerificationStatus verification={sectionVerification} language={language} />
      </div>
      <div className="program-admissions-materials">
        {rows.map((row, index) => {
          const verification = fieldVerification(program, row.field) ?? { status: "pending" as const };
          return (
            <div key={`${row.field}-${index}`} className="program-admissions-material">
              <span className="program-admissions-material-label">{row.label}</span>
              <div className="program-admissions-material-value-row">
                <b className="program-admissions-material-value">{row.value}</b>
                <VerificationStatus verification={verification} language={language} />
              </div>
              {verification.sourceUrl && (
                <a href={verification.sourceUrl} target="_blank" rel="noopener noreferrer" className="program-sources-link-url">
                  {zh ? "官方来源" : "Official source"}
                </a>
              )}
              {verification.lastVerifiedAt && (
                <small>{zh ? "核查日期" : "Checked"}: {verification.lastVerifiedAt}</small>
              )}
            </div>
          );
        })}
      </div>
      {applicationUrl && (
        <a href={applicationUrl} target="_blank" rel="noopener noreferrer" className="program-admissions-apply-link">
          {zh ? "官方申请入口" : "Official application"} →
        </a>
      )}
    </section>
  );
}
