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
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps known workflow statuses to dashboard tag classes", () => {
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("closed")).toBe("app-tag status closed");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("unknown")).toBe("app-tag status default");
  });

  it("formats short deadlines around closed, hourly, and daily boundaries", () => {
    expect(formatDeadlineShort("2025-12-31T23:59:00.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-01-01T01:30:00.000Z")).toBe("1h");
    expect(formatDeadlineShort("2026-01-03T00:00:00.000Z")).toBe("2d");
    expect(formatDeadlineShort("2026-01-03T00:01:00.000Z")).toBe("3d");
  });

  it("formats long deadlines with minutes before falling back to a date label", () => {
    expect(formatDeadlineLong("2026-01-01T05:45:00.000Z")).toBe("5h 45m");

    const farDeadline = "2026-01-05T00:00:00.000Z";
    expect(formatDeadlineLong(farDeadline)).toBe(
      new Date(farDeadline).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    );
  });

  it("cycles sprint colors across dashboard rows", () => {
    expect(sprintColor(0)).toBe("#ffd11a");
    expect(sprintColor(1)).toBe("#2f6bff");
    expect(sprintColor(4)).toBe("#ffd11a");
    expect(sprintColor(-1)).toBe("#ffd11a");
  });
});
