import type { FieldVerification } from "@/types/application";

const labels = {
  zh: { verified: "已核实", pending: "待确认", "not-published": "尚未公布", historical: "历史周期", "not-found": "未找到", "not-required": "不要求", optional: "可选", waived: "可豁免", "fetch-failed": "获取失败", "needs-manual-review": "需人工核验" },
  en: { verified: "Verified", pending: "Pending verification", "not-published": "Not published", historical: "Historical cycle", "not-found": "Not found", "not-required": "Not required", optional: "Optional", waived: "Waived", "fetch-failed": "Fetch failed", "needs-manual-review": "Needs manual review" },
} as const;

export function VerificationStatus({ verification, language }: { verification: FieldVerification; language: "zh" | "en" }) {
  const detail = [labels[language][verification.status], verification.lastVerifiedAt ? `${language === "en" ? "Last verified" : "最后核实"}: ${verification.lastVerifiedAt}` : "", verification.note || ""].filter(Boolean).join(" · ");
  return <span className={`field-status status-${verification.status}`} title={detail} tabIndex={0}>{labels[language][verification.status]}</span>;
}
