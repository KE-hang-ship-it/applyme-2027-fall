type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <section className="premium-empty" role="status" aria-live="polite">
      <span className="empty-state-mark" aria-hidden="true">✦</span>
      <b>{title}</b>
      <p>{description}</p>
      {actionLabel && onAction ? <button onClick={onAction}>{actionLabel}</button> : null}
    </section>
  );
}
