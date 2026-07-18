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
  it("maps known lifecycle statuses to stable tag classes", () => {
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
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    expect(formatDeadlineShort("2025-12-31T23:59:00.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-01-01T05:30:00.000Z")).toBe("5h");
    expect(formatDeadlineShort("2026-01-03T01:00:00.000Z")).toBe("3d");
  });

  it("formats long deadlines with minutes for near-term deadlines", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    expect(formatDeadlineLong("2026-01-01T05:30:00.000Z")).toBe("5h 30m");
    expect(formatDeadlineLong("2025-12-31T23:59:00.000Z")).toBe("Closed");
  });

  it("cycles sprint colors and falls back for negative indexes", () => {
    expect(sprintColor(0)).toBe("#ffd11a");
    expect(sprintColor(4)).toBe("#ffd11a");
    expect(sprintColor(-1)).toBe("#ffd11a");
  });
});
