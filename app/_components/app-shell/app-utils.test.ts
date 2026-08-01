import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatDeadlineLong,
  formatDeadlineShort,
  sprintColor,
  statusTagClass,
} from "./app-utils.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("app shell utilities", () => {
  it("maps workflow statuses to stable tag classes", () => {
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("closed")).toBe("app-tag status closed");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("paused")).toBe("app-tag status default");
  });

  it("formats short deadlines as closed, hours, or rounded-up days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-01T12:00:00.000Z"));

    expect(formatDeadlineShort("2026-02-01T11:59:59.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-02-02T13:30:00.000Z")).toBe("25h");
    expect(formatDeadlineShort("2026-02-04T00:01:00.000Z")).toBe("3d");
  });

  it("formats long deadlines with minutes for near deadlines and dates for distant ones", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-01T12:00:00.000Z"));
    const localeDate = vi.spyOn(Date.prototype, "toLocaleDateString").mockReturnValue("Thu, Feb 5");

    expect(formatDeadlineLong("2026-02-01T13:45:00.000Z")).toBe("1h 45m");
    expect(formatDeadlineLong("2026-02-01T12:00:00.000Z")).toBe("Closed");
    expect(formatDeadlineLong("2026-02-05T12:00:00.000Z")).toBe("Thu, Feb 5");
    expect(localeDate).toHaveBeenCalledWith(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  });

  it("cycles sprint colors and falls back for out-of-range negative indexes", () => {
    expect(sprintColor(0)).toBe("#ffd11a");
    expect(sprintColor(1)).toBe("#2f6bff");
    expect(sprintColor(4)).toBe("#ffd11a");
    expect(sprintColor(-1)).toBe("#ffd11a");
  });
});
