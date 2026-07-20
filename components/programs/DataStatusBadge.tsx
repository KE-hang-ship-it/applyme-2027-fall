"use client";

export type DataStatus = "verified" | "not-published" | "reference" | "not-available";

interface DataStatusBadgeProps {
  status: DataStatus;
  language: "zh" | "en";
  inline?: boolean;
}

const STATUS_LABELS = {
  zh: {
    verified: "已确认",
    "not-published": "官方尚未公布",
    reference: "参考数据",
    "not-available": "暂无数据",
  },
  en: {
    verified: "Confirmed",
    "not-published": "Not yet published",
    reference: "Reference",
    "not-available": "No data",
  },
};

const STATUS_COLORS = {
  verified: { bg: "#e5f5ea", text: "#287044", border: "#a3d9b8" },
  "not-published": { bg: "#fff3cd", text: "#856404", border: "#ffeeba" },
  reference: { bg: "#d1ecf1", text: "#0c5460", border: "#bee5eb" },
  "not-available": { bg: "#f8f9fa", text: "#6c757d", border: "#e9ecef" },
};

export function DataStatusBadge({ status, language, inline = false }: DataStatusBadgeProps) {
  const label = STATUS_LABELS[language][status];
  const colors = STATUS_COLORS[status];

  return (
    <span
      style={{
        display: inline ? "inline-block" : "block",
        fontSize: status === "not-available" ? "12px" : "13px",
        fontWeight: status === "not-available" ? 400 : 600,
        padding: inline ? "3px 8px" : "5px 10px",
        borderRadius: "999px",
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        whiteSpace: "nowrap",
        marginLeft: inline ? "6px" : 0,
      }}
    >
      {label}
    </span>
  );
}

export function getDataStatus(value: string | undefined | null): DataStatus {
  if (!value || value === "") return "not-available";
  const lower = value.toLowerCase();
  if (lower.includes("待公布") || lower.includes("not published")) return "not-published";
  if (lower.includes("待复核") || lower.includes("needs review") || lower.includes("pending") || lower.includes("尚未核实") || lower.includes("参考") || lower.includes("historical")) return "reference";
  return "verified";
}