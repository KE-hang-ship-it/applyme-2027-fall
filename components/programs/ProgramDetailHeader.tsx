"use client";

import type { ProgramV2 } from "@/types/application";
import { SchoolLogo } from "@/components/SchoolLogo";
import { RankingBadge } from "./RankingBadge";
import { fieldVerification } from "@/lib/program-detail-view";

interface ProgramDetailHeaderProps {
  program: ProgramV2;
  language: "zh" | "en";
  isSaved?: boolean;
  isInSchoolList?: boolean;
  isComparing?: boolean;
  onSave?: () => void;
  onAddToSchoolList?: () => void;
  onToggleCompare?: () => void;
}

const t = {
  zh: {
    save: "收藏",
    saved: "已收藏",
    addToSchoolList: "加入选校名单",
    addedToSchoolList: "已在选校名单",
    openWebsite: "项目官网",
    location: "地点",
    duration: "项目时长",
    tuition: "预计学费",
    nationalRank: "全国大学排名",
    meRank: "机械工程专业排名",
    verification: "验证状态",
    lastVerified: "最后核实日期",
    notAvailable: "暂无数据",
    applicationDeadline: "申请截止日期",
    confirmed: "已确认",
    "not-published": "官方尚未公布",
    reference: "参考数据",
  },
  en: {
    save: "Favorite",
    saved: "Favorited",
    addToSchoolList: "Add to School List",
    addedToSchoolList: "In School List",
    openWebsite: "Official Program Website",
    location: "Location",
    duration: "Program Duration",
    tuition: "Estimated Tuition",
    nationalRank: "National University Ranking",
    meRank: "Mechanical Engineering Ranking",
    verification: "Verification Status",
    lastVerified: "Last Verified Date",
    notAvailable: "No data",
    applicationDeadline: "Application Deadline",
    confirmed: "Confirmed",
    "not-published": "Not yet published",
    reference: "Reference",
  },
};

const deadlineInfo = (deadline: string) => {
  if (!deadline || deadline === "待公布") return { label: deadline || "待公布", days: null, tone: "unknown" };
  const days = Math.ceil((new Date(`${deadline}T23:59:59`).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: "Closed", days, tone: "expired" };
  return { label: `${days} Days Left`, days, tone: days > 60 ? "safe" : days >= 30 ? "watch" : days >= 15 ? "soon" : "urgent" };
};

function getDisplayStatus(program: ProgramV2, field: "deadline" | "duration" | "tuition"): { value: string; status: "confirmed" | "not-published" | "reference" | "empty" } {
  const verification = fieldVerification(program, field);
  if (verification) {
    if (verification.status === "not-found" || verification.status === "not-published") {
      return { value: "", status: verification.status === "not-published" ? "not-published" : "empty" };
    }
    const deadline = program.applicationRequirements?.applicationRound?.[0]?.date || program.applicationRequirements?.deadline || "";
    const duration = program.applicationRequirements?.duration || "";
    const tuition = program.tuition?.amount == null
      ? program.tuition?.displayText || ""
      : `${program.tuition.currency} ${program.tuition.amount.toLocaleString()} · ${program.tuition.year}`;
    return {
      value: field === "deadline" ? deadline : field === "duration" ? duration : tuition,
      status: verification.status === "verified" ? "confirmed" : "reference",
    };
  }
  const values: Record<string, { value: string; status: string }> = {
    deadline: { value: program.deadline, status: program.verified === "已核实" ? "confirmed" : program.deadline === "待公布" ? "not-published" : "reference" },
    duration: { value: program.duration, status: program.verified === "已核实" ? "confirmed" : "reference" },
    tuition: { value: program.tuitionReference?.amount || "", status: program.tuitionReference?.status === "verified" ? "confirmed" : program.tuitionReference?.status === "historical" ? "reference" : "empty" },
  };
  const result = values[field];
  if (!result.value || result.value === "" || result.value === "待公布") {
    return { value: "", status: "empty" };
  }
  return result as { value: string; status: "confirmed" | "not-published" | "reference" | "empty" };
}

export function ProgramDetailHeader({
  program,
  language,
  isSaved = false,
  isInSchoolList = false,
  isComparing = false,
  onSave,
  onAddToSchoolList,
  onToggleCompare,
}: ProgramDetailHeaderProps) {
  const texts = t[language];
  const nationalRanking = program.rank
    ? {
        source: "US News" as const,
        category: language === "en" ? "National University" : "全美大学",
        year: parseInt(program.rankYear || "2026", 10),
        rank: program.rank,
        verified: program.verified === "已核实",
      }
    : null;

  const meRanking = program.ranking && program.ranking.category?.toLowerCase().includes("mechanical")
    ? program.ranking
    : null;

  const deadlineDisplay = getDisplayStatus(program, "deadline");
  const deadlineVerification = fieldVerification(program, "deadline");
  const deadlineData = deadlineVerification?.status === "verified"
    ? deadlineInfo(deadlineDisplay.value)
    : { label: "", days: null, tone: "unknown" };
  const durationDisplay = getDisplayStatus(program, "duration");
  const tuitionDisplay = getDisplayStatus(program, "tuition");

  const statusBadge = (status: "confirmed" | "not-published" | "reference" | "empty") => {
    if (status === "empty") return null;
    return (
      <span
        style={{
          display: "inline-block",
          fontSize: "13px",
          fontWeight: 600,
          padding: "3px 9px",
          borderRadius: "999px",
          backgroundColor: status === "confirmed" ? "#e5f5ea" : status === "not-published" ? "#fff3cd" : "#d1ecf1",
          color: status === "confirmed" ? "#287044" : status === "not-published" ? "#856404" : "#0c5460",
          border: `1px solid ${status === "confirmed" ? "#a3d9b8" : status === "not-published" ? "#ffeeba" : "#bee5eb"}`,
          marginLeft: "8px",
        }}
      >
        {texts[status]}
      </span>
    );
  };

  return (
    <div className="program-detail-header" style={{
      background: "var(--surface)",
      borderBottom: "1px solid var(--hairline)",
      padding: "20px 24px",
    }}>
      <div style={{ display: "flex", alignItems: "start", gap: "18px", marginBottom: "18px" }}>
        <div style={{ flexShrink: 0 }}>
          <SchoolLogo program={program} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "18px",
            color: "var(--subtle)",
            marginBottom: "6px",
            fontWeight: 500,
          }}>
            {program.school || texts.notAvailable}
          </div>
          <h2 style={{
            fontFamily: "Georgia, 'Songti SC', serif",
            fontSize: "36px",
            color: "var(--text)",
            margin: "0 0 8px",
            fontWeight: 700,
            lineHeight: "1.25",
            maxHeight: "90px",
            overflow: "hidden",
          }}>
            {program.program || texts.notAvailable}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{
              background: "#edf3f8",
              color: "#244f7d",
              borderRadius: "999px",
              padding: "5px 12px",
              fontSize: "14px",
              fontWeight: 600,
            }}>
              {program.degree || texts.notAvailable}
            </span>
            {program.programStatus === "REVIEW" && (
              <span style={{
                background: "#fff3cd",
                color: "#856404",
                borderRadius: "999px",
                padding: "5px 12px",
                fontSize: "14px",
                fontWeight: 600,
              }}>
                REVIEW
              </span>
            )}
            <span style={{ fontSize: "14px", color: "var(--subtle)", fontWeight: 500 }}>
              {program.field || ""}
            </span>
          </div>
        </div>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        borderRadius: "12px",
        marginBottom: "18px",
        background: "var(--surface-2)",
      }}>
        <div>
          <span style={{ display: "block", fontSize: "13px", color: "var(--subtle)", fontWeight: 500, marginBottom: "6px" }}>
            {texts.applicationDeadline}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {deadlineDisplay.value ? (
              <>
                <strong style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: deadlineData.tone === "safe" ? "#2e8b57" :
                         deadlineData.tone === "watch" ? "#b88908" :
                         deadlineData.tone === "soon" ? "#d66d20" :
                         deadlineData.tone === "urgent" ? "#d43d3d" :
                         deadlineData.tone === "expired" ? "#8b94a2" : "var(--text)",
                }}>
                  {deadlineDisplay.value}
                </strong>
                {deadlineDisplay.status !== "confirmed" && statusBadge(deadlineDisplay.status)}
              </>
            ) : (
              <span style={{ fontSize: "15px", color: "var(--subtle)", fontWeight: 500 }}>{texts["not-published"]}</span>
            )}
          </div>
        </div>
        {deadlineData.days !== null && (
          <span style={{
            fontSize: "14px",
            fontWeight: 700,
            color: deadlineData.tone === "safe" ? "#2e8b57" :
                   deadlineData.tone === "watch" ? "#b88908" :
                   deadlineData.tone === "soon" ? "#d66d20" :
                   deadlineData.tone === "urgent" ? "#d43d3d" : "#8b94a2",
          }}>
            {deadlineData.label}
          </span>
        )}
      </div>

      <div className="overview-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "0",
        border: "1px solid var(--hairline)",
        borderRadius: "12px",
        overflow: "hidden",
        marginBottom: "14px",
      }}>
        <div style={{ padding: "14px 12px", borderRight: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)" }}>
          <span style={{ display: "block", fontSize: "12px", color: "var(--subtle)", fontWeight: 500, marginBottom: "6px" }}>
            {texts.location}
          </span>
          <b style={{ display: "block", fontSize: "15px", fontWeight: 600 }}>
            {program.region || texts.notAvailable}
          </b>
        </div>
        <div style={{ padding: "14px 12px", borderRight: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)" }}>
          <span style={{ display: "block", fontSize: "12px", color: "var(--subtle)", fontWeight: 500, marginBottom: "6px" }}>
            {texts.duration}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            {durationDisplay.value ? (
              <>
                <b style={{ fontSize: "15px", fontWeight: 600 }}>{durationDisplay.value}</b>
                {durationDisplay.status !== "confirmed" && statusBadge(durationDisplay.status)}
              </>
            ) : (
              <span style={{ fontSize: "13px", color: "var(--subtle)", fontWeight: 500 }}>{texts.notAvailable}</span>
            )}
          </div>
        </div>
        <div style={{ padding: "14px 12px", borderRight: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)" }}>
          <span style={{ display: "block", fontSize: "12px", color: "var(--subtle)", fontWeight: 500, marginBottom: "6px" }}>
            {texts.tuition}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            {tuitionDisplay.value ? (
              <>
                <b style={{ fontSize: "15px", fontWeight: 600 }}>{tuitionDisplay.value}</b>
                {tuitionDisplay.status !== "confirmed" && statusBadge(tuitionDisplay.status)}
              </>
            ) : (
              <span style={{ fontSize: "13px", color: "var(--subtle)", fontWeight: 500 }}>{texts.notAvailable}</span>
            )}
          </div>
        </div>
        <div style={{ padding: "14px 12px", borderRight: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)" }}>
          <span style={{ display: "block", fontSize: "12px", color: "var(--subtle)", fontWeight: 500, marginBottom: "6px" }}>
            {texts.nationalRank}
          </span>
          <div style={{ marginTop: "2px" }}>
            {nationalRanking ? (
              <RankingBadge ranking={nationalRanking} language={language} compact />
            ) : (
              <span style={{ fontSize: "13px", color: "var(--subtle)", fontWeight: 500 }}>{texts.notAvailable}</span>
            )}
          </div>
        </div>
        <div style={{ padding: "14px 12px", borderBottom: "1px solid var(--hairline)" }}>
          <span style={{ display: "block", fontSize: "12px", color: "var(--subtle)", fontWeight: 500, marginBottom: "6px" }}>
            {texts.meRank}
          </span>
          <div style={{ marginTop: "2px" }}>
            {meRanking ? (
              <RankingBadge ranking={meRanking} language={language} compact />
            ) : (
              <span style={{ fontSize: "13px", color: "var(--subtle)", fontWeight: 500 }}>{texts.notAvailable}</span>
            )}
          </div>
        </div>
      </div>

      <div style={{
        fontSize: "13px",
        color: "var(--subtle)",
        marginBottom: "16px",
        fontStyle: "italic",
        fontWeight: 500,
      }}>
        {program.lastVerifiedAt
          ? `${language === "zh" ? "最后核实" : "Last verified"}: ${program.lastVerifiedAt}`
          : texts.lastVerified}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onSave}
          style={{
            border: "1px solid var(--hairline)",
            background: isSaved ? "#f0f7ff" : "var(--surface)",
            color: isSaved ? "#1e5c8a" : "var(--text)",
            borderRadius: "10px",
            padding: "12px 18px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background .16s, border-color .16s",
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>{isSaved ? "★" : "☆"}</span>
          {isSaved ? texts.saved : texts.save}
        </button>

        <button
          type="button"
          onClick={onAddToSchoolList}
          style={{
            border: "none",
            background: isInSchoolList ? "#e5f5ea" : "var(--accent)",
            color: isInSchoolList ? "#287044" : "#fff",
            borderRadius: "10px",
            padding: "12px 18px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background .16s",
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>{isInSchoolList ? "✓" : "+"}</span>
          {isInSchoolList ? texts.addedToSchoolList : texts.addToSchoolList}
        </button>

        <button
          type="button"
          onClick={onToggleCompare}
          style={{
            border: "1px solid var(--hairline)",
            background: isComparing ? "#e5f0fa" : "var(--surface)",
            color: isComparing ? "#1e5c8a" : "var(--text)",
            borderRadius: "10px",
            padding: "12px 18px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background .16s, border-color .16s",
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>⇄</span>
          {isComparing ? (language === "zh" ? "已加入对比" : "Added to Compare") : (language === "zh" ? "加入对比" : "Add to Compare")}
        </button>

        {program.programUrl && (
          <a
            href={program.programUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              border: "1px solid var(--hairline)",
              background: "var(--surface)",
              color: "var(--accent)",
              borderRadius: "10px",
              padding: "12px 18px",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "background .16s",
              display: "inline-flex",
              alignItems: "center",
              minHeight: "44px",
              gap: "6px",
            }}
          >
            <span>↗</span>
            {texts.openWebsite}
          </a>
        )}
      </div>
    </div>
  );
}
