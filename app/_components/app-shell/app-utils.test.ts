import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDeadlineLong,
  formatDeadlineShort,
  sprintColor,
  statusTagClass,
} from "./app-utils.js";

const NOW = new Date("2026-06-30T10:00:00.000Z");

describe("app shell utilities", () => {
  describe("statusTagClass", () => {
    it("maps active challenge statuses to the open treatment", () => {
      expect(statusTagClass("open")).toBe("app-tag status open");
      expect(statusTagClass("active")).toBe("app-tag status open");
    });

    it("maps judging and unknown statuses to their distinct treatments", () => {
      expect(statusTagClass("judging")).toBe("app-tag status judging");
      expect(statusTagClass("closed")).toBe("app-tag status default");
    });
  });

  describe("deadline formatting", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("marks deadlines at or before the current time as closed", () => {
      expect(formatDeadlineShort(NOW.toISOString())).toBe("Closed");
      expect(formatDeadlineLong(new Date(NOW.getTime() - 1).toISOString())).toBe("Closed");
    });

    it("uses floor hours for short deadlines under 48 hours", () => {
      const deadline = new Date(NOW.getTime() + 47 * 60 * 60 * 1000 + 59 * 60 * 1000);

      expect(formatDeadlineShort(deadline.toISOString())).toBe("47h");
    });

    it("switches short deadlines to day units at the 48 hour boundary", () => {
      const deadline = new Date(NOW.getTime() + 48 * 60 * 60 * 1000);

      expect(formatDeadlineShort(deadline.toISOString())).toBe("2d");
    });

    it("includes remaining minutes for long deadlines under 72 hours", () => {
      const deadline = new Date(NOW.getTime() + 3 * 60 * 60 * 1000 + 15 * 60 * 1000);

      expect(formatDeadlineLong(deadline.toISOString())).toBe("3h 15m");
    });
  });

  describe("sprintColor", () => {
    it("cycles through the sprint palette for indexes beyond the palette length", () => {
      expect(sprintColor(0)).toBe("#d8ff3d");
      expect(sprintColor(5)).toBe("#d8ff3d");
      expect(sprintColor(6)).toBe("#8f7bff");
    });

    it("falls back to the primary sprint color for unsupported negative indexes", () => {
      expect(sprintColor(-1)).toBe("#d8ff3d");
    });
  });
});
