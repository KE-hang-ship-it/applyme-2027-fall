import { strToU8, zipSync } from "fflate";

import { createPDFReportSnapshot } from "@/lib/create-pdf-report-snapshot";
import type {
  Program,
  SchoolListItem,
  UserSelection,
  VerificationState,
} from "@/types/application";
import type {
  PDFReportSnapshot,
  PDFReportSnapshotProgram,
  SnapshotLanguage,
  SnapshotWarningCode,
} from "@/types/pdf-report-snapshot";

const categoryLabels = {
  zh: { reach: "冲刺", match: "匹配", safety: "保底", unclassified: "未分类" },
  en: { reach: "Reach", match: "Match", safety: "Safety", unclassified: "Unclassified" },
} as const;

const verificationLabels: Record<SnapshotLanguage, Record<VerificationState, string>> = {
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
};

function toSelection(item: SchoolListItem): UserSelection {
  return {
    ...item,
    priority: "unset",
    userNote: item.note,
    selectionReason: [],
    actionItems: [],
  };
}

function createSnapshot(
  items: readonly SchoolListItem[],
  programs: readonly Program[],
  language: SnapshotLanguage,
) {
  return createPDFReportSnapshot({
    userProfile: null,
    selections: items.map(toSelection),
    programs,
    language,
    applicationCycle: "2027",
    allowPartial: true,
  });
}

function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function excelColumnName(index: number) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    value -= 1;
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26);
  }
  return name;
}

function validDate(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function excelDateSerial(date: Date) {
  return (date.getTime() - Date.UTC(1899, 11, 30)) / 86_400_000;
}

function missing(language: SnapshotLanguage, kind: "date" | "data" = "data") {
  if (language === "zh") return kind === "date" ? "待公布" : "暂无官方数据";
  return kind === "date" ? "Not published" : "No official data";
}

function localizeDuration(value: string | null | undefined, language: SnapshotLanguage) {
  if (!value) return missing(language);
  if (language === "zh") {
    return value
      .replace(/\byears?\b/gi, "年")
      .replace(/\bmonths?\b/gi, "个月");
  }
  return value
    .replace(/约\s*/g, "about ")
    .replace(/全日制\s*/g, "Full-time ")
    .replace(/研究型培养/g, "Research-based")
    .replace(/待复核|待确认/g, "No official data")
    .replace(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s*年/g, "$1–$2 years")
    .replace(/(\d+(?:\.\d+)?)\s*年/g, (_, amount: string) => `${amount} ${amount === "1" ? "year" : "years"}`)
    .replace(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s*个月/g, "$1–$2 months")
    .replace(/(\d+(?:\.\d+)?)\s*个月/g, (_, amount: string) => `${amount} ${amount === "1" ? "month" : "months"}`)
    .replace(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s*学期/g, "$1–$2 semesters")
    .replace(/(\d+(?:\.\d+)?)\s*学期/g, (_, amount: string) => `${amount} semester${amount === "1" ? "" : "s"}`);
}

function requirementLabel(
  requirement: PDFReportSnapshotProgram["admissionsRequirements"]["toefl"],
  language: SnapshotLanguage,
) {
  if (!requirement) return missing(language);
  if (requirement.required === false) return language === "zh" ? "不要求" : "Not required";
  if (requirement.required == null) return missing(language);
  const score = requirement.minimumScore;
  if (score != null) return language === "zh" ? `要求，最低 ${score}` : `Required, minimum ${score}`;
  return language === "zh" ? "要求" : "Required";
}

function greLabel(
  requirement: PDFReportSnapshotProgram["admissionsRequirements"]["gre"],
  language: SnapshotLanguage,
) {
  if (!requirement) return missing(language);
  const labels = language === "zh"
    ? {
        required: "要求",
        optional: "可选",
        "not-required": "不要求",
        "not-accepted": "不接受",
        unknown: "暂无官方数据",
      }
    : {
        required: "Required",
        optional: "Optional",
        "not-required": "Not required",
        "not-accepted": "Not accepted",
        unknown: "No official data",
      };
  return labels[requirement.status];
}

function lettersLabel(
  requirement: PDFReportSnapshotProgram["admissionsRequirements"]["letters"],
  language: SnapshotLanguage,
) {
  if (!requirement) return missing(language);
  if (requirement.required === false) return language === "zh" ? "不要求" : "Not required";
  if (requirement.count != null) {
    return language === "zh" ? `${requirement.count} 封` : `${requirement.count} letter${requirement.count === 1 ? "" : "s"}`;
  }
  return requirement.required ? (language === "zh" ? "要求" : "Required") : missing(language);
}

function tuitionLabel(program: PDFReportSnapshotProgram, language: SnapshotLanguage) {
  const tuition = program.tuitionSummary;
  if (tuition.unavailable || tuition.amount == null) return missing(language);
  const amount = new Intl.NumberFormat(language === "zh" ? "zh-CN" : "en-US", {
    maximumFractionDigits: 0,
  }).format(tuition.amount);
  const year = tuition.year ? ` · ${tuition.year}` : "";
  return tuition.displayText || `${tuition.currency ?? ""} ${amount}${year}`.trim();
}

function overallVerificationLabel(
  program: PDFReportSnapshotProgram,
  language: SnapshotLanguage,
) {
  const labels = language === "zh"
    ? { VERIFIED: "已核实", PARTIAL: "部分核实", NEEDS_REVIEW: "待复核" }
    : { VERIFIED: "Verified", PARTIAL: "Partially verified", NEEDS_REVIEW: "Needs review" };
  return labels[program.verificationSummary.overallStatus];
}

function programWebsite(program: PDFReportSnapshotProgram, legacy?: Program) {
  const source = program.officialSources.find(item =>
    ["programWebsite", "program", "programUrl", "officialProgramUrl"].includes(item.field),
  );
  return source?.url || legacy?.officialProgramUrl || legacy?.programUrl || legacy?.source || "";
}

type ExcelCell = {
  value: string | number;
  type: "string" | "number" | "date" | "hyperlink";
  style: number;
  hyperlink?: string;
};

type ExcelRow = ExcelCell[];

function textCell(value: string, style = 7): ExcelCell {
  return { value, type: "string", style };
}

function buildExcelRows(
  snapshot: PDFReportSnapshot,
  legacyPrograms: readonly Program[],
): { headers: string[]; rows: ExcelRow[]; links: string[] } {
  const language = snapshot.reportMeta.language;
  const zh = language === "zh";
  const headers = zh
    ? [
        "分类", "学校中文名", "学校英文名", "项目名称", "学位", "城市", "州或地区", "国家",
        "截止日期", "截止日期状态", "GRE", "TOEFL", "IELTS", "推荐信数量", "项目时长",
        "官方学费", "数据核实状态", "个人优先级", "个人备注", "项目官网",
      ]
    : [
        "Category", "University (Chinese)", "University (English)", "Program", "Degree", "City",
        "State / Region", "Country", "Deadline", "Deadline status", "GRE", "TOEFL", "IELTS",
        "Recommendation letters", "Duration", "Official tuition", "Verification status",
        "Personal priority", "Personal note", "Program website",
      ];
  const legacyById = new Map(legacyPrograms.map(item => [item.id, item]));
  const links: string[] = [];
  const rows: ExcelRow[] = snapshot.programs.map((program): ExcelRow => {
    const legacy = legacyById.get(program.legacyId);
    const deadline = program.deadlineSummary.find(item => validDate(item.date)) ?? program.deadlineSummary[0];
    const parsedDate = validDate(deadline?.date);
    const deadlineStatus = deadline?.verificationStatus
      ? verificationLabels[language][deadline.verificationStatus]
      : missing(language, "date");
    const categoryStyle = { reach: 2, match: 3, safety: 4, unclassified: 5 }[program.category];
    const url = programWebsite(program, legacy);
    const priority = program.priority === "unset"
      ? (zh ? "未设置" : "Not set")
      : ({ high: zh ? "高" : "High", medium: zh ? "中" : "Medium", low: zh ? "低" : "Low" } as const)[program.priority];
    const websiteCell: ExcelCell = url
      ? {
          value: zh ? "项目官网" : "Program website",
          type: "hyperlink",
          style: 8,
          hyperlink: url,
        }
      : textCell(missing(language));
    if (url) links.push(url);
    return [
      textCell(categoryLabels[language][program.category], categoryStyle),
      textCell(program.university.nameZh || missing(language)),
      textCell(program.university.name),
      textCell(language === "zh" && program.programNameZh ? program.programNameZh : program.programName),
      textCell(program.degree || missing(language)),
      textCell(program.university.city || missing(language)),
      textCell(program.university.state || program.university.region || missing(language)),
      textCell(program.university.country || missing(language)),
      parsedDate
        ? { value: excelDateSerial(parsedDate), type: "date", style: 6 }
        : textCell(missing(language, "date")),
      textCell(deadlineStatus),
      textCell(greLabel(program.admissionsRequirements.gre, language)),
      textCell(requirementLabel(program.admissionsRequirements.toefl, language)),
      textCell(requirementLabel(program.admissionsRequirements.ielts, language)),
      textCell(lettersLabel(program.admissionsRequirements.letters, language)),
      textCell(localizeDuration(program.curriculumSummary.duration, language)),
      textCell(tuitionLabel(program, language)),
      textCell(overallVerificationLabel(program, language)),
      textCell(priority),
      textCell(program.userNotes || missing(language)),
      websiteCell,
    ];
  });
  return { headers, rows, links };
}

function worksheetXml(headers: string[], rows: ExcelRow[]) {
  const headerCells = headers.map((value, index) =>
    `<c r="${excelColumnName(index)}1" t="inlineStr" s="1"><is><t>${escapeXml(value)}</t></is></c>`,
  ).join("");
  const bodyRows = rows.map((row, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const cells = row.map((cell, columnIndex) => {
      const reference = `${excelColumnName(columnIndex)}${rowNumber}`;
      if (cell.type === "number" || cell.type === "date") {
        return `<c r="${reference}" s="${cell.style}"><v>${cell.value}</v></c>`;
      }
      return `<c r="${reference}" t="inlineStr" s="${cell.style}"><is><t xml:space="preserve">${escapeXml(cell.value)}</t></is></c>`;
    }).join("");
    return `<row r="${rowNumber}" ht="34" customHeight="1">${cells}</row>`;
  }).join("");
  let hyperlinkRelationshipIndex = 0;
  const hyperlinks = rows.flatMap((row, rowIndex) =>
    row.flatMap((cell, columnIndex) => {
      if (!cell.hyperlink) return [];
      hyperlinkRelationshipIndex += 1;
      return [`<hyperlink ref="${excelColumnName(columnIndex)}${rowIndex + 2}" r:id="rId${hyperlinkRelationshipIndex}"/>`];
    }),
  ).join("");
  const widths = [13, 24, 30, 31, 12, 18, 18, 16, 15, 19, 18, 20, 20, 20, 18, 24, 20, 16, 28, 18];
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("")}</cols>
  <sheetData><row r="1" ht="30" customHeight="1">${headerCells}</row>${bodyRows}</sheetData>
  <autoFilter ref="A1:T${Math.max(rows.length + 1, 1)}"/>
  ${hyperlinks ? `<hyperlinks>${hyperlinks}</hyperlinks>` : ""}
</worksheet>`;
}

function worksheetRelationships(rows: ExcelRow[]) {
  const links = rows.flatMap(row => row.flatMap(cell => cell.hyperlink ? [cell.hyperlink] : []));
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${links.map((url, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXml(url)}" TargetMode="External"/>`).join("")}
</Relationships>`;
}

function buildXlsx(snapshot: PDFReportSnapshot, programs: readonly Program[]) {
  const { headers, rows } = buildExcelRows(snapshot, programs);
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${snapshot.reportMeta.language === "zh" ? "选校名单" : "School List"}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
    "xl/styles.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="11"/><name val="Aptos"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font>
    <font><color rgb="FF0563C1"/><u/><sz val="11"/><name val="Aptos"/></font>
    <font><b/><sz val="11"/><name val="Aptos"/></font>
  </fonts>
  <fills count="7">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF173B62"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFCE8E6"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF4CC"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2F0D9"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE7E6E6"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFD9E2F0"/></left><right style="thin"><color rgb="FFD9E2F0"/></right><top style="thin"><color rgb="FFD9E2F0"/></top><bottom style="thin"><color rgb="FFD9E2F0"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="9">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="6" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="14" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`),
    "xl/worksheets/sheet1.xml": strToU8(worksheetXml(headers, rows)),
    "xl/worksheets/_rels/sheet1.xml.rels": strToU8(worksheetRelationships(rows)),
  };
  return zipSync(files, { level: 6 });
}

export function exportSchoolListExcel({
  items,
  programs,
  language,
}: {
  items: readonly SchoolListItem[];
  programs: readonly Program[];
  language: SnapshotLanguage;
}) {
  if (!items.length) return;
  const result = createSnapshot(items, programs, language);
  if (!result.snapshot) {
    throw new Error(language === "zh" ? "无法生成选校名单" : "Unable to generate school list");
  }
  const bytes = buildXlsx(result.snapshot, programs);
  const arrayBuffer = Uint8Array.from(bytes).buffer as ArrayBuffer;
  downloadBlob(
    `applyme-school-list-${new Date().toISOString().slice(0, 10)}.xlsx`,
    new Blob([arrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  );
}

function list(items: readonly string[], empty: string, limit = 3) {
  if (!items.length) return `<p class="muted">${escapeHtml(empty)}</p>`;
  const visible = items.slice(0, limit);
  const more = items.length > limit ? `<li class="muted">+${items.length - limit}</li>` : "";
  return `<ul>${visible.map(item => `<li>${escapeHtml(item)}</li>`).join("")}${more}</ul>`;
}

function compactText(value: string | null | undefined, language: SnapshotLanguage) {
  return value ? escapeHtml(value) : `<span class="muted">${escapeHtml(missing(language))}</span>`;
}

const knownEnglishInsightTranslations: Record<string, string> = {
  "当前未确认存在独立面向外部申请者的 Mechanical Engineering MS":
    "An independent Mechanical Engineering MS open to external applicants has not yet been confirmed.",
  "未确认存在独立面向外部申请者的 Mechanical Engineering MS":
    "An independent Mechanical Engineering MS open to external applicants has not yet been confirmed.",
};

function localizedInsights(items: readonly string[], language: SnapshotLanguage) {
  if (language === "zh") return [...items];
  return items.flatMap(item => {
    const translated = knownEnglishInsightTranslations[item.trim()];
    if (translated) return [translated];
    return /[\u3400-\u9fff]/u.test(item) ? [] : [item];
  });
}

function deadlineHtml(program: PDFReportSnapshotProgram, language: SnapshotLanguage) {
  if (!program.deadlineSummary.length) return compactText(missing(language, "date"), language);
  return program.deadlineSummary.map(item => {
    const value = item.date || missing(language, "date");
    const status = item.verificationStatus
      ? verificationLabels[language][item.verificationStatus]
      : missing(language, "date");
    const label = [item.label, item.deadlineType, item.intake].filter(Boolean).join(" · ");
    return `<div>${label ? `<small>${escapeHtml(label)}</small>` : ""}<span>${escapeHtml(value)}</span><em>${escapeHtml(status)}</em></div>`;
  }).join("");
}

function warningSummary(snapshot: PDFReportSnapshot) {
  const language = snapshot.reportMeta.language;
  const definitions: Array<{
    code: SnapshotWarningCode;
    zh: (count: number) => string;
    en: (count: number) => string;
  }> = [
    {
      code: "INCOMPLETE_REQUIREMENTS",
      zh: count => `${count} 个项目的申请要求不完整。`,
      en: count => `${count} program${count === 1 ? "" : "s"} have incomplete application requirements.`,
    },
    {
      code: "TUITION_UNAVAILABLE",
      zh: count => `${count} 个项目未找到项目专属官方学费。`,
      en: count => `${count} program${count === 1 ? "" : "s"} have no program-specific official tuition.`,
    },
    {
      code: "LEGACY_ONLY_PROGRAM",
      zh: count => `${count} 个项目目前仅有旧版数据。`,
      en: count => `${count} program${count === 1 ? "" : "s"} currently use legacy-only data.`,
    },
    {
      code: "HISTORICAL_DEADLINE",
      zh: count => `${count} 个项目仅有历史周期截止日期。`,
      en: count => `${count} program${count === 1 ? "" : "s"} only have historical-cycle deadlines.`,
    },
    {
      code: "PENDING_VERIFICATION",
      zh: count => `${count} 个项目包含待核实字段。`,
      en: count => `${count} program${count === 1 ? "" : "s"} contain fields pending verification.`,
    },
    {
      code: "REVIEW_PROGRAM",
      zh: count => `${count} 个项目处于待复核状态。`,
      en: count => `${count} program${count === 1 ? "" : "s"} require program-level review.`,
    },
    {
      code: "SPLIT_PROGRAM_UNRESOLVED",
      zh: count => `${count} 个拆分项目尚未选择具体学位。`,
      en: count => `${count} split program${count === 1 ? "" : "s"} lack a resolved degree selection.`,
    },
    {
      code: "MISSING_USER_PROFILE",
      zh: () => "尚未提供申请人画像，本报告不包含个性化匹配判断。",
      en: () => "No applicant profile was provided; personalized fit analysis is not included.",
    },
  ];
  return definitions.flatMap(definition => {
    const relevant = snapshot.reportWarnings.filter(item => item.code === definition.code);
    if (!relevant.length) return [];
    const programIds = new Set(relevant.map(item => item.legacyId).filter(Boolean));
    const count = definition.code === "MISSING_USER_PROFILE"
      ? 1
      : Math.max(programIds.size, 1);
    return [language === "zh" ? definition.zh(count) : definition.en(count)];
  }).slice(0, 8);
}

function projectCard(program: PDFReportSnapshotProgram, language: SnapshotLanguage) {
  const zh = language === "zh";
  const requirements = program.admissionsRequirements;
  const website = programWebsite(program);
  const statusLabel = zh
    ? {
        ACTIVE: "正常",
        REVIEW: "待复核",
        PHD: "博士项目",
        NOT_ME_PROGRAM: "非机械硕士",
      }[program.programStatus]
    : {
        ACTIVE: "Active",
        REVIEW: "Review",
        PHD: "PhD",
        NOT_ME_PROGRAM: "Not an ME program",
      }[program.programStatus];
  const duration = localizeDuration(program.curriculumSummary.duration, language);
  const tuition = tuitionLabel(program, language);
  return `<article class="program-card">
    <div class="program-head">
      <div>
        <p class="eyebrow">${escapeHtml(categoryLabels[language][program.category])}</p>
        <h2>${escapeHtml(zh && program.university.nameZh ? program.university.nameZh : program.university.name)}</h2>
        <p>${escapeHtml(zh && program.programNameZh ? program.programNameZh : program.programName)} · ${escapeHtml(program.degree)}</p>
      </div>
      <span class="status">${escapeHtml(statusLabel)}</span>
    </div>
    <div class="fact-grid">
      <div class="deadline-fact"><b>${zh ? "截止日期" : "Deadline"}</b>${deadlineHtml(program, language)}</div>
      <div><b>GRE</b><span>${escapeHtml(greLabel(requirements.gre, language))}</span></div>
      <div><b>TOEFL / IELTS</b><span>${escapeHtml(requirementLabel(requirements.toefl, language))} / ${escapeHtml(requirementLabel(requirements.ielts, language))}</span></div>
      <div><b>${zh ? "推荐信" : "Recommendations"}</b><span>${escapeHtml(lettersLabel(requirements.letters, language))}</span></div>
      <div><b>${zh ? "项目时长" : "Duration"}</b><span>${escapeHtml(duration)}</span></div>
      <div><b>${zh ? "官方学费" : "Official tuition"}</b><span>${escapeHtml(tuition)}</span></div>
    </div>
    <div class="analysis-grid">
      <section><h3>${zh ? "项目优势" : "Highlights"}</h3>${list(localizedInsights(program.highlights, language), missing(language))}</section>
      <section><h3>${zh ? "适合人群" : "Best fit"}</h3>${list(localizedInsights(program.bestFit, language), missing(language))}</section>
      <section><h3>${zh ? "风险提示" : "Risk factors"}</h3>${list(localizedInsights(program.riskFactors, language), missing(language))}</section>
    </div>
    ${program.userNotes ? `<div class="note"><b>${zh ? "个人备注" : "Personal note"}</b><span>${escapeHtml(program.userNotes)}</span></div>` : ""}
    <div class="card-footer">
      <span>${zh ? "数据状态" : "Data status"}: ${escapeHtml(overallVerificationLabel(program, language))}</span>
      ${website ? `<a href="${escapeHtml(website)}">${zh ? "项目官网" : "Program website"}</a>` : `<span class="muted">${escapeHtml(missing(language))}</span>`}
    </div>
  </article>`;
}

function balancedPages<T>(items: readonly T[], maxPerPage = 3) {
  if (!items.length) return [] as T[][];
  const pageCount = Math.ceil(items.length / maxPerPage);
  const base = Math.floor(items.length / pageCount);
  let remainder = items.length % pageCount;
  const pages: T[][] = [];
  let index = 0;
  for (let page = 0; page < pageCount; page += 1) {
    const size = base + (remainder > 0 ? 1 : 0);
    remainder = Math.max(0, remainder - 1);
    pages.push(items.slice(index, index + size));
    index += size;
  }
  return pages;
}

export function buildSchoolListReportHtml(snapshot: PDFReportSnapshot) {
  const language = snapshot.reportMeta.language;
  const zh = language === "zh";
  const summary = snapshot.selectionSummary;
  const warnings = warningSummary(snapshot);
  const pages = balancedPages(snapshot.programs);
  return `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${zh ? "ApplyME 机械工程硕士选校报告" : "ApplyME Mechanical Engineering School Selection Report"}</title>
  <style>
    @page{size:A4 portrait;margin:12mm}
    *{box-sizing:border-box}
    html{background:#eef3f8}
    body{max-width:210mm;margin:0 auto;color:#172d4a;background:#fff;font:11px/1.45 Arial,"Microsoft YaHei","Noto Sans CJK SC",sans-serif}
    h1,h2,h3,p{margin:0}
    .toolbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 16px;color:#eef6ff;background:#102d4f}
    .toolbar p{font-size:12px}
    button{flex:none;border:0;border-radius:9px;padding:9px 14px;color:#fff;background:#2f79b7;font-weight:700;cursor:pointer}
    .cover,.program-page{padding:12mm}
    .cover{min-height:273mm;break-after:page;page-break-after:always}
    .hero{padding:20px 22px;color:#fff;background:linear-gradient(135deg,#102d4f,#27659a);border-radius:16px}
    .hero h1{font-size:24px;line-height:1.25}
    .meta{margin-top:6px;opacity:.82}
    .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}
    .summary div{padding:10px;border:1px solid #dbe4ee;border-radius:10px;background:#f7f9fc}
    .summary span,.summary b{display:block}.summary b{font-size:19px}
    .warnings{padding:12px 14px;border:1px solid #f0d8a7;border-radius:12px;background:#fff9eb}
    .warnings h2{font-size:14px}.warnings ul{display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;margin:8px 0 0;padding-left:18px}
    .cover-note{margin-top:14px;color:#64748b}
    .program-page{min-height:273mm;break-after:page;page-break-after:always}
    .program-page:last-of-type{break-after:auto;page-break-after:auto}
    .program-card{margin:0 0 7mm;padding:12px 14px;border:1px solid #dbe4ee;border-radius:14px;background:#fff;break-inside:avoid;break-inside:avoid-page;page-break-inside:avoid;box-shadow:0 3px 10px rgba(23,45,74,.04)}
    .program-card:last-child{margin-bottom:0}
    .program-head{display:flex;justify-content:space-between;gap:12px}
    .program-head h2{font-size:16px;line-height:1.25}.program-head p{color:#64748b}
    .eyebrow{font-weight:800!important;color:#27659a!important;text-transform:uppercase}
    .status{height:max-content;padding:3px 8px;border-radius:999px;background:#edf4fb;font-weight:700}
    .fact-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:9px 0}
    .fact-grid>div{min-width:0;padding:7px 8px;border-radius:8px;background:#f7f9fc}
    .fact-grid b,.fact-grid span,.deadline-fact small,.deadline-fact em{display:block}
    .deadline-fact small{color:#64748b}.deadline-fact em{color:#8a5a00;font-style:normal;font-size:10px}
    .analysis-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    .analysis-grid h3{margin-bottom:3px;font-size:11px}
    ul{margin:0;padding-left:16px}.muted{color:#8795a8}
    .note{display:flex;gap:8px;margin-top:8px;padding:7px 8px;border-radius:8px;background:#fff8e8}
    .card-footer{display:flex;justify-content:space-between;gap:12px;margin-top:8px;padding-top:7px;border-top:1px solid #edf1f5;color:#64748b}
    a{color:#145b91;overflow-wrap:anywhere}
    .report-footer{margin-top:10px;color:#64748b;text-align:center}
    @media print{
      html,body{max-width:none;background:#fff}
      .toolbar{display:none}
      .cover,.program-page{padding:0}
      .program-card{box-shadow:none}
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <p>${zh ? "保存 PDF 时，建议在“更多设置”中关闭“页眉和页脚”。" : "When saving as PDF, disable “Headers and footers” under More settings."}</p>
    <button type="button" onclick="window.print()">${zh ? "打印 / 保存 PDF" : "Print / Save PDF"}</button>
  </div>
  <section class="cover">
    <header class="hero">
      <h1>${zh ? "ApplyME 机械工程硕士选校报告" : "ApplyME Mechanical Engineering School Selection Report"}</h1>
      <p class="meta">${zh ? "生成时间" : "Generated"}: ${escapeHtml(new Date(snapshot.reportMeta.generatedAt).toLocaleString(zh ? "zh-CN" : "en-US"))}</p>
    </header>
    <section class="summary">
      <div><span>${zh ? "项目总数" : "Total"}</span><b>${summary.totalPrograms}</b></div>
      <div><span>${zh ? "冲刺" : "Reach"}</span><b>${summary.reachCount}</b></div>
      <div><span>${zh ? "匹配" : "Match"}</span><b>${summary.matchCount}</b></div>
      <div><span>${zh ? "保底" : "Safety"}</span><b>${summary.safetyCount}</b></div>
    </section>
    ${warnings.length ? `<section class="warnings"><h2>${zh ? "数据提醒" : "Data warnings"}</h2><ul>${warnings.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : ""}
    <p class="cover-note">${zh ? "申请要求可能随申请周期变化，请在提交前前往大学官网再次核实。" : "Requirements may change by application cycle. Verify all information on official university websites before applying."}</p>
  </section>
  ${pages.map((page, pageIndex) => `<section class="program-page" data-page="${pageIndex + 1}">${page.map(program => projectCard(program, language)).join("")}${pageIndex === pages.length - 1 ? `<p class="report-footer">${zh ? "报告结束" : "End of report"}</p>` : ""}</section>`).join("")}
</body>
</html>`;
}

export function exportSchoolListPdf({
  items,
  programs,
  language,
}: {
  items: readonly SchoolListItem[];
  programs: readonly Program[];
  language: SnapshotLanguage;
}) {
  if (!items.length) return;
  const result = createSnapshot(items, programs, language);
  if (!result.snapshot) {
    throw new Error(language === "zh" ? "无法生成选校报告" : "Unable to generate report");
  }
  const popup = window.open("", "_blank");
  if (!popup) {
    throw new Error(language === "zh" ? "浏览器阻止了报告窗口" : "The browser blocked the report window");
  }
  popup.opener = null;
  popup.document.open();
  popup.document.write(buildSchoolListReportHtml(result.snapshot));
  popup.document.close();
}
