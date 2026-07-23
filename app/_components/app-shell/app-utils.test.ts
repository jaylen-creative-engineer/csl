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
  it("maps challenge and league lifecycle statuses to stable tag classes", () => {
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
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));

    expect(formatDeadlineShort("2026-06-01T11:59:00.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-06-02T11:30:00.000Z")).toBe("23h");
    expect(formatDeadlineShort("2026-06-04T11:30:00.000Z")).toBe("3d");
  });

  it("formats long deadlines with minutes for nearby work and closed for elapsed work", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));

    expect(formatDeadlineLong("2026-06-01T11:00:00.000Z")).toBe("Closed");
    expect(formatDeadlineLong("2026-06-01T14:45:00.000Z")).toBe("2h 45m");
  });

  it("cycles sprint accent colors across the landing palette", () => {
    expect([0, 1, 2, 3, 4].map((index) => sprintColor(index))).toEqual([
      "#ffd11a",
      "#2f6bff",
      "#ff3b2f",
      "#f4f3ef",
      "#ffd11a",
    ]);
  });
});
