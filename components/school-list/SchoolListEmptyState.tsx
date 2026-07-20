type SchoolListEmptyStateProps = {
  en: boolean;
  onBrowsePrograms: () => void;
  onViewFavorites: () => void;
};

export function SchoolListEmptyState({ en, onBrowsePrograms, onViewFavorites }: SchoolListEmptyStateProps) {
  return (
    <div className="school-list-empty-state">
      <span className="school-list-empty-icon" aria-hidden="true">📋</span>
      <h3 className="school-list-empty-title">
        {en ? "Your school list is empty" : "你的选校名单还是空的"}
      </h3>
      <p className="school-list-empty-description">
        {en
          ? "Add shortlisted programs here to organize reach, match, and safety options."
          : "将筛选后的项目加入这里，开始整理冲刺、匹配和保底方案。"}
      </p>
      <div className="school-list-empty-actions">
        <button className="school-list-empty-action-primary" onClick={onBrowsePrograms}>
          {en ? "Add Programs" : "去项目库添加项目"}
        </button>
        <button className="school-list-empty-action-secondary" onClick={onViewFavorites}>
          {en ? "View Favorites" : "查看收藏"}
        </button>
      </div>
      <p className="school-list-empty-hint">
        {en ? "Start from your favorites, then add shortlisted programs to your school list." : "建议先从收藏中挑选，再加入选校名单。"}
      </p>
    </div>
  );
}