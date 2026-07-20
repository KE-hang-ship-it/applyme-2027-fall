"use client";

import { useState } from "react";
import type { Program, ProgramTrack } from "@/types/application";

type ProgramCurriculumProps = {
  program: Program;
  language: "zh" | "en";
  onCourseClick?: (track: string, course: string) => void;
};

const t = {
  zh: {
    title: "项目学什么",
    programFocus: "项目定位",
    thesisOption: "Thesis Option",
    credits: "学分要求",
    coreAreas: "核心方向",
    curriculumStructure: "课程结构",
    capstone: "Capstone / Project",
    crossDepartment: "跨院选课",
    viewCourses: "查看课程",
    noCourses: "暂未收录详细课程信息",
    notVerified: "暂未核实",
  },
  en: {
    title: "What Will I Learn?",
    programFocus: "Program Focus",
    thesisOption: "Thesis Option",
    credits: "Credits Required",
    coreAreas: "Core Areas",
    curriculumStructure: "Curriculum Structure",
    capstone: "Capstone / Project",
    crossDepartment: "Cross-Department Courses",
    viewCourses: "View Courses",
    noCourses: "No detailed course information available",
    notVerified: "Not verified",
  },
};

export function ProgramCurriculum({ program, language, onCourseClick }: ProgramCurriculumProps) {
  const texts = t[language];
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);

  const fields = [
    { label: texts.programFocus, value: program.field || texts.notVerified },
    { label: texts.thesisOption, value: texts.notVerified },
    { label: texts.credits, value: program.credits || texts.notVerified },
    { label: texts.curriculumStructure, value: texts.notVerified },
    { label: texts.capstone, value: texts.notVerified },
    { label: texts.crossDepartment, value: texts.notVerified },
  ];

  return (
    <section id="curriculum" className="program-detail-section program-curriculum">
      <div className="program-detail-section-header">
        <span className="program-detail-section-badge">{texts.title}</span>
        <h2 className="program-detail-section-title">{texts.title}</h2>
        <span className="program-detail-section-status">部分核实</span>
      </div>
      
      <div className="program-curriculum-fields">
        {fields.map((field, index) => (
          <div key={index} className="program-curriculum-field">
            <span className="program-curriculum-label">{field.label}</span>
            <b className="program-curriculum-value">{field.value}</b>
          </div>
        ))}
      </div>

      {program.tracks && program.tracks.length > 0 && (
        <div className="program-curriculum-areas">
          <h3 className="program-curriculum-areas-title">{texts.coreAreas}</h3>
          <div className="program-curriculum-areas-list">
            {program.tracks.map((track: ProgramTrack) => (
              <div key={track.name} className="program-curriculum-track">
                <button
                  className="program-curriculum-track-header"
                  onClick={() => setExpandedTrack(expandedTrack === track.name ? null : track.name)}
                >
                  <span className="program-curriculum-track-name">{track.name}</span>
                  <span className="program-curriculum-track-count">{track.courses.length} {language === "zh" ? "门课程" : "courses"}</span>
                  <span className="program-curriculum-track-toggle">
                    {expandedTrack === track.name ? "−" : "+"}
                  </span>
                </button>
                {expandedTrack === track.name && (
                  <div className="program-curriculum-track-courses">
                    {track.courses.map((course) => (
                      <button
                        key={course}
                        className="program-curriculum-course"
                        onClick={() => onCourseClick?.(track.name, course)}
                      >
                        {course}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(!program.tracks || program.tracks.length === 0) && (
        <div className="program-curriculum-empty">
          {texts.noCourses}
        </div>
      )}
    </section>
  );
}