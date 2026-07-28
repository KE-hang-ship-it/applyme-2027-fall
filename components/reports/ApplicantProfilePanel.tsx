"use client";

import type { UserProfile } from "@/types/application";

type Props = { language: "zh" | "en"; value: UserProfile; onChange: (value: UserProfile) => void };
const numberValue = (value: number | null | undefined) => typeof value === "number" ? String(value) : "";
const experience = (value: string, title: string) => value.trim() ? [{ title, description: value.trim() }] : [];

export function ApplicantProfilePanel({ language, value, onChange }: Props) {
  const zh = language === "zh";
  const set = (patch: Partial<UserProfile>) => onChange({ ...value, ...patch, updatedAt: new Date().toISOString() });
  const research = value.researchExperience?.[0]?.description ?? "";
  const internship = value.internshipExperience?.[0]?.description ?? "";
  return (
    <details className="report-profile-panel">
      <summary><span>{zh ? "申请者画像（用于冲刺 / 匹配 / 保底参考）" : "Applicant profile (for Reach / Match / Safety guidance)"}</span><small>{zh ? "不完整时自动生成候选项目清单" : "Incomplete profiles generate a candidate list"}</small></summary>
      <div className="report-profile-grid">
        <label>{zh ? "本科院校" : "Undergraduate school"}<input value={value.undergraduateSchool ?? ""} onChange={e => set({ undergraduateSchool: e.target.value })}/></label>
        <label>{zh ? "本科专业" : "Undergraduate major"}<input value={value.undergraduateMajor ?? ""} onChange={e => set({ undergraduateMajor: e.target.value })}/></label>
        <label>GPA<input inputMode="decimal" value={numberValue(value.gpa?.value)} onChange={e => set({ gpa: { value: e.target.value ? Number(e.target.value) : null, scale: value.gpa?.scale ?? 4 } })}/></label>
        <label>{zh ? "GPA 满分" : "GPA scale"}<input inputMode="decimal" value={numberValue(value.gpa?.scale)} onChange={e => set({ gpa: { value: value.gpa?.value ?? null, scale: e.target.value ? Number(e.target.value) : null } })}/></label>
        <label>TOEFL<input inputMode="numeric" value={numberValue(value.toefl?.score)} onChange={e => set({ toefl: { score: e.target.value ? Number(e.target.value) : null } })}/></label>
        <label>IELTS<input inputMode="decimal" value={numberValue(value.ielts?.score)} onChange={e => set({ ielts: { score: e.target.value ? Number(e.target.value) : null } })}/></label>
        <label>{zh ? "GRE 总分" : "GRE total"}<input inputMode="numeric" value={numberValue(value.gre?.total)} onChange={e => set({ gre: { ...value.gre, total: e.target.value ? Number(e.target.value) : null } })}/></label>
        <label>{zh ? "预算总额" : "Total budget"}<input inputMode="numeric" value={numberValue(value.budget?.amount)} onChange={e => set({ budget: { amount: e.target.value ? Number(e.target.value) : null, currency: value.budget?.currency ?? "USD", period: "program", includesLivingCost: true } })}/></label>
        <label>{zh ? "预算币种" : "Currency"}<select value={value.budget?.currency ?? "USD"} onChange={e => set({ budget: { amount: value.budget?.amount ?? null, currency: e.target.value as NonNullable<UserProfile["budget"]>["currency"], period: "program", includesLivingCost: true } })}><option>USD</option><option>CAD</option><option>GBP</option><option>HKD</option><option>AUD</option><option>CNY</option></select></label>
        <label>{zh ? "目标专业" : "Target major"}<input value={value.targetMajor.join(", ")} onChange={e => set({ targetMajor: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })}/></label>
        <label>{zh ? "目标学位" : "Target degree"}<input value={value.targetDegree.join(", ")} onChange={e => set({ targetDegree: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })}/></label>
        <label>{zh ? "地区偏好" : "Target regions"}<input value={value.targetRegions?.join(", ") ?? ""} onChange={e => set({ targetRegions: e.target.value.split(",").map(v => v.trim()).filter(Boolean) as UserProfile["targetRegions"] })}/></label>
        <label className="wide">{zh ? "科研经历（简述）" : "Research experience"}<textarea value={research} onChange={e => set({ researchExperience: experience(e.target.value, "Research experience") })}/></label>
        <label className="wide">{zh ? "实习 / 工作经历（简述）" : "Internship / work experience"}<textarea value={internship} onChange={e => { const items=experience(e.target.value, "Internship experience"); set({ internshipExperience: items, workExperience: items }); }}/></label>
      </div>
      <p className="report-profile-note">{zh ? "分类是基于已核实硬性要求与画像匹配的参考判断，不代表录取概率。" : "Categories are explainable reference judgments, not admission probabilities."}</p>
    </details>
  );
}
