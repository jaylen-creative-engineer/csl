import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDeadlineLong,
  formatDeadlineShort,
  sprintColor,
  statusTagClass,
} from "./app-utils.js";

describe("statusTagClass", () => {
  it("maps known lifecycle statuses to dashboard tag classes", () => {
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("closed")).toBe("app-tag status closed");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
  });

  it("falls back for unknown statuses", () => {
    expect(statusTagClass("archived")).toBe("app-tag status default");
  });
});

describe("deadline formatting", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-05T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats short deadlines as closed, hours, or days", () => {
    expect(formatDeadlineShort("2026-07-05T09:59:00.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-07-07T09:30:00.000Z")).toBe("47h");
    expect(formatDeadlineShort("2026-07-07T10:00:00.000Z")).toBe("2d");
    expect(formatDeadlineShort("2026-07-07T11:00:00.000Z")).toBe("3d");
  });

  it("formats long deadlines as closed, countdowns, or calendar dates", () => {
    const calendarDeadline = "2026-07-09T10:00:00.000Z";
    const expectedCalendarLabel = new Date(calendarDeadline).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    expect(formatDeadlineLong("2026-07-05T09:59:00.000Z")).toBe("Closed");
    expect(formatDeadlineLong("2026-07-05T12:15:00.000Z")).toBe("2h 15m");
    expect(formatDeadlineLong(calendarDeadline)).toBe(expectedCalendarLabel);
  });
});

describe("sprintColor", () => {
  it("cycles through the dashboard sprint palette", () => {
    expect(sprintColor(0)).toBe("#ffd11a");
    expect(sprintColor(1)).toBe("#2f6bff");
    expect(sprintColor(2)).toBe("#ff3b2f");
    expect(sprintColor(3)).toBe("#f4f3ef");
    expect(sprintColor(4)).toBe("#ffd11a");
  });

  it("falls back to yellow when an index cannot resolve", () => {
    expect(sprintColor(-1)).toBe("#ffd11a");
  });
});
