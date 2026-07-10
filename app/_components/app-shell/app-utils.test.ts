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

describe("app shell utilities", () => {
  it("maps domain statuses to the dashboard tag classes", () => {
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
    vi.setSystemTime(new Date("2026-07-10T10:00:00.000Z"));

    expect(formatDeadlineShort("2026-07-10T09:59:59.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-07-10T15:30:00.000Z")).toBe("5h");
    expect(formatDeadlineShort("2026-07-12T16:00:00.000Z")).toBe("3d");
  });

  it("formats long deadlines with minutes before falling back to dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T10:00:00.000Z"));

    expect(formatDeadlineLong("2026-07-10T12:30:00.000Z")).toBe("2h 30m");
    expect(formatDeadlineLong("2026-07-10T10:00:00.000Z")).toBe("Closed");
  });

  it("cycles sprint colors through the dashboard palette", () => {
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
