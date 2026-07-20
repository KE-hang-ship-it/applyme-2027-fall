import { useState, useCallback } from "react";
import { SchoolLogo } from "@/components/SchoolLogo";
import type { Program, SchoolListItem, SchoolListCategory } from "@/types/application";

type SchoolListCardProps = {
  program: Program;
  item: SchoolListItem;
  en: boolean;
  onViewDetail: (program: Program) => void;
  onUpdateCategory: (programId: string, category: SchoolListCategory) => void;
  onUpdateNote: (programId: string, note: string) => void;
  onRemove: (programId: string) => void;
};

export function SchoolListCard({
  program,
  item,
  en,
  onViewDetail,
  onUpdateCategory,
  onUpdateNote,
  onRemove,
}: SchoolListCardProps) {
  const [localNote, setLocalNote] = useState(item.note);
  const [isSaving, setIsSaving] = useState(false);

  const handleBlur = useCallback(() => {
    if (localNote !== item.note) {
      setIsSaving(true);
      onUpdateNote(program.id, localNote);
      setTimeout(() => setIsSaving(false), 800);
    }
  }, [localNote, item.note, program.id, onUpdateNote]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleBlur();
    }
  }, [handleBlur]);

  const categoryOptions: { value: SchoolListCategory; label: string }[] = [
    { value: "reach", label: en ? "Reach" : "冲刺" },
    { value: "match", label: en ? "Match" : "匹配" },
    { value: "safety", label: en ? "Safety" : "保底" },
    { value: "unclassified", label: en ? "Unclassified" : "未分类" },
  ];

  return (
    <article className={`school-list-card school-list-card-${item.category}`}>
      <div className="school-list-card-color-bar"></div>
      <div className="school-list-card-content">
        <div className="school-list-card-header" onClick={() => onViewDetail(program)}>
          <SchoolLogo program={program} size="small" />
          <div className="school-list-card-info">
            <b className="school-list-card-school">{program.school}</b>
            <span className="school-list-card-program">{program.program} · {program.degree}</span>
            <small className="school-list-card-location">{program.city}, {program.state}</small>
          </div>
        </div>

        <div className="school-list-card-rankings">
          {program.nationalUniversityRanking && (
            <span className="school-list-card-ranking">
              {en ? "National" : "综合"} #{program.nationalUniversityRanking.rank}
            </span>
          )}
          {program.mechanicalEngineeringRanking && (
            <span className="school-list-card-ranking">
              {en ? "ME" : "ME"} #{program.mechanicalEngineeringRanking.rank}
            </span>
          )}
        </div>

        <div className="school-list-card-category-select">
          <select
            value={item.category}
            onChange={(e) => onUpdateCategory(program.id, e.target.value as SchoolListCategory)}
            className="school-list-category-dropdown"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="school-list-card-note">
          <textarea
            value={localNote}
            onChange={(e) => setLocalNote(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={en ? "Add a personal note..." : "添加个人备注..."}
            className="school-list-note-input"
            rows={3}
          />
          {isSaving && <span className="school-list-note-saved">{en ? "Saved" : "已保存"}</span>}
        </div>

        <div className="school-list-card-actions">
          <button className="school-list-action-detail" onClick={() => onViewDetail(program)}>
            {en ? "View Details" : "查看详情"}
          </button>
          <button className="school-list-action-remove" onClick={() => onRemove(program.id)}>
            {en ? "Remove" : "移出选校名单"}
          </button>
        </div>
      </div>
    </article>
  );
}