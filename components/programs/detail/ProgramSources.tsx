"use client";

import type { ProgramV2 } from "@/types/application";
import { verificationText } from "@/lib/program-detail-view";

type Props = { program: ProgramV2; language: "zh" | "en" };

export function ProgramSources({ program, language }: Props) {
  const zh = language === "zh";
  const sources = [
    [zh ? "项目官网" : "Program Website", program.sources?.programWebsite || program.programUrl],
    [zh ? "院系官网" : "Department Website", program.sources?.departmentWebsite || program.departmentUrl],
    [zh ? "申请入口" : "Application Website", program.sources?.applicationWebsite || program.applicationUrl],
    [zh ? "申请要求来源" : "Admissions Source", program.sources?.admissionRequirementSource || program.admissionRequirementsUrl],
    [zh ? "学费来源" : "Tuition Source", program.sources?.tuitionSource || program.tuitionUrl],
    [zh ? "课程来源" : "Curriculum Source", program.sources?.curriculumSource || program.curriculumUrl],
  ] as const;
  const verificationEntries = Object.entries(program.verificationV2?.fields || {});

  return (
    <section id="sources" className="program-detail-section program-sources">
      <div className="program-detail-section-header">
        <span className="program-detail-section-badge">{zh ? "来源与核实状态" : "Sources & Verification"}</span>
        <h2 className="program-detail-section-title">{zh ? "来源与核实状态" : "Sources & Verification"}</h2>
        <span className="program-detail-section-status">
          {program.verificationV2?.overallStatus === "VERIFIED" ? (zh ? "已核实" : "Verified") : (zh ? "部分字段待确认" : "Some fields pending")}
        </span>
      </div>
      <div className="program-sources-links">
        {sources.map(([label, url]) => (
          <div key={label} className="program-sources-link-item">
            <span className="program-sources-link-label">{label}</span>
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="program-sources-link-url">{url} →</a>
            ) : (
              <span className="program-sources-link-unavailable">{zh ? "暂无官方链接" : "No official link"}</span>
            )}
          </div>
        ))}
      </div>
      <div className="program-sources-info">
        <div className="program-sources-info-item">
          <span className="program-sources-info-label">{zh ? "最后复核" : "Last Reviewed"}</span>
          <span className="program-sources-info-value">{program.verificationV2?.lastReviewedAt || program.lastVerifiedAt || "-"}</span>
        </div>
      </div>
      <div className="program-sources-verification">
        {verificationEntries.map(([field, verification]) => (
          <div key={field} className="program-sources-verification-item">
            <span className="program-sources-verification-label">{field}</span>
            <div className="program-sources-verification-list">
              <span className={`program-sources-verification-tag ${verification.status}`}>
                {verificationText(verification.status, language)}
              </span>
              {verification.lastVerifiedAt && <span>{verification.lastVerifiedAt}</span>}
              {verification.sourceUrl && (
                <a href={verification.sourceUrl} target="_blank" rel="noopener noreferrer" className="program-sources-link-url">
                  {zh ? "来源" : "Source"}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
