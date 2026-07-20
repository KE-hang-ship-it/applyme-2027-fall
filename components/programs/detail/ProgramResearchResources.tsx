"use client";

import { useState } from "react";
import type { Program, ProgramTrack } from "@/types/application";

type ProgramResearchResourcesProps = {
  program: Program;
  language: "zh" | "en";
  onCourseClick?: (track: string, course: string) => void;
};

const t = {
  zh: {
    title: "课程与研究资源",
    coreCourses: "核心课程",
    electiveCourses: "选修课程",
    researchAreas: "研究方向",
    laboratories: "实验室",
    faculty: "教授与研究团队",
    researchCenters: "研究中心",
    capstone: "Capstone / Thesis",
    industryPartnerships: "企业合作与实习",
    expand: "展开查看",
    collapse: "收起",
    noData: "暂未收录详细信息",
  },
  en: {
    title: "Courses & Research",
    coreCourses: "Core Courses",
    electiveCourses: "Elective Courses",
    researchAreas: "Research Areas",
    laboratories: "Laboratories",
    faculty: "Faculty & Research Teams",
    researchCenters: "Research Centers",
    capstone: "Capstone / Thesis",
    industryPartnerships: "Industry Partnerships",
    expand: "Expand",
    collapse: "Collapse",
    noData: "No detailed information available",
  },
};

export function ProgramResearchResources({ program, language, onCourseClick }: ProgramResearchResourcesProps) {
  const texts = t[language];
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section id="research" className="program-detail-section program-research">
      <button
        className="program-detail-section-header program-detail-section-header-clickable"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="program-detail-section-badge">{texts.title}</span>
        <h2 className="program-detail-section-title">{texts.title}</h2>
        <span className="program-detail-section-status">待核实</span>
        <span className="program-detail-section-toggle">
          {isExpanded ? "−" : "+"}
        </span>
      </button>
      
      {isExpanded && (
        <div className="program-research-content">
          {program.tracks && program.tracks.length > 0 ? (
            <div className="program-research-courses">
              <h3 className="program-research-subtitle">{texts.researchAreas}</h3>
              {program.tracks.map((track: ProgramTrack) => (
                <div key={track.name} className="program-research-track">
                  <h4 className="program-research-track-name">{track.name}</h4>
                  <div className="program-research-track-courses">
                    {track.courses.map((course) => (
                      <button
                        key={course}
                        className="program-research-course"
                        onClick={() => onCourseClick?.(track.name, course)}
                      >
                        {course}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="program-research-empty">
              {texts.noData}
            </div>
          )}

          <div className="program-research-other">
            <h3 className="program-research-subtitle">{texts.laboratories}</h3>
            <p className="program-research-text">-</p>
            
            <h3 className="program-research-subtitle">{texts.faculty}</h3>
            <p className="program-research-text">-</p>
            
            <h3 className="program-research-subtitle">{texts.researchCenters}</h3>
            <p className="program-research-text">-</p>
            
            <h3 className="program-research-subtitle">{texts.capstone}</h3>
            <p className="program-research-text">-</p>
            
            <h3 className="program-research-subtitle">{texts.industryPartnerships}</h3>
            <p className="program-research-text">-</p>
          </div>
        </div>
      )}
    </section>
  );
}