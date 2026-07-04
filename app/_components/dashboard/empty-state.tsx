import Link from "next/link";

type EmptyStateProps = {
  fig: string;
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export function EmptyState({ fig, title, body, ctaHref, ctaLabel }: EmptyStateProps) {
  return (
    <div className="app-empty-state">
      <span className="app-empty-state-fig">{fig}</span>
      <h3>{title}</h3>
      <p>{body}</p>
      {ctaHref && ctaLabel && (
        <Link href={ctaHref} className="app-btn sm">
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
