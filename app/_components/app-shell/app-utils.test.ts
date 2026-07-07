import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatDeadlineLong,
  formatDeadlineShort,
  sprintColor,
  statusTagClass,
} from "./app-utils.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("app shell utilities", () => {
  it("maps active, draft, and completed status aliases to stable tag classes", () => {
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("paused")).toBe("app-tag status default");
  });

  it("formats short deadlines across closed, hourly, and day thresholds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-07T10:00:00.000Z"));

    expect(formatDeadlineShort("2026-07-07T09:59:59.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-07-08T09:00:00.000Z")).toBe("23h");
    expect(formatDeadlineShort("2026-07-09T10:00:00.000Z")).toBe("2d");
    expect(formatDeadlineShort("2026-07-09T11:00:00.000Z")).toBe("3d");
  });

  it("formats long deadlines as hours and minutes before the three-day cutoff", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-07T10:00:00.000Z"));

    expect(formatDeadlineLong("2026-07-07T15:30:00.000Z")).toBe("5h 30m");
    expect(formatDeadlineLong("2026-07-07T09:59:59.000Z")).toBe("Closed");
  });

  it("cycles sprint colors and falls back for unsupported negative indexes", () => {
    expect(sprintColor(0)).toBe("#ffd11a");
    expect(sprintColor(1)).toBe("#2f6bff");
    expect(sprintColor(4)).toBe("#ffd11a");
    expect(sprintColor(-1)).toBe("#ffd11a");
  });
});
