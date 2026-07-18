type CompareButtonProps = {
  selected: boolean;
  language: "zh" | "en";
  onToggle: () => void;
  compact?: boolean;
};

export function CompareButton({ selected, language, onToggle, compact = false }: CompareButtonProps) {
  const label = language === "en" ? (selected ? "Added" : "Compare") : (selected ? "已加入" : "加入对比");
  return (
    <button
      type="button"
      className={`compare-button ${selected ? "is-selected" : ""} ${compact ? "is-compact" : ""}`}
      aria-pressed={selected}
      aria-label={label}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      <span aria-hidden="true">{selected ? "✓" : "⇄"}</span>{label}
    </button>
  );
}
