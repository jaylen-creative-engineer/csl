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
  it("maps workflow statuses to dashboard tag classes", () => {
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("closed")).toBe("app-tag status closed");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("unknown")).toBe("app-tag status default");
  });

  it("formats short deadlines around the closed, hourly, and daily thresholds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-09T10:00:00.000Z"));

    expect(formatDeadlineShort("2026-07-09T09:59:00.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-07-11T09:59:00.000Z")).toBe("47h");
    expect(formatDeadlineShort("2026-07-11T10:00:00.000Z")).toBe("2d");
    expect(formatDeadlineShort("2026-07-11T11:00:00.000Z")).toBe("3d");
  });

  it("formats long deadlines with minutes before falling back to a calendar date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-09T10:00:00.000Z"));

    expect(formatDeadlineLong("2026-07-09T14:15:00.000Z")).toBe("4h 15m");
    expect(formatDeadlineLong("2026-07-09T09:59:00.000Z")).toBe("Closed");
    expect(formatDeadlineLong("2026-07-12T10:00:00.000Z")).not.toContain("72h");
  });

  it("cycles sprint colors for compact dashboard lists", () => {
    expect(sprintColor(0)).toBe("#ffd11a");
    expect(sprintColor(1)).toBe("#2f6bff");
    expect(sprintColor(4)).toBe("#ffd11a");
  });
});
