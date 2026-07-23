"use client";

import { useState } from "react";
import type { ProgramTrack, ProgramV2 } from "@/types/application";
import { fieldVerification, NO_OFFICIAL_DATA } from "@/lib/program-detail-view";
import { VerificationStatus } from "../VerificationStatus";

type Props = {
  program: ProgramV2;
  language: "zh" | "en";
  onCourseClick?: (track: string, course: string) => void;
};

export function ProgramCurriculum({ program, language, onCourseClick }: Props) {
  const zh = language === "zh";
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const curriculumVerification = fieldVerification(program, "curriculum") ?? { status: "pending" as const };
  const specializationVerification = fieldVerification(program, "specializations");
  const tracks: ProgramTrack[] =
    program.insights?.tracks?.length
      ? program.insights.tracks
      : program.insights?.specializations?.length
        ? program.insights.specializations.map(item => ({
            name: item.name,
            courses: (item.courses || []).map(course => course.name),
          }))
        : program.insights?.curriculum?.length
          ? program.insights.curriculum.map(group => ({
              name: group.name,
              courses: group.courses.map(course => course.name),
            }))
          : program.tracks || [];

  return (
    <section id="curriculum" className="program-detail-section program-curriculum">
      <div className="program-detail-section-header">
        <span className="program-detail-section-badge">{zh ? "课程与方向" : "Curriculum & Specializations"}</span>
        <h2 className="program-detail-section-title">{zh ? "课程与方向" : "Curriculum & Specializations"}</h2>
        <VerificationStatus verification={specializationVerification ?? curriculumVerification} language={language} />
      </div>
      <div className="program-curriculum-fields">
        <div className="program-curriculum-field">
          <span className="program-curriculum-label">{zh ? "项目定位" : "Program Focus"}</span>
          <b className="program-curriculum-value">{program.field || NO_OFFICIAL_DATA[language]}</b>
        </div>
        <div className="program-curriculum-field">
          <span className="program-curriculum-label">{zh ? "学分要求" : "Credits"}</span>
          <b className="program-curriculum-value">
            {program.applicationRequirements?.credits || program.credits || NO_OFFICIAL_DATA[language]}
          </b>
        </div>
      </div>
      {tracks.length > 0 ? (
        <div className="program-curriculum-areas">
          <h3 className="program-curriculum-areas-title">{zh ? "方向与课程结构" : "Areas & Course Structure"}</h3>
          <div className="program-curriculum-areas-list">
            {tracks.map(track => (
              <div key={track.name} className="program-curriculum-track">
                <button
                  className="program-curriculum-track-header"
                  onClick={() => setExpandedTrack(expandedTrack === track.name ? null : track.name)}
                >
                  <span className="program-curriculum-track-name">{track.name}</span>
                  <span className="program-curriculum-track-count">{track.courses.length} {zh ? "门课程" : "courses"}</span>
                  <span className="program-curriculum-track-toggle">{expandedTrack === track.name ? "−" : "+"}</span>
                </button>
                {expandedTrack === track.name && (
                  <div className="program-curriculum-track-courses">
                    {track.courses.map(course => (
                      <button key={course} className="program-curriculum-course" onClick={() => onCourseClick?.(track.name, course)}>
                        {course}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="program-curriculum-empty">{NO_OFFICIAL_DATA[language]}</div>
      )}
    </section>
  );
}
