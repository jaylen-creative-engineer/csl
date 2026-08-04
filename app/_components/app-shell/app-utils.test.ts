import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatDeadlineLong,
  formatDeadlineShort,
  sprintColor,
  statusTagClass,
} from "./app-utils.js";

describe("app shell utilities", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps active, judging, and terminal statuses to stable tag classes", () => {
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("closed")).toBe("app-tag status closed");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("archived")).toBe("app-tag status default");
  });

  it("formats short deadlines as closed, hours under 48, and days at the 48h boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T12:00:00.000Z"));

    expect(formatDeadlineShort("2026-05-01T11:59:59.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-05-03T11:59:59.000Z")).toBe("47h");
    expect(formatDeadlineShort("2026-05-03T12:00:00.000Z")).toBe("2d");
    expect(formatDeadlineShort("2026-05-03T13:00:00.000Z")).toBe("3d");
  });

  it("formats long deadlines with hours and minutes until the 72h cutoff", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T12:00:00.000Z"));

    expect(formatDeadlineLong("2026-05-01T12:00:00.000Z")).toBe("Closed");
    expect(formatDeadlineLong("2026-05-04T11:15:00.000Z")).toBe("71h 15m");
  });

  it("cycles sprint accent colors predictably", () => {
    expect([0, 1, 2, 3, 4].map((index) => sprintColor(index))).toEqual([
      "#ffd11a",
      "#2f6bff",
      "#ff3b2f",
      "#f4f3ef",
      "#ffd11a",
    ]);
  });
});
