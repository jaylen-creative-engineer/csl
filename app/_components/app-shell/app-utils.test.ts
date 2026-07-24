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

describe("app shell utility formatting", () => {
  it("maps challenge and league statuses to stable tag classes", () => {
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("paused")).toBe("app-tag status default");
  });

  it("formats short deadlines as closed, hours, or rounded-up days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-24T10:00:00.000Z"));

    expect(formatDeadlineShort("2026-07-24T09:59:59.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-07-25T09:30:00.000Z")).toBe("23h");
    expect(formatDeadlineShort("2026-07-26T10:01:00.000Z")).toBe("2d");
  });

  it("formats long deadlines with minutes for near deadlines", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-24T10:00:00.000Z"));

    expect(formatDeadlineLong("2026-07-24T12:35:00.000Z")).toBe("2h 35m");
  });

  it("cycles sprint colors using the editorial palette with a safe fallback", () => {
    expect([0, 1, 2, 3, 4].map((index) => sprintColor(index))).toEqual([
      "#ffd11a",
      "#2f6bff",
      "#ff3b2f",
      "#f4f3ef",
      "#ffd11a",
    ]);
    expect(sprintColor(-1)).toBe("#ffd11a");
  });
});
