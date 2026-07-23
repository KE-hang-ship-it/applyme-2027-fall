import type {
  DocumentRequirement,
  FieldVerificationV2,
  GRERequirement,
  LanguageRequirement,
  ProgramV2,
  ProgramVerificationField,
  VerificationState,
} from "@/types/application";

export type DetailLanguage = "zh" | "en";

export const NO_OFFICIAL_DATA = {
  zh: "暂无官方数据",
  en: "No official data",
} as const;

export function fieldVerification(
  program: ProgramV2,
  field: ProgramVerificationField,
): FieldVerificationV2 | undefined {
  return program.verificationV2?.fields[field];
}

export function verificationText(status: VerificationState, language: DetailLanguage) {
  const labels = {
    zh: {
      verified: "已核实",
      historical: "历史周期",
      pending: "待确认",
      "not-published": "尚未公布",
      "not-found": "未找到",
    },
    en: {
      verified: "Verified",
      historical: "Historical cycle",
      pending: "Pending verification",
      "not-published": "Not published",
      "not-found": "Not found",
    },
  } as const;
  return labels[language][status];
}

export function formatMoney(
  money: { amount: number | null; currency: string } | null | undefined,
  language: DetailLanguage,
) {
  if (!money || money.amount === null) return NO_OFFICIAL_DATA[language];
  return `${money.currency} ${money.amount.toLocaleString(language === "zh" ? "zh-CN" : "en-US")}`;
}

export function formatDocument(
  value: DocumentRequirement | undefined,
  language: DetailLanguage,
) {
  if (!value || value.required === null) return NO_OFFICIAL_DATA[language];
  if (!value.required) return language === "zh" ? "不要求" : "Not required";
  if (value.count) return language === "zh" ? `${value.count} 份` : `${value.count}`;
  return value.note || (language === "zh" ? "要求提交" : "Required");
}

export function formatGRE(value: GRERequirement | undefined, language: DetailLanguage) {
  if (!value || value.status === "unknown") return NO_OFFICIAL_DATA[language];
  const labels = {
    required: language === "zh" ? "要求" : "Required",
    optional: language === "zh" ? "可选" : "Optional",
    "not-required": language === "zh" ? "不要求" : "Not required",
    "not-accepted": language === "zh" ? "不接受" : "Not accepted",
  } as const;
  return [labels[value.status], value.minimumScore, value.note].filter(Boolean).join(" · ");
}

export function formatLanguageRequirement(
  value: LanguageRequirement | undefined,
  language: DetailLanguage,
) {
  if (!value || value.required === null) return NO_OFFICIAL_DATA[language];
  if (!value.required) return language === "zh" ? "不要求" : "Not required";
  return [
    value.minimumScore
      ? language === "zh"
        ? `最低 ${value.minimumScore}`
        : `Minimum ${value.minimumScore}`
      : language === "zh"
        ? "要求"
        : "Required",
    value.note,
  ].filter(Boolean).join(" · ");
}

export function v2FieldValue<T>(
  program: ProgramV2,
  field: ProgramVerificationField,
  v2Value: T | null | undefined,
  legacyValue: T | null | undefined,
): T | undefined {
  const verification = fieldVerification(program, field);
  if (verification) {
    if (verification.status === "not-found" || verification.status === "not-published") {
      return undefined;
    }
    return v2Value ?? undefined;
  }
  return legacyValue ?? undefined;
}

export function isMigratedDetail(program: ProgramV2) {
  return Boolean(program.verificationV2?.lastReviewedAt);
}
