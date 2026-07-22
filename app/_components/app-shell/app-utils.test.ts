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

  it("maps known lifecycle statuses to their dashboard tag classes", () => {
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("blocked")).toBe("app-tag status default");
  });

  it("formats short deadlines around closed, hourly, and day boundaries", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-22T10:00:00.000Z"));

    expect(formatDeadlineShort("2026-07-22T09:59:59.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-07-23T09:30:00.000Z")).toBe("23h");
    expect(formatDeadlineShort("2026-07-24T10:00:00.000Z")).toBe("2d");
  });

  it("formats long deadlines with minutes before switching to dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-22T10:00:00.000Z"));

    expect(formatDeadlineLong("2026-07-22T10:00:00.000Z")).toBe("Closed");
    expect(formatDeadlineLong("2026-07-22T12:45:30.000Z")).toBe("2h 45m");
  });

  it("cycles sprint colors and falls back for unsupported negative indexes", () => {
    expect(sprintColor(0)).toBe("#ffd11a");
    expect(sprintColor(4)).toBe("#ffd11a");
    expect(sprintColor(-1)).toBe("#ffd11a");
  });
});
