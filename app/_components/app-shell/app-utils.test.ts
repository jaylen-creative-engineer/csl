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
    vi.setSystemTime(new Date("2026-08-11T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps domain statuses to the correct dashboard tag classes", () => {
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
    expect(formatDeadlineShort("2026-08-11T09:59:00.000Z")).toBe("Closed");
    expect(formatDeadlineShort("2026-08-12T09:00:00.000Z")).toBe("23h");
    expect(formatDeadlineShort("2026-08-13T11:00:00.000Z")).toBe("3d");
  });

  it("formats long near-term deadlines with hours and remaining minutes", () => {
    expect(formatDeadlineLong("2026-08-11T09:59:00.000Z")).toBe("Closed");
    expect(formatDeadlineLong("2026-08-11T12:30:00.000Z")).toBe("2h 30m");
  });

  it("cycles sprint colors and falls back for negative indexes", () => {
    expect(sprintColor(0)).toBe("#ffd11a");
    expect(sprintColor(1)).toBe("#2f6bff");
    expect(sprintColor(4)).toBe("#ffd11a");
    expect(sprintColor(-1)).toBe("#ffd11a");
  });
});
