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

  it("maps known workflow statuses to stable tag classes", () => {
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("closed")).toBe("app-tag status closed");
    expect(statusTagClass("archived")).toBe("app-tag status default");
  });

  it("formats short deadlines as closed, hours, or rounded-up days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T12:00:00.000Z"));

    expect(formatDeadlineShort("2030-01-01T11:59:00.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2030-01-03T11:30:00.000Z")).toBe("47h");
    expect(formatDeadlineShort("2030-01-03T14:01:00.000Z")).toBe("3d");
  });

  it("formats long deadlines with minutes for urgent work and a date for later work", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T12:00:00.000Z"));

    expect(formatDeadlineLong("2030-01-01T14:45:00.000Z")).toBe("2h 45m");
    expect(formatDeadlineLong("2030-01-05T12:00:00.000Z")).toBe(
      new Date("2030-01-05T12:00:00.000Z").toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    );
  });

  it("cycles sprint accent colors and falls back for invalid negative indexes", () => {
    expect(sprintColor(0)).toBe("#ffd11a");
    expect(sprintColor(1)).toBe("#2f6bff");
    expect(sprintColor(4)).toBe("#ffd11a");
    expect(sprintColor(-1)).toBe("#ffd11a");
  });
});
