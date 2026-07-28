import { createPDFReportSnapshot } from "@/lib/create-pdf-report-snapshot";
import type {
  Program,
  SchoolListItem,
  UserSelection,
} from "@/types/application";
import type {
  PDFReportSnapshot,
  PDFReportSnapshotProgram,
  SnapshotLanguage,
} from "@/types/pdf-report-snapshot";

const categoryLabels = {
  zh: { reach: "冲刺", match: "匹配", safety: "保底", unclassified: "未分类" },
  en: { reach: "Reach", match: "Match", safety: "Safety", unclassified: "Unclassified" },
} as const;

function toSelection(item: SchoolListItem): UserSelection {
  return {
    ...item,
    priority: "unset",
    userNote: item.note,
    selectionReason: [],
    actionItems: [],
  };
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function download(name: string, content: string, type: string) {
  const blob = new Blob(["\uFEFF", content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportSchoolListCsv({
  items,
  programs,
  language,
}: {
  items: readonly SchoolListItem[];
  programs: readonly Program[];
  language: SnapshotLanguage;
}) {
  const byId = new Map(programs.map(program => [program.id, program]));
  const labels = language === "zh"
    ? ["分类", "学校", "项目", "学位", "地点", "截止日期", "个人备注", "项目官网"]
    : ["Category", "University", "Program", "Degree", "Location", "Deadline", "Personal note", "Official website"];
  const rows = items.flatMap(item => {
    const program = byId.get(item.programId);
    if (!program) return [];
    return [[
      categoryLabels[language][item.category],
      program.school,
      program.program,
      program.degree,
      [program.city, program.state, program.country].filter(Boolean).join(", "),
      program.deadline,
      item.note,
      program.programUrl || program.source,
    ]];
  });
  const csv = [labels, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
  download(`applyme-school-list-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function list(items: readonly string[], empty: string) {
  if (!items.length) return `<p class="muted">${escapeHtml(empty)}</p>`;
  return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function programSection(program: PDFReportSnapshotProgram, language: SnapshotLanguage) {
  const zh = language === "zh";
  const deadline = program.deadlineSummary
    .map(item => [item.label, item.date, item.verificationStatus].filter(Boolean).join(" · "))
    .join("<br>") || (zh ? "尚未公布" : "Not published");
  const tuition = program.tuitionSummary.unavailable
    ? (zh ? "未找到项目专属官方学费" : "No program-specific official tuition found")
    : program.tuitionSummary.displayText ||
      [program.tuitionSummary.currency, program.tuitionSummary.amount].filter(Boolean).join(" ");
  const sources = program.officialSources
    .map(source => `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.field)}</a></li>`)
    .join("");

  return `
    <section class="program">
      <div class="program-head">
        <div>
          <p class="eyebrow">${escapeHtml(categoryLabels[language][program.category])}</p>
          <h2>${escapeHtml(language === "zh" && program.university.nameZh ? program.university.nameZh : program.university.name)}</h2>
          <p>${escapeHtml(language === "zh" && program.programNameZh ? program.programNameZh : program.programName)} · ${escapeHtml(program.degree)}</p>
        </div>
        <span class="status">${escapeHtml(program.programStatus)}</span>
      </div>
      <div class="facts">
        <div><b>${zh ? "截止日期" : "Deadline"}</b><span>${deadline}</span></div>
        <div><b>${zh ? "项目学费" : "Tuition"}</b><span>${escapeHtml(tuition)}</span></div>
        <div><b>${zh ? "项目时长" : "Duration"}</b><span>${escapeHtml(program.curriculumSummary.duration || (zh ? "暂无官方数据" : "No official data"))}</span></div>
      </div>
      <div class="columns">
        <div><h3>${zh ? "项目优势" : "Highlights"}</h3>${list(program.highlights, zh ? "暂无官方数据" : "No official data")}</div>
        <div><h3>${zh ? "适合人群" : "Best fit"}</h3>${list(program.bestFit, zh ? "暂无官方数据" : "No official data")}</div>
        <div><h3>${zh ? "风险提示" : "Risk factors"}</h3>${list(program.riskFactors, zh ? "暂无已记录风险" : "No recorded risks")}</div>
      </div>
      ${program.userNotes ? `<div class="note"><b>${zh ? "我的备注" : "My note"}</b><p>${escapeHtml(program.userNotes)}</p></div>` : ""}
      ${sources ? `<div class="sources"><b>${zh ? "官方来源" : "Official sources"}</b><ul>${sources}</ul></div>` : ""}
    </section>`;
}

function reportHtml(snapshot: PDFReportSnapshot) {
  const language = snapshot.reportMeta.language;
  const zh = language === "zh";
  const summary = snapshot.selectionSummary;
  const warnings = snapshot.reportWarnings.length
    ? `<section class="warnings"><h2>${zh ? "数据提醒" : "Data warnings"}</h2>${list(snapshot.reportWarnings.map(item => item.message), "")}</section>`
    : "";
  return `<!doctype html>
  <html lang="${language}">
  <head>
    <meta charset="utf-8">
    <title>${zh ? "ApplyME 选校报告" : "ApplyME School Selection Report"}</title>
    <style>
      @page{size:A4;margin:15mm}
      *{box-sizing:border-box} body{margin:0;color:#172d4a;font:12px/1.6 Arial,"Microsoft YaHei",sans-serif}
      header{padding:22px 24px;color:#fff;background:linear-gradient(135deg,#102d4f,#27659a);border-radius:18px}
      h1{margin:0;font-size:26px} h2{margin:0;font-size:18px} h3{margin:0 0 6px;font-size:12px}
      p{margin:4px 0}.meta{opacity:.8}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}
      .summary div,.facts div{padding:10px;border:1px solid #dbe4ee;border-radius:10px;background:#f7f9fc}
      .summary b{display:block;font-size:20px}.program{break-inside:avoid;margin:16px 0;padding:18px;border:1px solid #dbe4ee;border-radius:16px}
      .program-head{display:flex;justify-content:space-between;gap:12px}.program-head p{color:#64748b}
      .eyebrow{font-weight:700;color:#27659a!important;text-transform:uppercase}.status{height:max-content;padding:4px 8px;border-radius:99px;background:#edf4fb}
      .facts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.facts b,.facts span{display:block}
      .columns{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.columns ul,.sources ul{margin:4px 0;padding-left:18px}
      .note,.sources,.warnings{margin-top:12px;padding:10px 12px;border-radius:10px;background:#f7f9fc}
      a{color:#145b91;overflow-wrap:anywhere}.muted{color:#64748b}
      footer{margin-top:20px;color:#64748b;text-align:center}
      @media print{button{display:none}.program{box-shadow:none}}
    </style>
  </head>
  <body>
    <header>
      <h1>${zh ? "ApplyME 机械工程硕士选校报告" : "ApplyME Mechanical Engineering School Selection Report"}</h1>
      <p class="meta">${zh ? "生成时间" : "Generated"}: ${escapeHtml(new Date(snapshot.reportMeta.generatedAt).toLocaleString(language === "zh" ? "zh-CN" : "en-US"))}</p>
    </header>
    <section class="summary">
      <div><span>${zh ? "项目总数" : "Total"}</span><b>${summary.totalPrograms}</b></div>
      <div><span>${zh ? "冲刺" : "Reach"}</span><b>${summary.reachCount}</b></div>
      <div><span>${zh ? "匹配" : "Match"}</span><b>${summary.matchCount}</b></div>
      <div><span>${zh ? "保底" : "Safety"}</span><b>${summary.safetyCount}</b></div>
    </section>
    ${warnings}
    ${snapshot.programs.map(program => programSection(program, language)).join("")}
    <footer>${zh ? "申请要求可能变化，请在提交前前往大学官网再次核实。" : "Requirements may change. Verify all information on official university websites before applying."}</footer>
    <script>window.addEventListener("load",()=>setTimeout(()=>window.print(),250));</script>
  </body></html>`;
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
  const result = createPDFReportSnapshot({
    userProfile: null,
    selections: items.map(toSelection),
    programs,
    language,
    applicationCycle: "2027",
    allowPartial: true,
  });
  if (!result.snapshot) throw new Error(language === "zh" ? "无法生成选校报告" : "Unable to generate report");
  const popup = window.open("", "_blank");
  if (!popup) throw new Error(language === "zh" ? "浏览器阻止了报告窗口" : "The browser blocked the report window");
  popup.opener = null;
  popup.document.open();
  popup.document.write(reportHtml(result.snapshot));
  popup.document.close();
}
