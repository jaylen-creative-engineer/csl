export function statusTagClass(status: string): string {
  switch (status) {
    case "open":
    case "active":
      return "app-tag status open";
    case "judging":
    case "draft":
      return "app-tag status judging";
    case "closed":
    case "complete":
    case "completed":
      return "app-tag status closed";
    default:
      return "app-tag status default";
  }
}

export function formatDeadlineShort(deadline: string): string {
  const d = new Date(deadline);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  if (diffMs <= 0) return "Closed";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 48) return `${hours}h`;
  const days = Math.ceil(hours / 24);
  return `${days}d`;
}

export function formatDeadlineLong(deadline: string): string {
  const d = new Date(deadline);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  if (diffMs <= 0) return "Closed";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours < 72) return `${hours}h ${mins}m`;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/* Foreigner triad from the landing system, plus bone ink */
const SPRINT_COLORS = ["#ffd11a", "#2f6bff", "#ff3b2f", "#f4f3ef"];

export function sprintColor(index: number): string {
  return SPRINT_COLORS[index % SPRINT_COLORS.length] ?? "#ffd11a";
}
