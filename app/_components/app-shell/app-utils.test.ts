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
  it("maps domain statuses to the correct dashboard tag classes", () => {
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("unknown")).toBe("app-tag status default");
  });

  it("formats short deadlines as closed, hours, or rounded-up days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-16T10:00:00.000Z"));

    expect(formatDeadlineShort("2026-07-16T09:59:00.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-07-17T09:30:00.000Z")).toBe("23h");
    expect(formatDeadlineShort("2026-07-18T11:00:00.000Z")).toBe("3d");
  });

  it("formats long deadlines with minutes until the three-day boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-16T10:00:00.000Z"));

    expect(formatDeadlineLong("2026-07-16T09:59:00.000Z")).toBe("Closed");
    expect(formatDeadlineLong("2026-07-19T09:59:00.000Z")).toBe("71h 59m");
    expect(formatDeadlineLong("2026-07-19T10:00:00.000Z")).not.toMatch(/^\d+h \d+m$/);
  });

  it("cycles sprint colors and falls back for negative indexes", () => {
    expect(sprintColor(0)).toBe("#ffd11a");
    expect(sprintColor(4)).toBe("#ffd11a");
    expect(sprintColor(5)).toBe("#2f6bff");
    expect(sprintColor(-1)).toBe("#ffd11a");
  });
});
