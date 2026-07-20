"use client";

import type { Program } from "@/types/application";

type ProgramHighlightsProps = {
  program: Program;
  language: "zh" | "en";
};

const t = {
  zh: {
    title: "为什么考虑这个项目",
    suitableFor: "适合谁",
    advantages: "主要优势",
    considerations: "需要注意",
    notVerified: "当前未能核实",
  },
  en: {
    title: "Why Consider This Program",
    suitableFor: "Suitable For",
    advantages: "Key Advantages",
    considerations: "Considerations",
    notVerified: "Cannot verify at this time",
  },
};

function getHighlights(program: Program, language: "zh" | "en") {
  const texts = t[language];
  const highlights = {
    suitableFor: [] as string[],
    advantages: [] as string[],
    considerations: [] as string[],
  };

  if (program.programSummary) {
    highlights.advantages.push(program.programSummary);
  }

  if (program.tracks && program.tracks.length > 0) {
    const tracks = program.tracks.slice(0, 3).map(t => t.name).join("、");
    highlights.suitableFor.push(language === "zh"
      ? `对${tracks}等方向感兴趣的学生`
      : `Students interested in ${tracks}`);
  }

  if (program.degree) {
    highlights.suitableFor.push(language === "zh"
      ? `希望获得${program.degree}学位的申请者`
      : `Applicants seeking a ${program.degree} degree`);
  }

  if (program.duration) {
    highlights.advantages.push(language === "zh"
      ? `${program.duration}，时间安排灵活`
      : `${program.duration} program with flexible scheduling`);
  }

  if (program.ranking || program.nationalUniversityRanking || program.mechanicalEngineeringRanking) {
    highlights.advantages.push(language === "zh"
      ? "排名优秀，学术声誉良好"
      : "Strong academic reputation with excellent rankings");
  }

  if (program.city || program.state) {
    const location = program.city ? `${program.city}${program.state ? ", " + program.state : ""}` : program.state || "";
    highlights.advantages.push(language === "zh"
      ? `位于${location}，就业机会丰富`
      : `Located in ${location} with abundant job opportunities`);
  }

  if (highlights.suitableFor.length === 0) {
    highlights.suitableFor.push(texts.notVerified);
  }
  if (highlights.advantages.length === 0) {
    highlights.advantages.push(texts.notVerified);
  }
  if (highlights.considerations.length === 0) {
    highlights.considerations.push(texts.notVerified);
  }

  return highlights;
}

export function ProgramHighlights({ program, language }: ProgramHighlightsProps) {
  const texts = t[language];
  const highlights = getHighlights(program, language);

  const sections = [
    { title: texts.suitableFor, items: highlights.suitableFor },
    { title: texts.advantages, items: highlights.advantages },
    { title: texts.considerations, items: highlights.considerations },
  ];

  return (
    <section id="highlights" className="program-detail-section program-highlights">
      <div className="program-detail-section-header">
        <span className="program-detail-section-badge">{texts.title}</span>
        <h2 className="program-detail-section-title">{texts.title}</h2>
        <span className="program-detail-section-status">部分核实</span>
      </div>
      
      <div className="program-highlights-sections">
        {sections.map((section, index) => (
          <div key={index} className="program-highlights-section">
            <h3 className="program-highlights-section-title">{section.title}</h3>
            <ul className="program-highlights-list">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex} className="program-highlights-item">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}