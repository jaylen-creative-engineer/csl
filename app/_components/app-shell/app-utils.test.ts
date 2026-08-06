import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDeadlineLong, formatDeadlineShort, sprintColor, statusTagClass } from "./app-utils.js";

describe("app shell utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps domain statuses to stable tag classes", () => {
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("closed")).toBe("app-tag status closed");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("paused")).toBe("app-tag status default");
  });

  it("formats short deadlines around the closed, hourly, and day-count boundaries", () => {
    expect(formatDeadlineShort("2026-04-01T11:59:59.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-04-03T11:59:00.000Z")).toBe("47h");
    expect(formatDeadlineShort("2026-04-03T12:00:00.000Z")).toBe("2d");
    expect(formatDeadlineShort("2026-04-03T13:00:00.000Z")).toBe("3d");
  });

  it("formats long deadlines with minutes before falling back to calendar dates", () => {
    expect(formatDeadlineLong("2026-04-01T14:15:00.000Z")).toBe("2h 15m");
  });

  it("cycles sprint colors through the CSL palette", () => {
    expect([0, 1, 2, 3, 4].map(sprintColor)).toEqual([
      "#ffd11a",
      "#2f6bff",
      "#ff3b2f",
      "#f4f3ef",
      "#ffd11a",
    ]);
  });
});
