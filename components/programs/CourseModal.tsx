"use client";

import type { Program } from "@/types/application";

interface CourseModalProps {
  course: string;
  track: string;
  program: Program;
  language: "zh" | "en";
  onClose: () => void;
  schoolNames: Record<string, string>;
}

const COURSE_INFO: Record<string, Partial<{
  type: string;
  description: string;
  topics: string[];
  background: string;
  format: string;
  technologies: string[];
}>> = {
  "Dynamics": {
    type: "核心课",
    description: "研究机械系统的运动学和动力学原理，包括刚体运动、约束系统、碰撞与冲击等。",
    topics: ["刚体运动学", "拉格朗日力学", "哈密顿原理", "多体动力学"],
    background: "建议修过基础力学和微积分",
    format: "理论",
  },
  "Control Systems": {
    type: "核心课",
    description: "学习反馈控制理论，包括状态空间方法、稳定性分析、控制器设计等。",
    topics: ["状态空间模型", "稳定性理论", "最优控制", "鲁棒控制"],
    background: "建议修过线性代数和微分方程",
    format: "理论",
    technologies: ["MATLAB", "Simulink"],
  },
  "Robotics": {
    type: "方向课",
    description: "涵盖机器人运动学、动力学、感知和控制，通常包含实践项目。",
    topics: ["机器人运动学", "轨迹规划", "机器视觉", "自主导航"],
    background: "建议修过控制理论和编程",
    format: "项目",
    technologies: ["ROS", "MATLAB"],
  },
  "Fluid Mechanics": {
    type: "核心课",
    description: "研究流体运动规律，包括粘性流动、边界层、湍流和计算流体力学。",
    topics: ["Navier-Stokes方程", "边界层理论", "湍流建模", "CFD基础"],
    background: "建议修过连续介质力学",
    format: "理论",
    technologies: ["COMSOL", "ANSYS"],
  },
  "Heat Transfer": {
    type: "核心课",
    description: "学习热量传递的三种基本方式：传导、对流和辐射及其工程应用。",
    topics: ["导热方程", "对流换热", "辐射换热", "换热器设计"],
    background: "建议修过热力学",
    format: "理论",
  },
  "Energy Systems": {
    type: "方向课",
    description: "分析能源转换系统，包括传统能源和可再生能源技术。",
    topics: ["能源转换", "可再生能源", "储能技术", "能效分析"],
    background: "建议修过热力学和传热学",
    format: "综合",
  },
  "Machine Design": {
    type: "核心课",
    description: "学习机械系统的设计方法，包括材料选择、强度分析和制造工艺。",
    topics: ["机械设计原理", "材料力学", "公差分析", "CAD设计"],
    background: "建议修过材料力学",
    format: "设计",
    technologies: ["SolidWorks", "ANSYS"],
  },
  "Manufacturing": {
    type: "方向课",
    description: "介绍现代制造技术，包括数控加工、3D打印和质量管理。",
    topics: ["数控加工", "增材制造", "精益生产", "质量控制"],
    background: "建议修过机械设计",
    format: "综合",
    technologies: ["CNC", "CAD/CAM"],
  },
  "Materials Science": {
    type: "方向课",
    description: "研究材料的结构、性能和应用，重点在工程材料。",
    topics: ["材料结构", "力学性能", "材料选择", "材料表征"],
    background: "建议修过物理和化学",
    format: "理论",
  },
  "Finite Elements": {
    type: "方向课",
    description: "学习有限元分析方法及其在工程问题中的应用。",
    topics: ["FEA原理", "单元类型", "网格划分", "结果分析"],
    background: "建议修过线性代数和编程",
    format: "综合",
    technologies: ["ANSYS", "ABAQUS"],
  },
};

export function CourseModal({ course, track, program, language, onClose, schoolNames }: CourseModalProps) {
  const info = COURSE_INFO[course] || {};
  const hasDetails = info.description || info.topics?.length;

  const t = {
    zh: {
      courseProfile: "课程介绍",
      courseType: "课程类型",
      mainTopics: "主要学习内容",
      recommendedBackground: "适合的基础背景",
      courseFormat: "课程性质",
      technologies: "涉及技术",
      onlyTitle: "当前仅确认课程名称与所属方向",
      noDescription: "暂未收录详细课程介绍",
      officialCatalog: "请以学校课程目录为准",
      belongsTo: "所属方向",
      program: "所属项目",
      creditsPrerequisite: "学分 / 先修课",
      viewOfficialPage: "查看官方课程页面",
      close: "关闭",
      core: "核心课",
      elective: "选修课",
      track: "方向课",
      theory: "理论",
      lab: "实验",
      design: "设计",
      project: "项目",
      unknown: "暂未确认",
    },
    en: {
      courseProfile: "Course Profile",
      courseType: "Course Type",
      mainTopics: "Main Topics",
      recommendedBackground: "Recommended Background",
      courseFormat: "Course Format",
      technologies: "Technologies",
      onlyTitle: "Only the course title and area are currently confirmed",
      noDescription: "Detailed course description not yet collected",
      officialCatalog: "Please refer to the official university course catalog",
      belongsTo: "Track",
      program: "Program",
      creditsPrerequisite: "Credits / Prerequisites",
      viewOfficialPage: "View official course page",
      close: "Close",
      core: "Core",
      elective: "Elective",
      track: "Track",
      theory: "Theory",
      lab: "Lab",
      design: "Design",
      project: "Project",
      unknown: "Not confirmed",
    },
  };

  const translateType = (type: string) => {
    if (type === "核心课") return t[language].core;
    if (type === "选修课") return t[language].elective;
    if (type === "方向课") return t[language].track;
    return type;
  };

  const translateFormat = (format: string) => {
    if (format === "理论") return t[language].theory;
    if (format === "实验") return t[language].lab;
    if (format === "设计") return t[language].design;
    if (format === "项目") return t[language].project;
    if (format === "综合") return "Combined";
    return t[language].unknown;
  };

  return (
    <div
      className="course-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <section
        className="course-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(680px, 100%)",
          maxHeight: "85vh",
          overflowY: "auto",
          background: "var(--surface)",
          borderRadius: "16px",
          border: "1px solid var(--hairline)",
          boxShadow: "0 28px 90px rgba(10,24,38,0.2)",
          padding: "24px",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label={t[language].close}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "none",
            background: "var(--surface-2)",
            color: "var(--text)",
            fontSize: "20px",
            fontWeight: 300,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            transition: "background .16s",
          }}
        >
          ×
        </button>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "13px", letterSpacing: "2px", color: "var(--subtle)", fontWeight: 500, marginBottom: "8px" }}>
            {t[language].courseProfile.toUpperCase()}
          </div>
          <h3 id="course-title" style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px", color: "var(--text)", fontFamily: "Georgia, 'Songti SC', serif" }}>
            {course}
          </h3>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "var(--subtle)", fontWeight: 500 }}>
              {schoolNames[program.school] || program.school}
            </span>
            <span style={{ color: "var(--hairline)" }}>·</span>
            <span style={{ fontSize: "14px", color: "var(--subtle)", fontWeight: 500 }}>{t[language].belongsTo}: {track}</span>
            {info.type && (
              <>
                <span style={{ color: "var(--hairline)" }}>·</span>
                <span style={{
                  padding: "4px 10px",
                  borderRadius: "999px",
                  background: info.type === "核心课" ? "#e5f5ea" : info.type === "方向课" ? "#e6f4ff" : "#f8f9fa",
                  color: info.type === "核心课" ? "#287044" : info.type === "方向课" ? "#1e5c8a" : "#6c757d",
                  fontSize: "13px",
                  fontWeight: 600,
                }}>
                  {translateType(info.type)}
                </span>
              </>
            )}
          </div>
        </div>

        {hasDetails ? (
          <>
            {info.description && (
              <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid var(--hairline)" }}>
                <h4 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 8px", color: "var(--text)" }}>
                  {language === "zh" ? "课程简介" : "Course Description"}
                </h4>
                <p style={{ fontSize: "16px", lineHeight: "1.6", margin: 0, color: "var(--text)", fontWeight: 400 }}>
                  {info.description}
                </p>
              </div>
            )}

            {info.topics && info.topics.length > 0 && (
              <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid var(--hairline)" }}>
                <h4 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 10px", color: "var(--text)" }}>
                  {t[language].mainTopics}
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {info.topics.map((topic, index) => (
                    <span
                      key={index}
                      style={{
                        padding: "6px 12px",
                        background: "var(--surface-2)",
                        borderRadius: "999px",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "var(--text)",
                      }}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {info.background && (
              <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid var(--hairline)" }}>
                <h4 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 8px", color: "var(--text)" }}>
                  {t[language].recommendedBackground}
                </h4>
                <p style={{ fontSize: "16px", lineHeight: "1.6", margin: 0, color: "var(--text)", fontWeight: 400 }}>
                  {info.background}
                </p>
              </div>
            )}

            {info.format && (
              <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid var(--hairline)" }}>
                <h4 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 8px", color: "var(--text)" }}>
                  {t[language].courseFormat}
                </h4>
                <span style={{
                  padding: "6px 14px",
                  background: "#e6f4ff",
                  borderRadius: "999px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1e5c8a",
                }}>
                  {translateFormat(info.format)}
                </span>
              </div>
            )}

            {info.technologies && info.technologies.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 10px", color: "var(--text)" }}>
                  {t[language].technologies}
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {info.technologies.map((tech, index) => (
                    <span
                      key={index}
                      style={{
                        padding: "6px 12px",
                        background: "#f0f7ff",
                        borderRadius: "999px",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#1e5c8a",
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: "20px", background: "var(--surface-2)", borderRadius: "12px", marginBottom: "20px" }}>
            <p style={{ fontSize: "15px", lineHeight: "1.6", margin: "0 0 8px", color: "var(--subtle)", fontWeight: 500 }}>
              {t[language].onlyTitle}
            </p>
            <p style={{ fontSize: "15px", lineHeight: "1.6", margin: "0 0 8px", color: "var(--subtle)", fontWeight: 500 }}>
              {t[language].noDescription}
            </p>
            <p style={{ fontSize: "15px", lineHeight: "1.6", margin: 0, color: "var(--subtle)", fontWeight: 500 }}>
              {t[language].officialCatalog}
            </p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px", border: "1px solid var(--hairline)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderRight: "1px solid var(--hairline)" }}>
            <span style={{ display: "block", fontSize: "13px", color: "var(--subtle)", fontWeight: 500, marginBottom: "6px" }}>
              {t[language].program}
            </span>
            <b style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>
              {program.degree} · {program.program}
            </b>
          </div>
          <div style={{ padding: "14px 16px" }}>
            <span style={{ display: "block", fontSize: "13px", color: "var(--subtle)", fontWeight: 500, marginBottom: "6px" }}>
              {t[language].creditsPrerequisite}
            </span>
            <b style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>
              {t[language].officialCatalog}
            </b>
          </div>
        </div>

        <a
          href={program.curriculumUrl || program.programUrl || program.source}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            textAlign: "center",
            padding: "12px",
            background: "var(--accent)",
            color: "#fff",
            borderRadius: "10px",
            textDecoration: "none",
            fontSize: "15px",
            fontWeight: 600,
          }}
        >
          {t[language].viewOfficialPage} ↗
        </a>

        <p style={{ fontSize: "13px", color: "var(--subtle)", textAlign: "center", marginTop: "16px", fontWeight: 500 }}>
          {language === "zh" ? "中文内容为便于选校的概括，不替代官网原始课程说明。" : "Chinese content is for reference only; official university course catalog takes precedence."}
        </p>
      </section>
    </div>
  );
}