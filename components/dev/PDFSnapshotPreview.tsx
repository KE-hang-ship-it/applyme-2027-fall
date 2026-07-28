"use client";

import { useEffect, useMemo, useState } from "react";
import { createPDFReportSnapshot } from "@/lib/create-pdf-report-snapshot";
import type {
  Program,
  SchoolListItem,
  UserSelection,
} from "@/types/application";
import type { SnapshotLanguage } from "@/types/pdf-report-snapshot";

type PDFSnapshotPreviewProps = {
  programs: readonly Program[];
  schoolListItems: readonly SchoolListItem[];
  initialLanguage: SnapshotLanguage;
};

function toUserSelection(item: SchoolListItem): UserSelection {
  return {
    ...item,
    priority: "unset",
    userNote: item.note,
    selectionReason: [],
    actionItems: [],
  };
}

const sectionStyle = {
  border: "1px solid #d7dde7",
  borderRadius: 10,
  padding: 16,
  background: "#fff",
} as const;

const preStyle = {
  margin: 0,
  padding: 12,
  borderRadius: 8,
  background: "#f5f7fa",
  color: "#172d4a",
  fontSize: 12,
  lineHeight: 1.55,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  overflow: "auto",
  maxHeight: 360,
} as const;

export function PDFSnapshotPreview({
  programs,
  schoolListItems,
  initialLanguage,
}: PDFSnapshotPreviewProps) {
  const [enabled, setEnabled] = useState(false);
  const [language, setLanguage] = useState<SnapshotLanguage>(initialLanguage);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    setEnabled(
      new URLSearchParams(window.location.search).get("snapshotPreview") === "1",
    );
  }, []);

  const selections = useMemo(
    () => schoolListItems.map(toUserSelection),
    [schoolListItems],
  );

  const result = useMemo(
    () =>
      createPDFReportSnapshot({
        userProfile: null,
        selections,
        programs,
        language,
        applicationCycle: "2027",
        generatedAt: "2026-07-27T00:00:00.000Z",
        reportId: "applyme-development-preview",
        allowPartial: true,
      }),
    [language, programs, selections],
  );

  if (!enabled) return null;

  const snapshot = result.snapshot;
  const labels =
    language === "zh"
      ? {
          title: "PDFReportSnapshot 开发预览",
          close: "关闭预览",
          meta: "报告信息",
          applicant: "申请人",
          summary: "选校汇总",
          programs: "项目",
          warnings: "报告警告",
          errors: "错误",
          json: "完整 JSON",
          empty: "当前选校名单为空。",
        }
      : {
          title: "PDFReportSnapshot Development Preview",
          close: "Close preview",
          meta: "Report meta",
          applicant: "Applicant",
          summary: "Selection summary",
          programs: "Programs",
          warnings: "Report warnings",
          errors: "Errors",
          json: "Complete JSON",
          empty: "The current school list is empty.",
        };

  return (
    <section
      aria-label={labels.title}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        overflow: "auto",
        background: "#eef2f7",
        color: "#172d4a",
        padding: "24px clamp(12px, 3vw, 40px) 64px",
      }}
    >
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <small style={{ color: "#66758a" }}>DEVELOPMENT ONLY</small>
          <h1 style={{ margin: "4px 0 0", color: "#172d4a" }}>{labels.title}</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setLanguage("zh")}
            aria-pressed={language === "zh"}
          >
            中文
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            aria-pressed={language === "en"}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete("snapshotPreview");
              window.history.replaceState({}, "", url);
              setEnabled(false);
            }}
          >
            {labels.close}
          </button>
        </div>
      </header>

      {!snapshot ? (
        <div style={sectionStyle}>
          <h2>{labels.errors}</h2>
          <pre style={preStyle}>{JSON.stringify(result.errors, null, 2)}</pre>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          <section style={sectionStyle}>
            <h2>{labels.meta}</h2>
            <pre style={preStyle}>{JSON.stringify(snapshot.reportMeta, null, 2)}</pre>
          </section>
          <section style={sectionStyle}>
            <h2>{labels.applicant}</h2>
            <pre style={preStyle}>{JSON.stringify(snapshot.applicant, null, 2)}</pre>
          </section>
          <section style={sectionStyle}>
            <h2>{labels.summary}</h2>
            <pre style={preStyle}>
              {JSON.stringify(snapshot.selectionSummary, null, 2)}
            </pre>
          </section>
          <section style={sectionStyle}>
            <h2>
              {labels.programs} ({snapshot.programs.length})
            </h2>
            {!snapshot.programs.length ? (
              <p>{labels.empty}</p>
            ) : (
              snapshot.programs.map((program) => (
                <details
                  key={`${program.legacyId}:${program.canonicalProgramId ?? "legacy"}`}
                  style={{ marginBottom: 10 }}
                >
                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                    {program.university.name} · {program.programName} ·{" "}
                    {program.programStatus}
                  </summary>
                  <pre style={{ ...preStyle, marginTop: 8 }}>
                    {JSON.stringify(program, null, 2)}
                  </pre>
                </details>
              ))
            )}
          </section>
          <section style={sectionStyle}>
            <h2>
              {labels.warnings} ({result.warnings.length})
            </h2>
            <pre style={preStyle}>{JSON.stringify(result.warnings, null, 2)}</pre>
          </section>
          <section style={sectionStyle}>
            <h2>
              {labels.errors} ({result.errors.length})
            </h2>
            <pre style={preStyle}>{JSON.stringify(result.errors, null, 2)}</pre>
          </section>
          <section style={sectionStyle}>
            <h2>{labels.json}</h2>
            <pre style={{ ...preStyle, maxHeight: 720 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </section>
        </div>
      )}
    </section>
  );
}
