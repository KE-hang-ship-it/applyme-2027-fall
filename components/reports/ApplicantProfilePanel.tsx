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

export function ApplicantProfilePanel({ language, value, onChange }: Props) {
  const zh = language === "zh";
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const education = getEducationExperiences(value);
  const completion = assessProfileCompleteness(value);
  const research = value.researchExperience?.[0]?.description ?? "";
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
    educationExperience: zh ? "本科院校" : "undergraduate school",
    gpa: "GPA",
    undergraduateMajor: zh ? "本科专业" : "undergraduate major",
    languageScore: zh ? "语言成绩" : "language result",
    targetMajor: zh ? "目标专业" : "target major",
    targetDegree: zh ? "目标学位" : "target degree",
    targetAreas: zh ? "目标方向" : "target area",
  };

  return (
    <details className="report-profile-panel">
      <summary>
        <span>{zh ? "申请者画像" : "Applicant profile"}</span>
        <small>
          {zh ? `画像完整度：${completion.completionRate}%` : `Profile completeness: ${completion.completionRate}%`}
          {!completion.complete && ` · ${zh ? "还需补充" : "Complete"}：${completion.missingFields.map(field => missingLabels[field] ?? field).join(zh ? "、" : ", ")}`}
        </small>
      </summary>

      <section className="profile-section">
        <header>
          <div><b>{zh ? "1. 教育背景" : "1. Education"}</b><span>{zh ? "2+2 或转学经历请分开填写" : "List 2+2 or transfer schools separately"}</span></div>
          <label className="compact-field">
            {zh ? "学位模式" : "Degree mode"}
            <select value={value.degreeMode ?? "undecided"} onChange={event => set({ degreeMode: event.target.value as UserProfile["degreeMode"] })}>
              <option value="single">{zh ? "单学位" : "Single degree"}</option>
              <option value="dual">{zh ? "双学位" : "Dual degree"}</option>
              <option value="joint">{zh ? "联合学位" : "Joint degree"}</option>
              <option value="undecided">{zh ? "尚未确定" : "Undecided"}</option>
            </select>
          </label>
        </header>

        <div className="education-list">
          {education.map((item, index) => {
            const scale = item.gpa?.scale ?? 4;
            const scalePreset = GPA_SCALES.includes(scale as (typeof GPA_SCALES)[number]) ? String(scale) : "other";
            return (
              <article className="education-card" key={item.id}>
                <div className="education-card-title">
                  <b>{zh ? `本科经历 ${index + 1}` : `Education ${index + 1}`}</b>
                  {education.length > 1 && (
                    <button type="button" onClick={() => saveEducation(education.filter(entry => entry.id !== item.id))}>
                      {zh ? "删除" : "Remove"}
                    </button>
                  )}
                </div>
                <div className="profile-field-grid">
                  <label>{zh ? "学校名称" : "School"}<input value={item.school} onChange={event => updateEducation(item.id, { school: event.target.value })} /></label>
                  <label>{zh ? "国家或地区" : "Country or region"}<input value={item.countryOrRegion ?? ""} onChange={event => updateEducation(item.id, { countryOrRegion: event.target.value })} /></label>
                  <label>{zh ? "本科专业" : "Major"}<input value={item.major ?? ""} onChange={event => updateEducation(item.id, { major: event.target.value })} /></label>
                  <label>
                    {zh ? "就读类型" : "Study type"}
                    <select value={item.studyType ?? "standard"} onChange={event => updateEducation(item.id, { studyType: event.target.value as EducationStudyType })}>
                      {studyTypes.map(([id, cn, en]) => <option value={id} key={id}>{zh ? cn : en}</option>)}
                    </select>
                  </label>
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
                <div className="profile-checks">
                  <label><input type="checkbox" checked={Boolean(item.awardsDegree)} onChange={event => updateEducation(item.id, { awardsDegree: event.target.checked })} />{zh ? "该校授予学位" : "Degree awarded by this school"}</label>
                  <label><input type="checkbox" checked={Boolean(item.finalGraduationSchool)} onChange={event => saveEducation(education.map(entry => ({ ...entry, finalGraduationSchool: entry.id === item.id ? event.target.checked : false })))} />{zh ? "最终毕业院校" : "Final graduating school"}</label>
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
      </section>

      <section className="profile-section">
        <header><div><b>{zh ? "2. 标化成绩" : "2. Test scores"}</b><span>{zh ? "尚未考试也可以明确标记" : "You can explicitly mark a test as not taken"}</span></div></header>
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
              <option value="0-120">{zh ? "0–120 分制" : "0–120 scale"}</option>
              <option value="1-6">{zh ? "1–6 分制（2026-01-21 起）" : "1–6 scale (from Jan 21, 2026)"}</option>
              <option value="not-taken">{zh ? "尚未考试" : "Not taken"}</option>
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
          <label>{zh ? "GRE Quantitative" : "GRE Quantitative"}{numericInput("gre-quant", value.gre?.quantitative, { min: 130, max: 170, onValid: number => set({ gre: { ...value.gre, quantitative: number } }) })}</label>
        </div>
      </section>

      <section className="profile-section">
        <header><div><b>{zh ? "3. 经历背景" : "3. Experience"}</b><span>{zh ? "简要说明即可" : "A concise summary is enough"}</span></div></header>
        <div className="profile-field-grid">
          <label className="wide">{zh ? "科研 / 项目经历" : "Research / project experience"}<textarea value={research} onChange={event => set({ researchExperience: textExperience(event.target.value, "Research / project experience") })} /></label>
          <label className="wide">{zh ? "实习 / 工作经历" : "Internship / work experience"}<textarea value={internship} onChange={event => { const items = textExperience(event.target.value, "Internship / work experience"); set({ internshipExperience: items, workExperience: items }); }} /></label>
        </div>
      </section>

      <section className="profile-section">
        <header><div><b>{zh ? "4. 申请偏好" : "4. Application preferences"}</b></div></header>
        <div className="profile-field-grid">
          <label>{zh ? "目标专业" : "Target major"}<input value={value.targetMajor.join(", ")} onChange={event => set({ targetMajor: event.target.value.split(",").map(item => item.trim()).filter(Boolean) })} /></label>
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
          <label>{zh ? "地区偏好" : "Target regions"}<input value={value.targetRegions?.join(", ") ?? ""} onChange={event => set({ targetRegions: event.target.value.split(",").map(item => item.trim()).filter(Boolean) as UserProfile["targetRegions"] })} /></label>
          <label>{zh ? "预算总额" : "Total budget"}{numericInput("budget", value.budget?.amount, { min: 0, max: 100000000, onValid: number => set({ budget: { amount: number, currency: value.budget?.currency ?? "USD", period: "program", includesLivingCost: true } }) })}</label>
          <label>{zh ? "预算币种" : "Currency"}<select value={value.budget?.currency ?? "USD"} onChange={event => set({ budget: { amount: value.budget?.amount ?? null, currency: event.target.value as NonNullable<UserProfile["budget"]>["currency"], period: "program", includesLivingCost: true } })}><option>USD</option><option>CAD</option><option>GBP</option><option>HKD</option><option>AUD</option><option>CNY</option></select></label>
          <label>
            {zh ? "申请目标" : "Application goal"}
            <select value={value.careerGoal ?? ""} onChange={event => set({ careerGoal: event.target.value })}>
              <option value="">{zh ? "请选择" : "Select"}</option>
              <option value="employment">{zh ? "就业" : "Employment"}</option>
              <option value="phd">{zh ? "读博" : "PhD preparation"}</option>
              <option value="undecided">{zh ? "尚未确定" : "Undecided"}</option>
            </select>
          </label>
          <fieldset className="target-area-field wide">
            <legend>{zh ? "目标方向（可多选）" : "Target areas (multiple)"}</legend>
            <div className="profile-checks">
              {targetAreas.map(([id, cn]) => (
                <label key={id}>
                  <input
                    type="checkbox"
                    checked={value.targetAreas?.includes(id) ?? false}
                    onChange={event => set({
                      targetAreas: event.target.checked
                        ? [...(value.targetAreas ?? []).filter(item => item !== id), id]
                        : (value.targetAreas ?? []).filter(item => item !== id),
                    })}
                  />
                  {zh ? cn : id}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <p className="report-profile-note">
        {zh
          ? "系统分类是基于已核实要求与画像匹配的参考判断，不代表录取概率；用户手动分类始终保留。"
          : "System categories are explainable references, not admission probabilities; manual categories are always preserved."}
      </p>
    </details>
  );
}
