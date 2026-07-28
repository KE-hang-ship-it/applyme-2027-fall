"use client";

import { useState } from "react";

import {
  GPA_SCALES,
  getEducationExperiences,
  profileWithEducation,
  toeflScale,
} from "@/lib/applicant-profile";
import { assessProfileCompleteness } from "@/lib/report-data-quality";
import type {
  EducationExperience,
  EducationStudyType,
  TOEFLScoreScale,
  UserProfile,
} from "@/types/application";

type Props = { language: "zh" | "en"; value: UserProfile; onChange: (value: UserProfile) => void };

const numberValue = (value: number | null | undefined) => typeof value === "number" ? String(value) : "";
const textExperience = (value: string, title: string) => value.trim() ? [{ title, description: value.trim() }] : [];

const studyTypes: Array<[EducationStudyType, string, string]> = [
  ["standard", "普通本科", "Standard undergraduate"],
  ["2+2-first", "2+2 前半段", "2+2 first stage"],
  ["2+2-second", "2+2 后半段", "2+2 second stage"],
  ["pre-transfer", "转学前", "Before transfer"],
  ["post-transfer", "转学后", "After transfer"],
  ["joint", "联合培养", "Joint program"],
  ["dual-degree", "双学位", "Dual degree"],
  ["exchange", "交换经历", "Exchange"],
  ["other", "其他", "Other"],
];

const targetAreas = [
  ["Robotics", "机器人"],
  ["Controls", "控制"],
  ["Design", "设计"],
  ["Manufacturing", "制造"],
  ["Thermal fluids", "热流体"],
  ["Energy", "能源"],
  ["Materials", "材料"],
  ["Biomechanics", "生物机械"],
  ["Other", "其他"],
  ["Undecided", "尚未确定"],
] as const;

const regionOptions = [
  ["美国", "United States"],
  ["加拿大", "Canada"],
  ["香港", "Hong Kong"],
  ["新加坡", "Singapore"],
  ["英国", "United Kingdom"],
  ["欧洲", "Europe"],
  ["澳大利亚", "Australia"],
  ["其它", "Other"],
] as const;

const majorSuggestions = [
  ["机械工程", "Mechanical Engineering"],
  ["机器人", "Robotics"],
  ["机电一体化", "Mechatronics"],
  ["航空航天工程", "Aerospace Engineering"],
  ["制造工程", "Manufacturing Engineering"],
  ["材料工程", "Materials Engineering"],
] as const;

const budgetOptions = [
  ["", "请选择", "Select a budget"],
  ["200000", "20 万以内", "Up to CNY 200k"],
  ["350000", "20–35 万", "CNY 200k–350k"],
  ["500000", "35–50 万", "CNY 350k–500k"],
  ["500001", "50 万以上", "Above CNY 500k"],
  ["unlimited", "不限", "No limit"],
] as const;

const goalOptions = [
  ["employment", "就业", "Employment"],
  ["phd", "读博", "PhD"],
  ["research", "科研", "Research"],
  ["entrepreneurship", "创业", "Entrepreneurship"],
  ["undecided", "未确定", "Undecided"],
] as const;

export function ApplicantProfilePanel({ language, value, onChange }: Props) {
  const zh = language === "zh";
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [experienceEditors, setExperienceEditors] = useState<Record<string, boolean>>({});
  const education = getEducationExperiences(value);
  const completion = assessProfileCompleteness(value);
  const research = value.researchExperience?.[0]?.description ?? "";
  const project = value.projects?.[0]?.description ?? "";
  const internship = value.internshipExperience?.[0]?.description ?? "";

  const set = (patch: Partial<UserProfile>) =>
    onChange({ ...value, ...patch, updatedAt: new Date().toISOString() });

  const saveEducation = (items: EducationExperience[]) =>
    onChange({
      ...profileWithEducation(value, items),
      updatedAt: new Date().toISOString(),
    });

  const updateEducation = (id: string, patch: Partial<EducationExperience>) => {
    saveEducation(education.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  const commitNumber = (
    key: string,
    raw: string,
    options: { min: number; max: number; onValid: (number: number | null) => void },
  ) => {
    if (!raw.trim()) {
      options.onValid(null);
      setErrors(current => ({ ...current, [key]: "" }));
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < options.min || parsed > options.max) {
      setErrors(current => ({
        ...current,
        [key]: zh
          ? `请输入 ${options.min}–${options.max} 之间的数字`
          : `Enter a number from ${options.min} to ${options.max}`,
      }));
      return;
    }
    options.onValid(parsed);
    setErrors(current => ({ ...current, [key]: "" }));
    setDrafts(current => ({ ...current, [key]: String(parsed) }));
  };

  const numericInput = (
    key: string,
    stored: number | null | undefined,
    options: { min: number; max: number; step?: string; onValid: (number: number | null) => void },
  ) => (
    <>
      <input
        inputMode="decimal"
        value={drafts[key] ?? numberValue(stored)}
        onChange={event => {
          const raw = event.target.value;
          if (/^\d*(?:\.\d*)?$/.test(raw)) setDrafts(current => ({ ...current, [key]: raw }));
        }}
        onBlur={event => commitNumber(key, event.target.value, options)}
        aria-invalid={Boolean(errors[key])}
        step={options.step}
      />
      {errors[key] && <small className="field-error">{errors[key]}</small>}
    </>
  );

  const missingLabels: Record<string, string> = {
    educationExperience: zh ? "教育背景" : "Education",
    gpa: "GPA",
    undergraduateMajor: zh ? "本科专业" : "Undergraduate major",
    languageScore: zh ? "语言成绩" : "Language result",
    targetMajor: zh ? "目标专业" : "Target major",
    targetDegree: zh ? "目标学位" : "Target degree",
    targetAreas: zh ? "目标方向" : "Target area",
  };

  const checklist = [
    ["educationExperience", zh ? "教育背景" : "Education", Boolean(education.some(item => item.school.trim()))],
    ["gpa", "GPA", Boolean(education.some(item => item.gpa?.value != null && item.gpa?.scale != null))],
    ["undergraduateMajor", zh ? "本科专业" : "Undergraduate major", Boolean(education.some(item => item.major?.trim()))],
    ["languageScore", "TOEFL / IELTS", Boolean(value.toefl?.score != null || value.toefl?.scale === "not-taken" || value.ielts?.score != null)],
    ["targetMajor", zh ? "目标专业" : "Target major", Boolean(value.targetMajor?.length)],
    ["targetDegree", zh ? "目标学位" : "Target degree", Boolean(value.targetDegree?.length)],
    ["targetRegions", zh ? "地区偏好" : "Region preference", Boolean(value.targetRegions?.length)],
    ["budget", zh ? "预算" : "Budget", value.budget?.amount != null || value.budget?.note === "unlimited"],
  ] as const;

  const targetMajorValue = value.targetMajor?.[0] ?? "";
  const budgetValue = value.budget?.note === "unlimited"
    ? "unlimited"
    : budgetOptions.some(([id]) => id && Number(id) === value.budget?.amount)
      ? String(value.budget?.amount)
      : "";

  return (
    <details className="report-profile-panel profile-workspace" open>
      <summary className="profile-workspace-summary">
        <div>
          <span>{zh ? "申请者画像" : "Applicant profile"}</span>
          <p>{zh ? "完善申请画像后，可获得更准确的项目匹配建议。" : "Complete your profile for more accurate program matching guidance."}</p>
        </div>
        <span className="profile-summary-action">{zh ? "收起" : "Collapse"}</span>
      </summary>

      <div className="profile-progress-card">
        <div className="profile-progress-heading">
          <div>
            <b>{zh ? "申请画像完成度" : "Profile completeness"}</b>
            <strong>{completion.completionRate}%</strong>
          </div>
          <span>{zh ? "先完成带圆点的核心信息" : "Start with the core items below"}</span>
        </div>
        <div className="profile-progress-track" aria-label={`${completion.completionRate}%`}>
          <i style={{ width: `${completion.completionRate}%` }} />
        </div>
        <div className="profile-completion-checklist">
          {checklist.map(([id, label, done]) => (
            <span className={done ? "is-complete" : ""} key={id}>
              {done ? "✓" : "○"} {label}
            </span>
          ))}
        </div>
      </div>

      <details className="profile-section profile-section-primary" open>
        <summary className="profile-section-summary">
          <span><i>1</i><b>{zh ? "基础信息" : "Essentials"}</b></span>
          <small>{zh ? "建议先完成 · 约 1 分钟" : "Start here · about 1 minute"}</small>
        </summary>

        <div className="profile-section-body">
          <div className="profile-subsection-heading">
            <div><b>{zh ? "教育背景" : "Education"}</b><span>{zh ? "填写学校、专业与原始 GPA" : "School, major and original GPA"}</span></div>
          </div>
          <div className="education-list">
            {education.map((item, index) => {
              const scale = item.gpa?.scale ?? 4;
              const scalePreset = GPA_SCALES.includes(scale as (typeof GPA_SCALES)[number]) ? String(scale) : "other";
              return (
                <article className="education-card" key={item.id}>
                  <div className="education-card-title">
                    <b>{zh ? `本科经历 ${index + 1}` : `Education ${index + 1}`}</b>
                    {education.length > 1 && (
                      <button className="profile-remove-button" type="button" onClick={() => saveEducation(education.filter(entry => entry.id !== item.id))}>
                        {zh ? "删除" : "Remove"}
                      </button>
                    )}
                  </div>
                  <div className="profile-field-grid profile-field-grid-compact">
                    <label>{zh ? "学校名称" : "School"}<input value={item.school} onChange={event => updateEducation(item.id, { school: event.target.value })} /></label>
                    <label>{zh ? "本科专业" : "Major"}<input value={item.major ?? ""} onChange={event => updateEducation(item.id, { major: event.target.value })} /></label>
                    <label>
                      GPA
                      {numericInput(`gpa-${item.id}`, item.gpa?.value, {
                        min: 0,
                        max: scale,
                        onValid: number => updateEducation(item.id, { gpa: { ...item.gpa, value: number, scale } }),
                      })}
                    </label>
                    <label>
                      {zh ? "GPA 满分" : "GPA scale"}
                      <select
                        value={scalePreset}
                        onChange={event => {
                          const nextScale = event.target.value === "other" ? null : Number(event.target.value);
                          updateEducation(item.id, { gpa: { ...item.gpa, value: item.gpa?.value ?? null, scale: nextScale } });
                        }}
                      >
                        {GPA_SCALES.map(option => <option value={option} key={option}>{option === 4 ? "4.0" : option}</option>)}
                        <option value="other">{zh ? "其他" : "Other"}</option>
                      </select>
                      {scalePreset === "other" && numericInput(`scale-${item.id}`, item.gpa?.scale, {
                        min: 0.1,
                        max: 1000,
                        onValid: number => updateEducation(item.id, { gpa: { ...item.gpa, value: item.gpa?.value ?? null, scale: number } }),
                      })}
                    </label>
                  </div>
                </article>
              );
            })}
          </div>
          <button
            className="profile-add-button"
            type="button"
            onClick={() => saveEducation([...education, {
              id: `education-${Date.now()}`,
              school: "",
              studyType: "standard",
              gpa: { value: null, scale: 4 },
              awardsDegree: false,
              finalGraduationSchool: false,
            }])}
          >
            ＋ {zh ? "添加另一所本科院校" : "Add another undergraduate school"}
          </button>

          <div className="profile-subsection-heading">
            <div><b>{zh ? "标化成绩" : "Test scores"}</b><span>{zh ? "没有成绩时可直接选择“尚未考试”" : "Choose “Not taken” if you do not have a score"}</span></div>
          </div>
          <div className="profile-field-grid">
            <label>
              {zh ? "TOEFL 分制" : "TOEFL scale"}
              <select
                value={toeflScale(value)}
                onChange={event => {
                  const scale = event.target.value as TOEFLScoreScale;
                  set({ toefl: { ...value.toefl, score: scale === "not-taken" ? null : value.toefl?.score ?? null, scale } });
                }}
              >
                <option value="not-taken">{zh ? "尚未考试" : "Not taken"}</option>
                <option value="0-120">{zh ? "0–120 分制" : "0–120 scale"}</option>
                <option value="1-6">{zh ? "1–6 分制（2026-01-21 起）" : "1–6 scale (from Jan 21, 2026)"}</option>
              </select>
            </label>
            {toeflScale(value) !== "not-taken" && (
              <label>
                {toeflScale(value) === "1-6" ? "TOEFL iBT（1–6）" : "TOEFL iBT（0–120）"}
                {numericInput("toefl", value.toefl?.score, {
                  min: toeflScale(value) === "1-6" ? 1 : 0,
                  max: toeflScale(value) === "1-6" ? 6 : 120,
                  step: toeflScale(value) === "1-6" ? "0.5" : "1",
                  onValid: number => set({ toefl: { ...value.toefl, score: number, scale: toeflScale(value) } }),
                })}
              </label>
            )}
            <label>IELTS{numericInput("ielts", value.ielts?.score, { min: 0, max: 9, step: "0.5", onValid: number => set({ ielts: { ...value.ielts, score: number } }) })}</label>
            <label>{zh ? "GRE 总分" : "GRE total"}{numericInput("gre-total", value.gre?.total, { min: 260, max: 340, onValid: number => set({ gre: { ...value.gre, total: number } }) })}</label>
          </div>

          <div className="profile-subsection-heading">
            <div><b>{zh ? "申请目标" : "Application goals"}</b><span>{zh ? "这些信息会帮助缩小项目范围" : "These preferences narrow the program list"}</span></div>
          </div>
          <div className="profile-field-grid">
            <label>
              {zh ? "目标专业" : "Target major"}
              <input
                list="target-major-suggestions"
                value={targetMajorValue}
                placeholder={zh ? "搜索或输入专业" : "Search or enter a major"}
                onChange={event => set({ targetMajor: event.target.value ? [event.target.value] : [] })}
              />
              <datalist id="target-major-suggestions">
                {majorSuggestions.map(([cn, en]) => <option value={zh ? cn : en} key={en} />)}
              </datalist>
            </label>
            <label>
              {zh ? "目标学位" : "Target degree"}
              <select
                value={value.targetDegree.includes("MS") && value.targetDegree.includes("MEng") ? "both" : value.targetDegree[0] ?? ""}
                onChange={event => set({ targetDegree: event.target.value === "both" ? ["MS", "MEng"] : event.target.value ? [event.target.value] : [] })}
              >
                <option value="">{zh ? "请选择" : "Select"}</option>
                <option value="MS">MS</option>
                <option value="MEng">MEng</option>
                <option value="both">{zh ? "均可" : "Either"}</option>
              </select>
            </label>
            <label>
              {zh ? "预算" : "Budget"}
              <select
                value={budgetValue}
                onChange={event => {
                  const raw = event.target.value;
                  set({
                    budget: {
                      amount: raw && raw !== "unlimited" ? Number(raw) : null,
                      currency: "CNY",
                      period: "program",
                      includesLivingCost: true,
                      note: raw === "unlimited" ? "unlimited" : undefined,
                    },
                  });
                }}
              >
                {budgetOptions.map(([id, cn, en]) => <option value={id} key={id}>{zh ? cn : en}</option>)}
              </select>
            </label>
          </div>

          <fieldset className="profile-choice-field">
            <legend>{zh ? "地区偏好（可多选）" : "Region preference (multiple)"}</legend>
            <div className="profile-choice-chips">
              {regionOptions.map(([cn, en]) => {
                const active = value.targetRegions?.includes(cn as never) ?? false;
                return (
                  <label className={active ? "is-selected" : ""} key={cn}>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={event => set({
                        targetRegions: event.target.checked
                          ? [...(value.targetRegions ?? []), cn] as UserProfile["targetRegions"]
                          : (value.targetRegions ?? []).filter(item => item !== cn),
                      })}
                    />
                    {zh ? cn : en}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="profile-choice-field">
            <legend>{zh ? "申请目标" : "Application goal"}</legend>
            <div className="profile-choice-chips">
              {goalOptions.map(([id, cn, en]) => (
                <label className={value.careerGoal === id ? "is-selected" : ""} key={id}>
                  <input type="radio" name="career-goal" checked={value.careerGoal === id} onChange={() => set({ careerGoal: id })} />
                  {zh ? cn : en}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="profile-choice-field">
            <legend>{zh ? "目标方向（可多选）" : "Target areas (multiple)"}</legend>
            <div className="profile-choice-chips">
              {targetAreas.map(([id, cn]) => {
                const active = value.targetAreas?.includes(id) ?? false;
                return (
                  <label className={active ? "is-selected" : ""} key={id}>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={event => set({
                        targetAreas: event.target.checked
                          ? [...(value.targetAreas ?? []).filter(item => item !== id), id]
                          : (value.targetAreas ?? []).filter(item => item !== id),
                      })}
                    />
                    {zh ? cn : id}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>
      </details>

      <details className="profile-section profile-collapsible">
        <summary className="profile-section-summary">
          <span><i>2</i><b>{zh ? "提升推荐准确性" : "Improve matching accuracy"}</b></span>
          <small>{zh ? "可选 · 科研、项目与工作经历" : "Optional · research, projects and work"}</small>
        </summary>
        <div className="profile-section-body">
          <div className="profile-experience-actions">
            {[
              ["research", zh ? "科研经历" : "research experience", research],
              ["project", zh ? "项目经历" : "project experience", project],
              ["work", zh ? "工作经历" : "work experience", internship],
            ].map(([id, label, current]) => (
              <div className="profile-experience-item" key={id}>
                <button type="button" onClick={() => setExperienceEditors(state => ({ ...state, [id]: !state[id] }))}>
                  {current ? "✓" : "＋"} {current ? label : `${zh ? "添加" : "Add"} ${label}`}
                  <span>{experienceEditors[id] ? "−" : "＋"}</span>
                </button>
                {experienceEditors[id] && (
                  <textarea
                    value={current}
                    placeholder={zh ? "用几句话概括即可" : "A few concise sentences are enough"}
                    onChange={event => {
                      if (id === "research") set({ researchExperience: textExperience(event.target.value, "Research experience") });
                      if (id === "project") set({ projects: event.target.value.trim() ? [{ title: "Project experience", description: event.target.value.trim() }] : [] });
                      if (id === "work") {
                        const items = textExperience(event.target.value, "Internship / work experience");
                        set({ internshipExperience: items, workExperience: items });
                      }
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </details>

      <details className="profile-section profile-collapsible">
        <summary className="profile-section-summary">
          <span><i>3</i><b>{zh ? "特殊情况" : "Special circumstances"}</b></span>
          <small>{zh ? "可选 · 2+2、转学、双学位" : "Optional · 2+2, transfer or dual degree"}</small>
        </summary>
        <div className="profile-section-body">
          <div className="profile-field-grid">
            <label>
              {zh ? "学位模式" : "Degree mode"}
              <select value={value.degreeMode ?? "undecided"} onChange={event => set({ degreeMode: event.target.value as UserProfile["degreeMode"] })}>
                <option value="single">{zh ? "单学位" : "Single degree"}</option>
                <option value="dual">{zh ? "双学位" : "Dual degree"}</option>
                <option value="joint">{zh ? "联合学位" : "Joint degree"}</option>
                <option value="undecided">{zh ? "尚未确定" : "Undecided"}</option>
              </select>
            </label>
          </div>
          <div className="education-list profile-special-list">
            {education.map((item, index) => (
              <article className="education-card" key={item.id}>
                <div className="education-card-title">
                  <b>{item.school || (zh ? `本科经历 ${index + 1}` : `Education ${index + 1}`)}</b>
                </div>
                <div className="profile-field-grid">
                  <label>{zh ? "国家或地区" : "Country or region"}<input value={item.countryOrRegion ?? ""} onChange={event => updateEducation(item.id, { countryOrRegion: event.target.value })} /></label>
                  <label>
                    {zh ? "就读类型" : "Study type"}
                    <select value={item.studyType ?? "standard"} onChange={event => updateEducation(item.id, { studyType: event.target.value as EducationStudyType })}>
                      {studyTypes.map(([id, cn, en]) => <option value={id} key={id}>{zh ? cn : en}</option>)}
                    </select>
                  </label>
                </div>
                <div className="profile-checks">
                  <label><input type="checkbox" checked={Boolean(item.awardsDegree)} onChange={event => updateEducation(item.id, { awardsDegree: event.target.checked })} />{zh ? "该校授予学位" : "Degree awarded by this school"}</label>
                  <label><input type="checkbox" checked={Boolean(item.finalGraduationSchool)} onChange={event => saveEducation(education.map(entry => ({ ...entry, finalGraduationSchool: entry.id === item.id ? event.target.checked : false })))} />{zh ? "最终毕业院校" : "Final graduating school"}</label>
                </div>
              </article>
            ))}
          </div>
        </div>
      </details>

      <details className="profile-section profile-collapsible">
        <summary className="profile-section-summary">
          <span><i>4</i><b>{zh ? "其它补充" : "Additional information"}</b></span>
          <small>{zh ? "可选 · 以后也可以补充" : "Optional · add this later"}</small>
        </summary>
        <div className="profile-section-body">
          <label className="profile-additional-field">
            {zh ? "论文、竞赛、奖项或其它说明" : "Publications, competitions, awards or other notes"}
            <textarea value={value.additionalNotes ?? ""} onChange={event => set({ additionalNotes: event.target.value })} />
          </label>
        </div>
      </details>
    </details>
  );
}
