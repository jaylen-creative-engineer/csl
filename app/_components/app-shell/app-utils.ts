export function statusTagClass(status: string): string {
  switch (status) {
    case "open":
    case "active":
      return "app-tag status open";
    case "judging":
      return "app-tag status judging";
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

const SPRINT_COLORS = ["#d8ff3d", "#8f7bff", "#ff6b6b", "#32ade6", "#ffc62b"];

export function sprintColor(index: number): string {
  return SPRINT_COLORS[index % SPRINT_COLORS.length] ?? "#d8ff3d";
}
