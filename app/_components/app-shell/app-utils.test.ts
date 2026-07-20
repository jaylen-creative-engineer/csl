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

  it("groups domain statuses into stable dashboard tag classes", () => {
    expect(statusTagClass("open")).toBe("app-tag status open");
    expect(statusTagClass("active")).toBe("app-tag status open");
    expect(statusTagClass("judging")).toBe("app-tag status judging");
    expect(statusTagClass("draft")).toBe("app-tag status judging");
    expect(statusTagClass("complete")).toBe("app-tag status closed");
    expect(statusTagClass("completed")).toBe("app-tag status closed");
    expect(statusTagClass("unknown")).toBe("app-tag status default");
  });

  it("formats short deadlines as hours, rounded-up days, or closed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-20T10:00:00.000Z"));

    expect(formatDeadlineShort("2026-07-20T12:59:00.000Z")).toBe("2h");
    expect(formatDeadlineShort("2026-07-22T11:00:00.000Z")).toBe("3d");
    expect(formatDeadlineShort("2026-07-20T09:59:00.000Z")).toBe("Closed");
  });

  it("formats long deadlines with minutes for imminent work", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-20T10:00:00.000Z"));

    expect(formatDeadlineLong("2026-07-20T12:30:00.000Z")).toBe("2h 30m");
    expect(formatDeadlineLong("2026-07-20T10:00:00.000Z")).toBe("Closed");
  });

  it("cycles through sprint colors and falls back for out-of-range negative indexes", () => {
    expect(sprintColor(0)).toBe("#ffd11a");
    expect(sprintColor(1)).toBe("#2f6bff");
    expect(sprintColor(4)).toBe("#ffd11a");
    expect(sprintColor(-1)).toBe("#ffd11a");
  });
});
