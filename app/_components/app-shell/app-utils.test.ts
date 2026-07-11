import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDeadlineLong,
  formatDeadlineShort,
  sprintColor,
  statusTagClass,
} from "./app-utils.js";

describe("app shell utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-11T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("groups challenge statuses into stable app tag classes", () => {
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("closed")).toBe("app-tag status closed");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("archived")).toBe("app-tag status default");
  });

  it("formats short deadlines as closed, hours, or rounded-up days", () => {
    expect(formatDeadlineShort("2026-07-11T09:59:00.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-07-12T11:30:00.000Z")).toBe("25h");
    expect(formatDeadlineShort("2026-07-13T11:01:00.000Z")).toBe("3d");
  });

  it("formats long deadlines with minutes for near windows and calendar dates later", () => {
    expect(formatDeadlineLong("2026-07-11T12:45:00.000Z")).toBe("2h 45m");

    const later = "2026-07-15T12:45:00.000Z";
    expect(formatDeadlineLong(later)).toBe(
      new Date(later).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    );
  });

  it("cycles sprint colors and falls back for invalid negative indexes", () => {
    expect(sprintColor(0)).toBe("#ffd11a");
    expect(sprintColor(4)).toBe("#ffd11a");
    expect(sprintColor(-1)).toBe("#ffd11a");
  });
});
