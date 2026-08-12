import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDeadlineLong,
  formatDeadlineShort,
  sprintColor,
  statusTagClass,
} from "./app-utils.js";

describe("app shell helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps known statuses to stable tag classes and defaults unknown values", () => {
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("closed")).toBe("app-tag status closed");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("OPEN")).toBe("app-tag status default");
    expect(statusTagClass("paused")).toBe("app-tag status default");
  });

  it("formats short deadline states at closed, hourly, and daily boundaries", () => {
    expect(formatDeadlineShort("2026-08-12T09:59:59.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-08-12T10:00:00.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-08-14T09:59:59.000Z")).toBe("47h");
    expect(formatDeadlineShort("2026-08-14T10:00:00.000Z")).toBe("2d");
    expect(formatDeadlineShort("2026-08-14T11:00:00.000Z")).toBe("3d");
  });

  it("formats long deadline states before falling back to a calendar date", () => {
    expect(formatDeadlineLong("2026-08-12T09:59:59.000Z")).toBe("Closed");
    expect(formatDeadlineLong("2026-08-12T11:30:00.000Z")).toBe("1h 30m");
    expect(formatDeadlineLong("2026-08-15T09:59:59.000Z")).toBe("71h 59m");
    expect(formatDeadlineLong("2026-08-15T10:00:00.000Z")).toMatch(/Aug 15/);
  });

  it("cycles sprint colors through the dashboard palette", () => {
    expect([0, 1, 2, 3, 4, 5].map((index) => sprintColor(index))).toEqual([
      "#ffd11a",
      "#2f6bff",
      "#ff3b2f",
      "#f4f3ef",
      "#ffd11a",
      "#2f6bff",
    ]);
  });
});
