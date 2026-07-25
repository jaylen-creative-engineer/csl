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

  it("maps known challenge states to their visual status groups", () => {
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("unknown")).toBe("app-tag status default");
  });

  it("formats short deadlines around closed, hourly, and daily boundaries", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));

    expect(formatDeadlineShort("2026-01-01T11:59:59.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-01-02T11:30:00.000Z")).toBe("23h");
    expect(formatDeadlineShort("2026-01-03T12:00:00.000Z")).toBe("2d");
  });

  it("formats long deadlines as minutes for near deadlines and dates for distant ones", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));

    expect(formatDeadlineLong("2026-01-01T12:00:00.000Z")).toBe("Closed");
    expect(formatDeadlineLong("2026-01-01T14:45:00.000Z")).toBe("2h 45m");
    expect(formatDeadlineLong("2026-01-05T12:00:00.000Z")).toBe(
      new Date("2026-01-05T12:00:00.000Z").toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    );
  });

  it("cycles sprint colors through the shared app palette", () => {
    expect([0, 1, 2, 3, 4].map((index) => sprintColor(index))).toEqual([
      "#ffd11a",
      "#2f6bff",
      "#ff3b2f",
      "#f4f3ef",
      "#ffd11a",
    ]);
  });
});
