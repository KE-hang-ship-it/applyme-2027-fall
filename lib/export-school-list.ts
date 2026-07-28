import { strToU8, zipSync } from "fflate";

import { createPDFReportSnapshot } from "@/lib/create-pdf-report-snapshot";
import type {
  Program,
  SchoolListItem,
  UserProfile,
  UserSelection,
  VerificationState,
} from "@/types/application";
import type {
  PDFReportSnapshot,
  PDFReportSnapshotProgram,
  SnapshotLanguage,
  SnapshotWarningCode,
} from "@/types/pdf-report-snapshot";
import { statusLabel } from "@/lib/report-data-quality";
import { isOfficialUniversityUrl } from "@/lib/report-data-quality";

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
    "not-required": "官网明确不要求",
    optional: "官网明确可选",
    waived: "符合条件可豁免",
    "fetch-failed": "抓取或解析失败",
    "needs-manual-review": "需人工核验",
  },
  en: {
    verified: "Verified",
    historical: "Historical cycle",
    pending: "Pending verification",
    "not-published": "Not published",
    "not-found": "Not found",
    "not-required": "Not required",
    optional: "Optional",
    waived: "Waived when eligible",
    "fetch-failed": "Fetch failed",
    "needs-manual-review": "Needs manual review",
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

export function createSchoolListSnapshot(
  items: readonly SchoolListItem[],
  programs: readonly Program[],
  language: SnapshotLanguage,
  userProfile?: UserProfile | null,
) {
  return createPDFReportSnapshot({
    userProfile,
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
  const candidates = [
    source?.url,
    legacy?.officialProgramUrl,
    legacy?.programUrl,
    legacy?.source,
  ].filter((value): value is string => Boolean(value));
  return candidates.find(isOfficialUniversityUrl) ?? "";
}

function sourceCellLabel(url: string, language: SnapshotLanguage) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return language === "zh" ? "官方来源" : "Official source";
  }
}

function sourceFieldLabel(field: string, language: SnapshotLanguage) {
  const labels: Record<string, { zh: string; en: string }> = {
    programWebsite: { zh: "项目官网", en: "Program website" },
    departmentWebsite: { zh: "院系官网", en: "Department website" },
    applicationWebsite: { zh: "申请入口", en: "Application portal" },
    deadline: { zh: "截止日期来源", en: "Deadline source" },
    gre: { zh: "GRE 要求来源", en: "GRE source" },
    toefl: { zh: "TOEFL 要求来源", en: "TOEFL source" },
    ielts: { zh: "IELTS 要求来源", en: "IELTS source" },
    letters: { zh: "推荐信要求来源", en: "Recommendation source" },
    tuition: { zh: "学费来源", en: "Tuition source" },
    curriculum: { zh: "课程来源", en: "Curriculum source" },
  };
  return labels[field]?.[language] ?? (language === "zh" ? "官方来源" : "Official source");
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

function statusExcelStyle(status: PDFReportSnapshotProgram["tuitionSummary"]["fieldMeta"]["status"]) {
  if (status === "verified" || status === "not-required") return 9;
  if (status === "fetch-failed") return 11;
  if (status === "needs-manual-review") return 10;
  return 12;
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
        "官方学费", "学费状态", "数据可信度", "最近核验时间", "个人优先级", "个人备注",
        "项目官网", "申请要求来源", "学费来源",
      ]
    : [
        "Category", "University (Chinese)", "University (English)", "Program", "Degree", "City",
        "State / Region", "Country", "Deadline", "Deadline status", "GRE", "TOEFL", "IELTS",
        "Recommendation letters", "Duration", "Official tuition", "Tuition status", "Data confidence",
        "Last verified", "Personal priority", "Personal note", "Program website",
        "Admissions source", "Tuition source",
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
    const admissionsSource = program.officialSources.find(item =>
      ["deadline", "gre", "toefl", "ielts", "letters", "admissionRequirementSource"].includes(item.field),
    );
    const tuitionSource = program.officialSources.find(item => item.field === "tuition");
    const sourceLinkCell = (source: typeof admissionsSource): ExcelCell => {
      if (!source) return textCell(missing(language));
      links.push(source.url);
      return {
        value: sourceCellLabel(source.url, language),
        type: "hyperlink",
        style: 8,
        hyperlink: source.url,
      };
    };
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
      textCell(deadlineStatus, statusExcelStyle(deadline?.fieldMeta.status ?? "not-yet-published")),
      textCell(greLabel(program.admissionsRequirements.gre, language)),
      textCell(requirementLabel(program.admissionsRequirements.toefl, language)),
      textCell(requirementLabel(program.admissionsRequirements.ielts, language)),
      textCell(lettersLabel(program.admissionsRequirements.letters, language)),
      textCell(localizeDuration(program.curriculumSummary.duration, language)),
      textCell(tuitionLabel(program, language)),
      textCell(
        statusLabel(program.tuitionSummary.fieldMeta.status, language),
        statusExcelStyle(program.tuitionSummary.fieldMeta.status),
      ),
      textCell(
        language === "zh"
          ? { high: "高", medium: "中", low: "低" }[program.verificationSummary.confidence]
          : { high: "High", medium: "Medium", low: "Low" }[program.verificationSummary.confidence],
      ),
      textCell(program.verificationSummary.lastReviewedAt || missing(language)),
      textCell(priority),
      textCell(program.userNotes || missing(language)),
      websiteCell,
      sourceLinkCell(admissionsSource),
      sourceLinkCell(tuitionSource),
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
  const widths = [13, 24, 30, 31, 12, 18, 18, 16, 15, 19, 18, 20, 20, 20, 18, 24, 20, 16, 16, 16, 28, 18, 20, 20];
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("")}</cols>
  <sheetData><row r="1" ht="30" customHeight="1">${headerCells}</row>${bodyRows}</sheetData>
  <autoFilter ref="A1:X${Math.max(rows.length + 1, 1)}"/>
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

function applicantRows(snapshot: PDFReportSnapshot): Array<[string, string]> {
  const zh = snapshot.reportMeta.language === "zh";
  const applicant = snapshot.applicant;
  const empty = zh ? "暂无" : "Not provided";
  const studyTypes: Record<string, [string, string]> = {
    standard: ["普通本科", "Standard undergraduate"],
    "2+2-first": ["2+2 前半段", "2+2 first stage"],
    "2+2-second": ["2+2 后半段", "2+2 second stage"],
    "pre-transfer": ["转学前", "Before transfer"],
    "post-transfer": ["转学后", "After transfer"],
    joint: ["联合培养", "Joint program"],
    "dual-degree": ["双学位", "Dual degree"],
    exchange: ["交换经历", "Exchange"],
    other: ["其他", "Other"],
  };
  const degreeModes: Record<string, [string, string]> = {
    single: ["单学位", "Single degree"],
    dual: ["双学位", "Dual degree"],
    joint: ["联合学位", "Joint degree"],
    undecided: ["尚未确定", "Undecided"],
  };
  const rows: Array<[string, string]> = [
    [zh ? "画像完整度" : "Profile completion", `${applicant.completion.completionRate}%`],
    [zh ? "学位模式" : "Degree mode", applicant.degreeMode ? degreeModes[applicant.degreeMode]?.[zh ? 0 : 1] ?? applicant.degreeMode : empty],
  ];
  applicant.educationExperiences.forEach((education, index) => {
    const prefix = zh ? `教育经历 ${index + 1}` : `Education ${index + 1}`;
    const gpa = education.gpa?.value != null && education.gpa?.scale != null
      ? `${education.gpa.value} / ${education.gpa.scale}`
      : empty;
    rows.push(
      [prefix, education.school || empty],
      [zh ? "国家或地区" : "Country or region", education.countryOrRegion || empty],
      [zh ? "本科专业" : "Undergraduate major", education.major || empty],
      [zh ? "就读类型" : "Study type", education.studyType ? studyTypes[education.studyType]?.[zh ? 0 : 1] ?? education.studyType : empty],
      ["GPA", gpa],
      [zh ? "学位授予" : "Degree awarded", education.awardsDegree ? (zh ? "是" : "Yes") : (zh ? "否" : "No")],
      [zh ? "最终毕业院校" : "Final graduation school", education.finalGraduationSchool ? (zh ? "是" : "Yes") : (zh ? "否" : "No")],
    );
  });
  const toefl = applicant.toefl?.scale === "not-taken"
    ? (zh ? "尚未考试" : "Not taken")
    : applicant.toefl?.score != null
      ? `${applicant.toefl.score} / ${applicant.toefl.scale === "1-6" ? "6" : "120"}`
      : empty;
  rows.push(
    ["TOEFL iBT", toefl],
    ["IELTS", applicant.ielts?.score != null ? String(applicant.ielts.score) : empty],
    [zh ? "GRE 总分" : "GRE total", applicant.gre?.total != null ? String(applicant.gre.total) : empty],
    ["GRE Quantitative", applicant.gre?.quantitative != null ? String(applicant.gre.quantitative) : empty],
    [zh ? "目标专业" : "Target major", applicant.targetMajor.join("、") || empty],
    [zh ? "目标学位" : "Target degree", applicant.targetDegree.join(" / ") || empty],
    [zh ? "目标方向" : "Target areas", applicant.targetAreas.join("、") || empty],
    [zh ? "地区偏好" : "Region preferences", applicant.targetRegions.join("、") || empty],
    [zh ? "预算" : "Budget", applicant.budget?.amount != null ? `${applicant.budget.amount} ${applicant.budget.currency}` : empty],
    [zh ? "申请目标" : "Career goal", applicant.careerGoal || empty],
  );
  return rows;
}

function applicantWorksheetXml(snapshot: PDFReportSnapshot) {
  const rows = applicantRows(snapshot);
  const headerA = snapshot.reportMeta.language === "zh" ? "申请者画像" : "Applicant profile";
  const headerB = snapshot.reportMeta.language === "zh" ? "内容" : "Value";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols><col min="1" max="1" width="24" customWidth="1"/><col min="2" max="2" width="54" customWidth="1"/></cols>
  <sheetData>
    <row r="1" ht="30" customHeight="1"><c r="A1" t="inlineStr" s="1"><is><t>${escapeXml(headerA)}</t></is></c><c r="B1" t="inlineStr" s="1"><is><t>${escapeXml(headerB)}</t></is></c></row>
    ${rows.map(([label, value], index) => `<row r="${index + 2}" ht="28" customHeight="1"><c r="A${index + 2}" t="inlineStr" s="7"><is><t>${escapeXml(label)}</t></is></c><c r="B${index + 2}" t="inlineStr" s="7"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c></row>`).join("")}
  </sheetData>
</worksheet>`;
}

export function buildSchoolListWorkbookBytes(snapshot: PDFReportSnapshot, programs: readonly Program[]) {
  const { headers, rows } = buildExcelRows(snapshot, programs);
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${snapshot.reportMeta.language === "zh" ? "选校名单" : "School List"}" sheetId="1" r:id="rId1"/><sheet name="${snapshot.reportMeta.language === "zh" ? "申请者画像" : "Applicant Profile"}" sheetId="2" r:id="rId2"/></sheets>
</workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
    "xl/styles.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="11"/><name val="Aptos"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font>
    <font><color rgb="FF0563C1"/><u/><sz val="11"/><name val="Aptos"/></font>
    <font><b/><sz val="11"/><name val="Aptos"/></font>
  </fonts>
  <fills count="11">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF173B62"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFCE8E6"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF4CC"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2F0D9"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE7E6E6"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2F0D9"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF4CCCC"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFDDEBF7"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFD9E2F0"/></left><right style="thin"><color rgb="FFD9E2F0"/></right><top style="thin"><color rgb="FFD9E2F0"/></top><bottom style="thin"><color rgb="FFD9E2F0"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="13">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="6" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="14" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="7" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="8" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="9" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="10" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`),
    "xl/worksheets/sheet1.xml": strToU8(worksheetXml(headers, rows)),
    "xl/worksheets/sheet2.xml": strToU8(applicantWorksheetXml(snapshot)),
    "xl/worksheets/_rels/sheet1.xml.rels": strToU8(worksheetRelationships(rows)),
  };
  return zipSync(files, { level: 6 });
}

export function exportSchoolListExcel({
  items,
  programs,
  language,
  userProfile,
}: {
  items: readonly SchoolListItem[];
  programs: readonly Program[];
  language: SnapshotLanguage;
  userProfile?: UserProfile | null;
}) {
  if (!items.length) return;
  const result = createSchoolListSnapshot(items, programs, language, userProfile);
  if (!result.snapshot) {
    throw new Error(language === "zh" ? "无法生成选校名单" : "Unable to generate school list");
  }
  const bytes = buildSchoolListWorkbookBytes(result.snapshot, programs);
  const arrayBuffer = Uint8Array.from(bytes).buffer as ArrayBuffer;
  downloadBlob(
    `applyme-school-list-${new Date().toISOString().slice(0, 10)}.xlsx`,
    new Blob([arrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  );
}

function list(
  items: readonly string[],
  empty: string,
  limit = 3,
  moreLabel?: (count: number) => string,
) {
  if (!items.length) return `<p class="muted">${escapeHtml(empty)}</p>`;
  const visible = items.slice(0, limit);
  const remaining = items.length - limit;
  const more = remaining > 0 && moreLabel
    ? `<li class="muted">${escapeHtml(moreLabel(remaining))}</li>`
    : "";
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

const knownChineseInsightTranslations: Record<string, string> = {
  "MS offers thesis and non-thesis pathways.": "该 MS 同时提供论文与非论文培养路径。",
  "Research areas span autonomy, controls, design, manufacturing, mechanics and thermal-fluid systems.": "研究方向覆盖自主系统、控制、设计、制造、力学与热流体系统。",
  "Applicants seeking a research-oriented MS with a possible thesis route.": "适合希望攻读研究导向、并保留论文路径的申请者。",
  "Students targeting controls, robotics, mechanics or thermal-fluid research.": "适合目标为控制、机器人、力学或热流体研究的学生。",
  "Funding priority is earlier than the final MS deadline.": "奖学金优先截止时间早于 MS 最终申请截止时间。",
  "Recommended English scores are higher than many university-wide minimums.": "项目建议的英语成绩高于许多学校层面的最低要求。",
  "Thesis and non-thesis pathways.": "同时提供论文与非论文路径。",
  "Optional cooperative education experience.": "可选择参加合作教育（Co-op）实践。",
  "Applicants seeking career-oriented coursework with an optional co-op.": "适合希望以就业为导向修读课程，并考虑 Co-op 的申请者。",
  "Students interested in mechatronics, thermofluids, mechanics/design or materials.": "适合关注机电一体化、热流体、力学与设计或材料方向的学生。",
  "Published admissions and tuition values are historical for the target Fall 2027 report.": "现有申请与学费数据属于历史周期，不能视为 2027 秋季当前要求。",
  "MS supports thesis and non-thesis/experiential pathways.": "该 MS 支持论文以及非论文/实践型路径。",
  "Broad graduate course offerings in controls, mechanics, manufacturing and thermal sciences.": "研究生课程广泛覆盖控制、力学、制造与热科学。",
  "Applicants seeking either a research thesis or structured non-thesis pathway.": "适合希望选择研究论文或结构化非论文路径的申请者。",
  "Autumn 2027 deadlines were not yet published at the last verification date.": "截至最近核验日期，2027 秋季截止时间尚未公布。",
  "Coursework-focused professional MEng.": "以课程学习为核心的专业型 MEng。",
  "Designed for rapid completion with technical and professional development coursework.": "课程兼顾技术能力与职业发展，并支持较快完成学位。",
  "Applicants prioritizing industry preparation and a one-year professional degree.": "适合优先考虑就业准备与一年制专业学位的申请者。",
  "Fall 2027 deadline was not confirmed on the checked MEng page.": "已核查的 MEng 官网尚未确认 2027 秋季截止时间。",
  "Official catalog lists multiple named MS options, including Research and Accelerated.": "官方目录列出多个具名 MS 选项，包括研究型与加速型。",
  "Applicants who will confirm the specific named option before relying on deadlines or requirements.": "适合愿意先确认具体具名项目，再使用其截止时间与要求的申请者。",
  "The saved generic MS record does not identify a named option; requirements differ by option.": "当前保存的是通用 MS 记录，尚未指定具名选项，而不同选项要求不同。",
  "Professional coursework degree with General Mechanical and Energy & Environment pathways.": "专业型授课学位，提供通用机械与能源环境路径。",
  "Applicants seeking a professional, non-thesis MEng with flexible engineering coursework.": "适合希望攻读专业型、非论文且课程选择灵活的 MEng 申请者。",
  "International and domestic applicants have different deadlines.": "国际申请者与本土申请者的截止时间不同。",
  "Five formal areas of specialization.": "设有五个正式专业方向。",
  "Flexible MS combining advanced coursework with optional research.": "灵活的 MS 培养方案，将高级课程与可选研究经历结合。",
  "Applicants seeking a flexible MS spanning robotics, mechanics, materials or thermal fluids.": "适合希望在机器人、力学、材料或热流体之间灵活选择方向的申请者。",
  "The published Fall deadline is historical; Fall 2027 must be rechecked.": "已公布的秋季截止时间属于历史周期，2027 秋季需要重新核验。",
};

function localizedInsights(items: readonly string[], language: SnapshotLanguage) {
  if (language === "zh") {
    return items.map(item => knownChineseInsightTranslations[item.trim()] ?? item);
  }
  return items.flatMap(item => {
    const translated = knownEnglishInsightTranslations[item.trim()];
    if (translated) return [translated];
    return /[\u3400-\u9fff]/u.test(item) ? [] : [item];
  });
}

function deadlineHtml(program: PDFReportSnapshotProgram, language: SnapshotLanguage) {
  if (!program.deadlineSummary.length) return compactText(missing(language, "date"), language);
  const hasCurrentDeadline = program.deadlineSummary.some(item => item.isCurrentCycle);
  const currentCycleNotice = !hasCurrentDeadline
    ? `<div class="current-cycle-notice"><span>${escapeHtml(
        language === "zh" ? "目标申请季截止日期尚未公布" : "The target-cycle deadline has not been published",
      )}</span></div>`
    : "";
  const deadlines = program.deadlineSummary.map(item => {
    const value = item.date || missing(language, "date");
    const status = item.verificationStatus
      ? verificationLabels[language][item.verificationStatus]
      : missing(language, "date");
    const label = [item.label, item.deadlineType, item.intake].filter(Boolean).join(" · ");
    return `<div>${label ? `<small>${escapeHtml(label)}</small>` : ""}<span>${escapeHtml(value)}</span><em>${escapeHtml(status)}</em></div>`;
  }).join("");
  return `${currentCycleNotice}${deadlines}`;
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
      code: "NOT_PUBLISHED",
      zh: count => `${count} 个项目包含目标申请季尚未公布的字段。`,
      en: count => `${count} program${count === 1 ? "" : "s"} contain fields not yet published for the target cycle.`,
    },
    {
      code: "FETCH_FAILED",
      zh: count => `${count} 个项目存在官方页面抓取或解析失败。`,
      en: count => `${count} program${count === 1 ? "" : "s"} have official pages that could not be fetched or parsed.`,
    },
    {
      code: "SOURCE_CONFLICT",
      zh: count => `${count} 个项目存在官方来源冲突，需要人工核验。`,
      en: count => `${count} program${count === 1 ? "" : "s"} have conflicting official sources requiring manual review.`,
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
    {
      code: "INCOMPLETE_USER_PROFILE",
      zh: () => "申请人画像不完整，本报告已降级为候选项目清单。",
      en: () => "The applicant profile is incomplete; this report is a candidate list.",
    },
  ];
  return definitions.flatMap(definition => {
    const relevant = snapshot.reportWarnings.filter(item => item.code === definition.code);
    if (!relevant.length) return [];
    const programIds = new Set(relevant.map(item => item.legacyId).filter(Boolean));
    const count = ["MISSING_USER_PROFILE", "INCOMPLETE_USER_PROFILE"].includes(definition.code)
      ? 1
      : Math.max(programIds.size, 1);
    return [language === "zh" ? definition.zh(count) : definition.en(count)];
  }).slice(0, 8);
}

function projectCard(program: PDFReportSnapshotProgram, language: SnapshotLanguage) {
  const zh = language === "zh";
  const requirements = program.admissionsRequirements;
  const website = programWebsite(program);
  const suggestedCategory = program.categoryDecision.origin === "rule"
    ? categoryLabels[language][program.categoryDecision.value]
    : null;
  const programStatusLabel = zh
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
  const degreeAttribute = [
    program.programAttributes.degreeType,
    zh
      ? {
          thesis: "论文型",
          "non-thesis": "非论文型",
          both: "论文 / 非论文均可",
          "not-confirmed": "论文属性待核验",
        }[program.programAttributes.thesisMode]
      : {
          thesis: "Thesis",
          "non-thesis": "Non-thesis",
          both: "Thesis / non-thesis",
          "not-confirmed": "Thesis format not confirmed",
        }[program.programAttributes.thesisMode],
    zh
      ? {
          professional: "就业 / 实践导向",
          research: "研究导向",
          coursework: "授课导向",
          mixed: "研究与授课并重",
          "not-confirmed": "培养导向待核验",
        }[program.programAttributes.orientation]
      : {
          professional: "Professional / practice-oriented",
          research: "Research-oriented",
          coursework: "Coursework-oriented",
          mixed: "Research and coursework",
          "not-confirmed": "Orientation not confirmed",
        }[program.programAttributes.orientation],
  ].join(" · ");
  const analysisSections = [
    {
      title: zh ? "进入候选名单的原因" : "Why it is on the list",
      items: program.categoryDecision.rationale,
    },
    { title: zh ? "项目优势" : "Highlights", items: localizedInsights(program.highlights, language) },
    { title: zh ? "适合人群" : "Best fit", items: localizedInsights(program.bestFit, language) },
    { title: zh ? "主要风险" : "Risk factors", items: localizedInsights(program.riskFactors, language) },
    { title: zh ? "尚未满足的要求" : "Unmet requirements", items: program.unmetRequirements },
    { title: zh ? "下一步行动" : "Next actions", items: program.nextActions },
  ].filter(section => section.items.length > 0);
  const sources = [...new Map(
    program.officialSources
      .filter(item => item.official)
      .map(item => [`${item.field}|${item.domain}`, item] as const),
  ).values()].slice(0, 5);
  const location = [program.university.city, program.university.state, program.university.country]
    .filter(Boolean)
    .join(", ");
  return `<article class="program-card category-${program.category}">
    <div class="program-head">
      <div>
        <p class="category-label">${zh ? "我的分类" : "My category"} · ${escapeHtml(categoryLabels[language][program.category])}</p>
        <h2>${escapeHtml(zh && program.university.nameZh ? program.university.nameZh : program.university.name)}</h2>
        <p>${escapeHtml(zh && program.programNameZh ? program.programNameZh : program.programName)} · ${escapeHtml(program.degree)}</p>
        ${location ? `<p>${escapeHtml(location)}</p>` : ""}
      </div>
      <span class="status">${escapeHtml(programStatusLabel)}</span>
    </div>
    ${suggestedCategory ? `<div class="suggested-category"><b>${zh ? "系统参考" : "Suggested category"}: ${escapeHtml(suggestedCategory)}</b>${list(
      program.categoryDecision.rationale,
      "",
      3,
      count => zh ? `另有 ${count} 项判断依据` : `${count} more reference factor${count === 1 ? "" : "s"}`,
    )}</div>` : ""}
    <div class="fact-grid">
      <div class="deadline-fact"><b>${zh ? "截止日期" : "Deadline"}</b>${deadlineHtml(program, language)}</div>
      <div><b>GRE</b><span>${escapeHtml(greLabel(requirements.gre, language))}</span></div>
      <div><b>TOEFL / IELTS</b><span>${escapeHtml(requirementLabel(requirements.toefl, language))} / ${escapeHtml(requirementLabel(requirements.ielts, language))}</span></div>
      <div><b>${zh ? "推荐信" : "Recommendations"}</b><span>${escapeHtml(lettersLabel(requirements.letters, language))}</span></div>
      <div><b>${zh ? "项目时长" : "Duration"}</b><span>${escapeHtml(duration)}</span></div>
      <div><b>${zh ? "官方学费" : "Official tuition"}</b><span>${escapeHtml(tuition)}</span></div>
    </div>
    <div class="attribute-note"><b>${zh ? "学位与培养属性" : "Degree and format"}</b><span>${escapeHtml(degreeAttribute)}</span><span>${escapeHtml(program.programAttributes.explanation)}</span></div>
    ${analysisSections.length ? `<div class="analysis-grid">${analysisSections.map(section => `<section><h3>${escapeHtml(section.title)}</h3>${list(section.items, "", 5)}</section>`).join("")}</div>` : ""}
    ${program.userNotes ? `<div class="note"><b>${zh ? "个人备注" : "Personal note"}</b><span>${escapeHtml(program.userNotes)}</span></div>` : ""}
    ${sources.length ? `<div class="sources"><b>${zh ? "官方来源与核验" : "Official sources and verification"}</b>${sources.map(source => `<a href="${escapeHtml(source.url)}">${escapeHtml(sourceFieldLabel(source.field, language))} · ${escapeHtml(source.domain)} · ${escapeHtml(statusLabel(source.status, language))}${source.lastVerifiedAt ? ` · ${escapeHtml(source.lastVerifiedAt)}` : ""}</a>`).join("")}</div>` : ""}
    <div class="card-footer">
      <span>${zh ? "数据可信度" : "Data confidence"}: ${escapeHtml(zh ? {high:"高",medium:"中",low:"低"}[program.verificationSummary.confidence] : {high:"High",medium:"Medium",low:"Low"}[program.verificationSummary.confidence])}</span>
      ${website ? `<a href="${escapeHtml(website)}">${escapeHtml(sourceCellLabel(website, language))}</a>` : ""}
    </div>
  </article>`;
}

function applicantProfileHtml(snapshot: PDFReportSnapshot) {
  const zh = snapshot.reportMeta.language === "zh";
  const rows = applicantRows(snapshot);
  const educationCount = snapshot.applicant.educationExperiences.length;
  if (!snapshot.applicant.profileAvailable && !educationCount) return "";
  return `<section class="applicant-profile">
    <header><h2>${zh ? "申请者画像" : "Applicant profile"}</h2><span>${zh ? "核心画像完成度" : "Core profile completion"} · ${snapshot.applicant.completion.completionRate}%</span></header>
    <div class="applicant-facts">${rows.map(([label, value]) => `<div><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></div>`).join("")}</div>
  </section>`;
}

export function buildSchoolListReportHtml(
  snapshot: PDFReportSnapshot,
  brandUrl = "/brand/applyme-horizontal.png",
) {
  const language = snapshot.reportMeta.language;
  const zh = language === "zh";
  const summary = snapshot.selectionSummary;
  const warnings = warningSummary(snapshot);
  const personalized = snapshot.reportMeta.reportMode === "personalized";
  const hasUserCategory =
    summary.reachCount + summary.matchCount + summary.safetyCount > 0;
  const suggestedSummary = snapshot.programs.reduce(
    (counts, program) => {
      if (
        program.category === "unclassified" &&
        program.categoryDecision.origin === "rule" &&
        program.categoryDecision.value !== "unclassified"
      ) {
        counts[program.categoryDecision.value] += 1;
      }
      return counts;
    },
    { reach: 0, match: 0, safety: 0 },
  );
  const hasSuggestedSummary =
    suggestedSummary.reach + suggestedSummary.match + suggestedSummary.safety > 0;
  const categoryOrder = ["reach", "match", "safety", "unclassified"] as const;
  const categoryGroups = categoryOrder.flatMap(category => {
    const programs = snapshot.programs.filter(program => program.category === category);
    if (!programs.length) return [];
    const countLabel = zh ? `${programs.length} 个项目` : `${programs.length} program${programs.length === 1 ? "" : "s"}`;
    return [{
      category,
      html: `<section class="category-group" data-category="${category}"><header class="category-heading"><i></i><div><h2>${escapeHtml(categoryLabels[language][category])}</h2><p>${escapeHtml(countLabel)}</p></div></header>${programs.map(program => projectCard(program, language)).join("")}</section>`,
    }];
  });
  const generatedDate = new Date(snapshot.reportMeta.generatedAt).toLocaleDateString(zh ? "zh-CN" : "en-US");
  const reportType = personalized
    ? hasUserCategory
      ? (zh ? "个性化选校报告" : "Personalized School Selection Report")
      : (zh ? "申请者画像与候选项目分析" : "Applicant Profile and Candidate Program Analysis")
    : (zh ? "候选项目清单" : "Candidate Program List");
  const darkBrandUrl = brandUrl.replace("applyme-horizontal.png", "applyme-horizontal-dark.png");
  return `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(snapshot.reportMeta.title)}</title>
  <style>
    @page{size:A4 portrait;margin:0}
    *{box-sizing:border-box}
    html{background:#eef3f8}
    body{margin:0;color:#172d4a;background:#eef3f8;font:11px/1.45 Arial,"Microsoft YaHei","Noto Sans CJK SC",sans-serif}
    h1,h2,h3,p{margin:0}
    .toolbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 16px;color:#eef6ff;background:#102d4f}
    .toolbar p{font-size:12px}
    button{flex:none;border:0;border-radius:9px;padding:9px 14px;color:#fff;background:#2f79b7;font-weight:700;cursor:pointer}
    .report-source{display:none}
    .report-pages{display:grid;gap:12px;padding:12px 0}
    .pdf-page{position:relative;box-sizing:border-box;width:210mm;height:297mm;margin:0 auto;padding:12mm 12mm 16mm;overflow:hidden;background:#fff;box-shadow:0 8px 28px rgba(23,45,74,.12)}
    .page-content{height:269mm;overflow:hidden}
    .page-footer{position:absolute;right:12mm;bottom:7mm;left:12mm;display:flex;justify-content:space-between;border-top:1px solid #e5ebf2;padding-top:3mm;color:#64748b;font-size:9px}
    .cover{height:100%}
    .hero{padding:18px 20px;color:#fff;background:linear-gradient(135deg,#102d4f,#27659a);border-radius:16px}
    .brand-logo{display:block;width:142px;height:auto;max-height:38px;object-fit:contain;object-position:left center}
    .hero .brand-logo{margin-bottom:13px}
    .hero h1{font-size:24px;line-height:1.25}
    .meta{display:flex;flex-wrap:wrap;gap:5px 18px;margin-top:9px;opacity:.88}.meta span{white-space:normal}
    .summary{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin:13px 0}
    .summary div{padding:9px;border:1px solid #dbe4ee;border-radius:10px;background:#f7f9fc}
    .summary .reach{background:#fff2f2;border-color:#efd4d4}.summary .match{background:#fff8e6;border-color:#eadcaf}.summary .safety{background:#eef8f1;border-color:#cfe4d5}.summary .unclassified{background:#f1f4f7;border-color:#d8e0e8}
    .summary span,.summary b{display:block}.summary b{font-size:19px}
    .suggested-summary{display:flex;align-items:center;gap:12px;margin:-5px 0 13px;padding:8px 10px;border:1px solid #dbe4ee;border-radius:10px;background:#f8fafc}
    .suggested-summary>span{color:#52677c;font-weight:700}.suggested-summary div{display:flex;gap:6px}.suggested-summary b{padding:3px 8px;border-radius:999px;background:#edf2f7;font-size:10px}.suggested-summary .reach{color:#8c4148;background:#fbe9ea}.suggested-summary .match{color:#7f5d15;background:#fff3d5}.suggested-summary .safety{color:#326746;background:#e7f3eb}
    .applicant-profile{margin:0 0 12px;padding:10px 12px;border:1px solid #dbe4ee;border-radius:12px;background:#f8fafc}
    .applicant-profile header{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}.applicant-profile h2{font-size:14px}.applicant-profile header span{color:#27659a;font-weight:800}
    .applicant-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px 12px;max-height:118mm;overflow:hidden}
    .applicant-facts div{min-width:0;padding:5px 7px;border-radius:7px;background:#fff}.applicant-facts small,.applicant-facts b{display:block;overflow-wrap:anywhere}.applicant-facts small{color:#64748b}.applicant-facts b{font-size:10px}
    .warnings{padding:12px 14px;border:1px solid #f0d8a7;border-radius:12px;background:#fff9eb}
    .warnings h2{font-size:14px}.warnings ul{display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;margin:8px 0 0;padding-left:18px}
    .cover-note{margin-top:14px;color:#64748b}
    .page-brand{display:flex;align-items:center;height:11mm;margin-bottom:4mm;border-bottom:1px solid #e5ebf2}.page-brand .brand-logo{width:92px;max-height:25px}
    .category-heading{display:flex;align-items:center;gap:9px;margin:0 0 4mm;padding:2mm 1mm;break-after:avoid;page-break-after:avoid}.category-heading i{width:9px;height:9px;border:2px solid currentColor;border-radius:50%}.category-heading h2{font-size:15px}.category-heading p{color:#64748b}
    .category-group[data-category="reach"] .category-heading{color:#a74f56}.category-group[data-category="match"] .category-heading{color:#98701f}.category-group[data-category="safety"] .category-heading{color:#397551}.category-group[data-category="unclassified"] .category-heading{color:#5c7085}
    .program-card{position:relative;margin:0 0 5mm;padding:12px 14px;border:1px solid #dbe4ee;border-radius:14px;background:#fff;break-inside:avoid;break-inside:avoid-page;page-break-inside:avoid;box-shadow:0 3px 10px rgba(23,45,74,.04)}
    .program-card:before{content:"";position:absolute;top:-1px;right:13px;left:13px;height:3px;border-radius:0 0 3px 3px;background:#8092a5}.program-card.category-reach:before{background:#c87980}.program-card.category-match:before{background:#c7a04e}.program-card.category-safety:before{background:#6fa282}
    .program-card:last-child{margin-bottom:0}
    .program-head{display:flex;justify-content:space-between;gap:12px}
    .program-head h2{font-size:16px;line-height:1.25}.program-head p{color:#64748b}
    .category-label{display:inline-block;margin-bottom:3px;padding:2px 7px;border-radius:999px;color:#3c5873!important;background:#edf2f7;font-weight:800!important}.category-reach .category-label{color:#8c4148!important;background:#fbe9ea}.category-match .category-label{color:#7f5d15!important;background:#fff3d5}.category-safety .category-label{color:#326746!important;background:#e7f3eb}
    .status{height:max-content;padding:3px 8px;border-radius:999px;background:#edf4fb;font-weight:700}
    .suggested-category{margin-top:8px;padding:7px 9px;border-left:3px solid #8aa8c3;border-radius:7px;background:#f3f7fa;color:#52677c}.suggested-category b{display:block}.suggested-category ul{margin-top:3px}
    .fact-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:9px 0}
    .fact-grid>div{min-width:0;padding:7px 8px;border-radius:8px;background:#f7f9fc}
    .fact-grid b,.fact-grid span,.deadline-fact small,.deadline-fact em{display:block}
    .deadline-fact small{color:#64748b}.deadline-fact em{color:#8a5a00;font-style:normal;font-size:10px}
    .analysis-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    .analysis-grid h3{margin-bottom:3px;font-size:11px}
    .attribute-note,.sources{display:grid;gap:4px;margin-top:8px;padding:7px 8px;border-radius:8px;background:#f7f9fc}
    .sources a{display:block}
    ul{margin:0;padding-left:16px}.muted{color:#8795a8}
    .note{display:flex;gap:8px;margin-top:8px;padding:7px 8px;border-radius:8px;background:#fff8e8}
    .card-footer{display:flex;justify-content:space-between;gap:12px;margin-top:8px;padding-top:7px;border-top:1px solid #edf1f5;color:#64748b}
    a{color:#145b91;overflow-wrap:anywhere}
    .report-footer{margin-top:10px;color:#64748b;text-align:center}
    @media print{
      html,body{background:#fff}
      .toolbar{display:none}
      .report-pages{display:block;padding:0}
      .pdf-page{margin:0;box-shadow:none;break-after:page;page-break-after:always}
      .pdf-page:last-child{break-after:auto;page-break-after:auto}
      .program-card{box-shadow:none}
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <p>${zh ? "保存 PDF 时，建议在“更多设置”中关闭“页眉和页脚”。" : "When saving as PDF, disable “Headers and footers” under More settings."}</p>
    <button type="button" onclick="window.print()">${zh ? "打印 / 保存 PDF" : "Print / Save PDF"}</button>
  </div>
  <main class="report-source">
  <section class="cover">
    <header class="hero">
      <img class="brand-logo" src="${escapeHtml(darkBrandUrl)}" alt="ApplyME">
      <h1>${escapeHtml(snapshot.reportMeta.title)}</h1>
      <p class="meta"><span>${zh ? "生成日期" : "Generated"}: ${escapeHtml(generatedDate)}</span><span>${zh ? "申请季" : "Application cycle"}: ${escapeHtml(snapshot.reportMeta.applicationCycle)} Fall</span><span>${zh ? "报告类型" : "Report type"}: ${escapeHtml(reportType)}</span></p>
    </header>
    <section class="summary">
      <div><span>${zh ? "项目总数" : "Total"}</span><b>${summary.totalPrograms}</b></div>
      <div class="reach"><span>${zh ? "冲刺" : "Reach"}</span><b>${summary.reachCount}</b></div>
      <div class="match"><span>${zh ? "匹配" : "Match"}</span><b>${summary.matchCount}</b></div>
      <div class="safety"><span>${zh ? "保底" : "Safety"}</span><b>${summary.safetyCount}</b></div>
      <div class="unclassified"><span>${zh ? "未分类" : "Unclassified"}</span><b>${summary.unclassifiedCount}</b></div>
    </section>
    ${hasSuggestedSummary ? `<section class="suggested-summary"><span>${zh ? "系统参考分布（不覆盖我的分类）" : "Suggested distribution (does not override My category)"}</span><div><b class="reach">${zh ? "冲刺" : "Reach"} ${suggestedSummary.reach}</b><b class="match">${zh ? "匹配" : "Match"} ${suggestedSummary.match}</b><b class="safety">${zh ? "保底" : "Safety"} ${suggestedSummary.safety}</b></div></section>` : ""}
    ${applicantProfileHtml(snapshot)}
    ${!personalized ? `<section class="warnings"><h2>${zh ? "如何生成个性化系统参考" : "How to enable personalized suggestions"}</h2><p>${zh ? `请补充：${snapshot.reportMeta.profileMissingFields.join("、")}` : `Complete: ${snapshot.reportMeta.profileMissingFields.join(", ")}`}</p><p>${zh ? "当前报告保留“我的分类”；画像完整后，系统参考仍不会覆盖用户分类。" : "This report preserves My category. Suggested categories never override the user's category."}</p></section>` : ""}
    ${warnings.length ? `<section class="warnings"><h2>${zh ? "数据提醒" : "Data warnings"}</h2><ul>${warnings.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : ""}
    <p class="cover-note">${zh ? "申请要求可能随申请周期变化，请在提交前前往大学官网再次核实。" : "Requirements may change by application cycle. Verify all information on official university websites before applying."}</p>
  </section>
  <section class="program-list">${categoryGroups.map(group => group.html).join("")}<p class="report-footer">${zh ? "报告结束" : "End of report"}</p></section>
  </main>
  <div class="report-pages" aria-label="${zh ? "PDF 报告预览" : "PDF report preview"}"></div>
  <script>
    (() => {
      const pagesRoot = document.querySelector(".report-pages");
      const cover = document.querySelector(".report-source .cover");
      const groups = [...document.querySelectorAll(".report-source .category-group")];
      const endLabel = ${JSON.stringify(zh ? "报告结束" : "End of report")};
      const footerTitle = ${JSON.stringify(snapshot.reportMeta.title)};
      const makePage = (withBrand = true) => {
        const page = document.createElement("section");
        page.className = "pdf-page";
        const content = document.createElement("div");
        content.className = "page-content";
        if (withBrand) {
          const brand = document.createElement("header");
          brand.className = "page-brand";
          brand.innerHTML = ${JSON.stringify(`<img class="brand-logo" src="${brandUrl}" alt="ApplyME">`)};
          content.append(brand);
        }
        const footer = document.createElement("footer");
        footer.className = "page-footer";
        footer.innerHTML = "<span></span><span></span>";
        page.append(content, footer);
        pagesRoot.append(page);
        return { page, content, footer };
      };
      const coverPage = makePage(false);
      coverPage.content.append(cover.cloneNode(true));
      let current = makePage();
      for (const sourceGroup of groups) {
        const sourceHeading = sourceGroup.querySelector(".category-heading");
        const sourceCards = [...sourceGroup.querySelectorAll(".program-card")];
        for (let index = 0; index < sourceCards.length; index += 1) {
          const heading = index === 0 ? sourceHeading.cloneNode(true) : null;
          const card = sourceCards[index].cloneNode(true);
          if (heading) current.content.append(heading);
          current.content.append(card);
          if (current.content.scrollHeight > current.content.clientHeight) {
            card.remove();
            if (heading) heading.remove();
            current = makePage();
            if (heading) current.content.append(heading);
            current.content.append(card);
            if (current.content.scrollHeight > current.content.clientHeight) {
              card.style.breakInside = "auto";
            }
          }
        }
      }
      if (!current.content.children.length) current.page.remove();
      else {
        const end = document.createElement("p");
        end.className = "report-footer";
        end.textContent = endLabel;
        current.content.append(end);
      }
      const pages = [...document.querySelectorAll(".pdf-page")];
      pages.forEach((page, index) => {
        const spans = page.querySelectorAll(".page-footer span");
        spans[0].textContent = footerTitle;
        spans[1].textContent = String(index + 1) + " / " + String(pages.length);
      });
      document.documentElement.dataset.paginated = "true";
    })();
  </script>
</body>
</html>`;
}

export function exportSchoolListPdf({
  items,
  programs,
  language,
  userProfile,
}: {
  items: readonly SchoolListItem[];
  programs: readonly Program[];
  language: SnapshotLanguage;
  userProfile?: UserProfile | null;
}) {
  if (!items.length) return;
  const result = createSchoolListSnapshot(items, programs, language, userProfile);
  if (!result.snapshot) {
    throw new Error(language === "zh" ? "无法生成选校报告" : "Unable to generate report");
  }
  const basePath = window.location.pathname.startsWith("/applyme-2027-fall/")
    ? "/applyme-2027-fall"
    : "";
  const brandUrl = new URL(`${basePath}/brand/applyme-horizontal.png`, window.location.origin).href;
  const reportBlob = new Blob([buildSchoolListReportHtml(result.snapshot, brandUrl)], {
    type: "text/html;charset=utf-8",
  });
  const reportUrl = URL.createObjectURL(reportBlob);
  const popup = window.open(reportUrl, "_blank");
  if (!popup) {
    URL.revokeObjectURL(reportUrl);
    throw new Error(language === "zh" ? "浏览器阻止了报告窗口" : "The browser blocked the report window");
  }
  popup.opener = null;
  setTimeout(() => URL.revokeObjectURL(reportUrl), 60_000);
}
