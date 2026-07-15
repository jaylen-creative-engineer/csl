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

  it("maps lifecycle statuses to dashboard tag classes", () => {
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("archived")).toBe("app-tag status default");
  });

  it("formats short deadlines as closed, hours, or days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T12:00:00.000Z"));

    expect(formatDeadlineShort("2026-04-18T11:59:59.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-04-19T23:30:00.000Z")).toBe("35h");
    expect(formatDeadlineShort("2026-04-21T12:00:00.000Z")).toBe("3d");
  });

  it("formats long deadlines with minutes for near deadlines and dates for later ones", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T12:00:00.000Z"));

    expect(formatDeadlineLong("2026-04-18T14:45:00.000Z")).toBe("2h 45m");
    expect(formatDeadlineLong("2026-04-22T12:00:00.000Z")).toMatch(/Apr 22|4\/22\/2026/);
  });

  it("cycles sprint colors and falls back for invalid indexes", () => {
    expect(sprintColor(0)).toBe("#ffd11a");
    expect(sprintColor(4)).toBe("#ffd11a");
    expect(sprintColor(-1)).toBe("#ffd11a");
  });
});
