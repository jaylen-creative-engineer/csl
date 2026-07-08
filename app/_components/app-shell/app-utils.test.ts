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

  it("maps active workflow states to dashboard tag classes", () => {
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("closed")).toBe("app-tag status closed");
    expect(statusTagClass("paused")).toBe("app-tag status default");
  });

  it("formats short deadlines as closed, hours under 48h, and days at longer ranges", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-08T10:00:00.000Z"));

    expect(formatDeadlineShort("2026-07-08T09:59:59.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-07-10T09:59:00.000Z")).toBe("47h");
    expect(formatDeadlineShort("2026-07-10T11:00:00.000Z")).toBe("3d");
  });

  it("formats long deadlines with minutes under 72h and calendar labels after that", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-08T10:00:00.000Z"));

    expect(formatDeadlineLong("2026-07-08T10:00:00.000Z")).toBe("Closed");
    expect(formatDeadlineLong("2026-07-08T12:30:00.000Z")).toBe("2h 30m");
    expect(formatDeadlineLong("2026-07-11T10:00:00.000Z")).toBe("Sat, Jul 11");
  });

  it("cycles sprint colors across dashboard rows", () => {
    expect([0, 1, 2, 3, 4].map((index) => sprintColor(index))).toEqual([
      "#ffd11a",
      "#2f6bff",
      "#ff3b2f",
      "#f4f3ef",
      "#ffd11a",
    ]);
  });
});
