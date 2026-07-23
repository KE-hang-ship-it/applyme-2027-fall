"use client";

import type { ProgramV2, ProgramVerificationField } from "@/types/application";
import { fieldVerification, formatMoney, NO_OFFICIAL_DATA } from "@/lib/program-detail-view";
import { VerificationStatus } from "../VerificationStatus";

type Props = { program: ProgramV2; language: "zh" | "en" };

export function ProgramCosts({ program, language }: Props) {
  const zh = language === "zh";
  const req = program.applicationRequirements;
  const tuitionVerification = fieldVerification(program, "tuition");
  let tuitionValue = program.tuitionReference?.amount || NO_OFFICIAL_DATA[language];

  if (tuitionVerification) {
    if (tuitionVerification.status === "not-found") {
      tuitionValue = zh
        ? "未找到项目专属官方学费"
        : "No program-specific official tuition found";
    } else if (program.tuition?.amount !== null && program.tuition?.amount !== undefined) {
      tuitionValue = `${program.tuition.currency} ${program.tuition.amount.toLocaleString()} · ${program.tuition.year}`;
    } else {
      tuitionValue = program.tuition?.displayText || NO_OFFICIAL_DATA[language];
    }
  }

  const fields: Array<{ label: string; value: string; field: ProgramVerificationField }> = [
    { label: zh ? "项目时长" : "Duration", value: req?.duration || program.duration || NO_OFFICIAL_DATA[language], field: "duration" },
    { label: zh ? "学分要求" : "Credits", value: req?.credits || program.credits || NO_OFFICIAL_DATA[language], field: "credits" },
    { label: zh ? "项目学费" : "Program Tuition", value: tuitionValue, field: "tuition" },
    { label: zh ? "申请费" : "Application Fee", value: formatMoney(req?.applicationFee, language), field: "applicationFee" },
  ];

  return (
    <section id="costs" className="program-detail-section program-costs">
      <div className="program-detail-section-header">
        <span className="program-detail-section-badge">{zh ? "费用与时间" : "Costs & Timeline"}</span>
        <h2 className="program-detail-section-title">{zh ? "费用与时间" : "Costs & Timeline"}</h2>
        <VerificationStatus verification={tuitionVerification ?? { status: "pending" }} language={language} />
      </div>
      <div className="program-costs-grid">
        {fields.map(item => {
          const verification = fieldVerification(program, item.field) ?? { status: "pending" as const };
          return (
            <div key={item.field} className="program-costs-item">
              <span className="program-costs-label">{item.label}</span>
              <div className="program-costs-value-row">
                <b className="program-costs-value">{item.value}</b>
                <VerificationStatus verification={verification} language={language} />
              </div>
              {verification.sourceUrl && (
                <a href={verification.sourceUrl} target="_blank" rel="noopener noreferrer" className="program-sources-link-url">
                  {zh ? "官方来源" : "Official source"}
                </a>
              )}
              {verification.lastVerifiedAt && <small>{zh ? "核查日期" : "Checked"}: {verification.lastVerifiedAt}</small>}
            </div>
          );
        })}
      </div>
      <div className="program-costs-note">
        {zh
          ? "仅展示项目专属官方数据；未找到时不会使用地区平均值或推算金额。"
          : "Only program-specific official data is shown; regional averages and estimates are excluded."}
      </div>
    </section>
  );
}
