"use client";

import type { Program } from "@/types/application";
import { SchoolLogo } from "@/components/SchoolLogo";

interface CompareBarProps {
  compare: string[];
  programs: Map<string, Program>;
  onRemove: (id: string) => void;
  onCompare: () => void;
  language: "zh" | "en";
  schoolNames: Record<string, string>;
}

export function CompareBar({ compare, programs, onRemove, onCompare, language, schoolNames }: CompareBarProps) {
  const canCompare = compare.length >= 2;
  
  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: "80px",
      background: "var(--surface)",
      borderTop: "1px solid var(--hairline)",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      zIndex: 500,
    }}>
      <div style={{ flexShrink: 0, minWidth: "120px" }}>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>
          {language === "zh" ? "已选择" : "Selected"} {compare.length}/3
        </div>
        <div style={{ fontSize: "13px", color: "var(--subtle)", fontWeight: 500 }}>
          {language === "zh" ? "最多选择 3 个项目" : "Up to 3 programs"}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", gap: "10px", overflowX: "auto", whiteSpace: "nowrap", paddingRight: "10px" }}>
        {compare.map((id) => {
          const program = programs.get(id);
          if (!program) return null;
          return (
            <div
              key={id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                background: "var(--surface-2)",
                borderRadius: "10px",
                border: "1px solid var(--hairline)",
              }}
            >
              <SchoolLogo program={program} size="small" />
              <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap" }}>
                {schoolNames[program.school] || program.school.split(" ")[0]}
              </span>
              <button
                onClick={() => onRemove(id)}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: "none",
                  background: "var(--subtle)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
                aria-label={language === "zh" ? `移除 ${program.school}` : `Remove ${program.school}`}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={onCompare}
        disabled={!canCompare}
        style={{
          flexShrink: 0,
          padding: "12px 20px",
          height: "44px",
          fontSize: "15px",
          fontWeight: 600,
          borderRadius: "10px",
          border: "none",
          cursor: canCompare ? "pointer" : "not-allowed",
          background: canCompare ? "var(--accent)" : "var(--surface-3)",
          color: canCompare ? "#fff" : "var(--subtle)",
          transition: "background .16s",
          whiteSpace: "nowrap",
        }}
      >
        {language === "zh" ? "对比" : "Compare"} {compare.length} {language === "zh" ? "所学校" : "Programs"}
      </button>
    </div>
  );
}