import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  buildSchoolListReportHtml,
  buildSchoolListWorkbookBytes,
  createSchoolListSnapshot,
} from "../lib/export-school-list";
import type { Program, SchoolListItem, UserProfile } from "../types/application";

const outputDirectory = resolve(
  process.argv[2] ?? "../outputs/thread/applyme-report-regression",
);

const legacyPrograms: Program[] = [
  ["vtech-me", "Virginia Tech", "弗吉尼亚理工大学", "MS"],
  ["neu-me", "Northeastern University", "东北大学", "MS"],
  ["osu-me", "The Ohio State University", "俄亥俄州立大学", "MS"],
  ["uiuc-me", "University of Illinois Urbana-Champaign", "伊利诺伊大学厄巴纳-香槟分校", "MEng"],
  ["wisc-me", "University of Wisconsin–Madison", "威斯康星大学麦迪逊分校", "MS"],
  ["umd-me", "University of Maryland, College Park", "马里兰大学帕克分校", "MEng"],
  ["duke-me", "Duke University", "杜克大学", "MS"],
].map(([id, school, schoolZh, degree], index) => ({
  id,
  school,
  schoolZh,
  rank: index + 1,
  program: "Mechanical Engineering",
  programZh: "机械工程",
  degree,
  field: "Mechanical Engineering",
  deadline: "",
  letters: "",
  cv: "",
  sop: "",
  gre: "",
  credits: "",
  duration: "",
  verified: "待复核",
  source: "https://example.edu/",
  tracks: [],
}));

const items: SchoolListItem[] = legacyPrograms.map((program, index) => ({
  programId: program.id,
  category: "unclassified",
  status: "considering",
  note: index === 0 ? "重点核对研究方向与 funding deadline。" : "",
  addedAt: `2026-07-${String(20 + index).padStart(2, "0")}T00:00:00.000Z`,
}));

const userProfile: UserProfile = {
  name: "回归测试申请者",
  applicationYear: "2027",
  targetDegree: ["MS", "MEng"],
  targetMajor: ["Mechanical Engineering", "Robotics"],
  undergraduateSchool: "示例理工大学",
  undergraduateMajor: "Mechanical Engineering",
  gpa: { value: 3.68, scale: 4 },
  toefl: { score: 105 },
  gre: { total: 326, quantitative: 168, verbal: 158, analyticalWriting: 4 },
  researchExperience: [
    {
      title: "机器人控制研究",
      organization: "机械工程实验室",
      description: "完成运动规划与控制实验。",
    },
  ],
  internshipExperience: [
    {
      title: "机械设计实习",
      organization: "示例制造企业",
      description: "参与机械结构设计与验证。",
    },
  ],
  targetAreas: ["Robotics", "Controls", "Design and Manufacturing"],
  targetRegions: ["美国"],
  budget: {
    amount: 90_000,
    currency: "USD",
    period: "program",
    includesLivingCost: true,
  },
  preferredProgramType: ["coursework", "professional", "non-thesis"],
  careerGoal: "毕业后从事机器人与智能制造相关工程工作。",
};

await mkdir(outputDirectory, { recursive: true });

for (const language of ["zh", "en"] as const) {
  const result = createSchoolListSnapshot(items, legacyPrograms, language, userProfile);
  if (!result.snapshot) throw new Error(`Snapshot generation failed (${language}).`);

  const workbook = buildSchoolListWorkbookBytes(result.snapshot, legacyPrograms);
  await writeFile(
    resolve(outputDirectory, `applyme-school-list-regression-${language}.xlsx`),
    workbook,
  );
  await writeFile(
    resolve(outputDirectory, `applyme-school-report-regression-${language}.html`),
    buildSchoolListReportHtml(result.snapshot),
    "utf8",
  );
  await writeFile(
    resolve(outputDirectory, `applyme-school-report-regression-${language}.json`),
    JSON.stringify(result.snapshot, null, 2),
    "utf8",
  );
}

console.log(`Regression artifacts written to ${outputDirectory}`);
