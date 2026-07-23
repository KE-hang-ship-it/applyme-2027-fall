import type { FieldVerification } from "@/types/application";

const labels = {
  zh: { verified: "已核实", pending: "待确认", "not-published": "尚未公布", historical: "历史周期", "not-found": "未找到" },
  en: { verified: "Verified", pending: "Pending verification", "not-published": "Not published", historical: "Historical cycle", "not-found": "Not found" },
} as const;

export function VerificationStatus({ verification, language }: { verification: FieldVerification; language: "zh" | "en" }) {
  const detail = [labels[language][verification.status], verification.lastVerifiedAt ? `${language === "en" ? "Last verified" : "最后核实"}: ${verification.lastVerifiedAt}` : "", verification.note || ""].filter(Boolean).join(" · ");
  return <span className={`field-status status-${verification.status}`} title={detail} tabIndex={0}>{labels[language][verification.status]}</span>;
}
