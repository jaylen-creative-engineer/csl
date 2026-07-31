import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDeadlineLong, formatDeadlineShort, sprintColor, statusTagClass } from "./app-utils";

describe("app shell utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("statusTagClass", () => {
    it("maps active challenge states to the open visual treatment", () => {
      expect(statusTagClass("open")).toBe("app-tag status open");
      expect(statusTagClass("active")).toBe("app-tag status open");
    });

    it("keeps judging distinct and falls back for unknown statuses", () => {
      expect(statusTagClass("judging")).toBe("app-tag status judging");
      expect(statusTagClass("draft")).toBe("app-tag status default");
      expect(statusTagClass("complete")).toBe("app-tag status default");
    });
  });

  describe("formatDeadlineShort", () => {
    it("marks elapsed deadlines as closed", () => {
      expect(formatDeadlineShort("2026-07-01T11:59:59.000Z")).toBe("Closed");
      expect(formatDeadlineShort("2026-07-01T12:00:00.000Z")).toBe("Closed");
    });

    it("uses whole hours for deadlines less than 48 hours away", () => {
      expect(formatDeadlineShort("2026-07-01T12:45:00.000Z")).toBe("0h");
      expect(formatDeadlineShort("2026-07-03T11:59:59.000Z")).toBe("47h");
    });

    it("rounds up to days once a deadline is at least 48 hours away", () => {
      expect(formatDeadlineShort("2026-07-03T12:00:00.000Z")).toBe("2d");
      expect(formatDeadlineShort("2026-07-03T13:00:00.000Z")).toBe("3d");
    });
  });

  describe("formatDeadlineLong", () => {
    it("marks elapsed deadlines as closed", () => {
      expect(formatDeadlineLong("2026-07-01T11:59:59.000Z")).toBe("Closed");
      expect(formatDeadlineLong("2026-07-01T12:00:00.000Z")).toBe("Closed");
    });

    it("uses hours and minutes for deadlines less than 72 hours away", () => {
      expect(formatDeadlineLong("2026-07-01T13:05:00.000Z")).toBe("1h 5m");
      expect(formatDeadlineLong("2026-07-04T11:59:59.000Z")).toBe("71h 59m");
    });

    it("switches to a calendar label at the 72 hour boundary", () => {
      const boundary = "2026-07-04T12:00:00.000Z";
      const calendarLabel = new Date(boundary).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      expect(formatDeadlineLong(boundary)).toBe(calendarLabel);
    });
  });

  describe("sprintColor", () => {
    it("cycles through the sprint palette", () => {
      expect(sprintColor(0)).toBe("#d8ff3d");
      expect(sprintColor(1)).toBe("#8f7bff");
      expect(sprintColor(5)).toBe("#d8ff3d");
      expect(sprintColor(6)).toBe("#8f7bff");
    });

    it("falls back to the primary color for out-of-range indexes", () => {
      expect(sprintColor(-1)).toBe("#d8ff3d");
      expect(sprintColor(Number.NaN)).toBe("#d8ff3d");
    });
  });
});
