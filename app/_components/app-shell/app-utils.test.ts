import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDeadlineLong, formatDeadlineShort, sprintColor, statusTagClass } from "./app-utils.js";

describe("app shell utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps related statuses to stable tag classes", () => {
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("paused")).toBe("app-tag status default");
  });

  it("formats short deadlines at closed, hourly, and daily boundaries", () => {
    expect(formatDeadlineShort("2026-05-01T11:59:59.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-05-02T11:59:00.000Z")).toBe("23h");
    expect(formatDeadlineShort("2026-05-03T12:00:00.000Z")).toBe("2d");
  });

  it("formats long deadlines with minutes under 72 hours and dates after that", () => {
    expect(formatDeadlineLong("2026-05-01T12:00:00.000Z")).toBe("Closed");
    expect(formatDeadlineLong("2026-05-01T14:45:00.000Z")).toBe("2h 45m");
    expect(formatDeadlineLong("2026-05-05T12:00:00.000Z")).toContain("May");
  });

  it("cycles sprint colors and falls back for negative indices", () => {
    expect(sprintColor(0)).toBe("#ffd11a");
    expect(sprintColor(4)).toBe("#ffd11a");
    expect(sprintColor(5)).toBe("#2f6bff");
    expect(sprintColor(-1)).toBe("#ffd11a");
  });
});
