import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDeadlineLong,
  formatDeadlineShort,
  sprintColor,
  statusTagClass,
} from "./app-utils.js";

describe("app shell utility formatting", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps lifecycle states to the expected status tag classes", () => {
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
    expect(formatDeadlineShort("2026-02-01T11:59:59.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-02-02T11:30:00.000Z")).toBe("23h");
    expect(formatDeadlineShort("2026-02-04T11:00:00.000Z")).toBe("3d");
  });

  it("formats long deadlines with minutes for near-term dates", () => {
    expect(formatDeadlineLong("2026-02-01T12:00:00.000Z")).toBe("Closed");
    expect(formatDeadlineLong("2026-02-01T14:45:00.000Z")).toBe("2h 45m");
  });

  it("cycles sprint colors through the landing palette", () => {
    expect([0, 1, 2, 3, 4].map(sprintColor)).toEqual([
      "#ffd11a",
      "#2f6bff",
      "#ff3b2f",
      "#f4f3ef",
      "#ffd11a",
    ]);
  });
});
