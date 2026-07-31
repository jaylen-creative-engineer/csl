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
    vi.setSystemTime(new Date("2026-07-31T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("statusTagClass", () => {
    it.each([
      ["open", "app-tag status open"],
      ["active", "app-tag status open"],
      ["judging", "app-tag status judging"],
      ["draft", "app-tag status judging"],
      ["closed", "app-tag status closed"],
      ["complete", "app-tag status closed"],
      ["completed", "app-tag status closed"],
      ["paused", "app-tag status default"],
    ])("maps %s to %s", (status, expectedClass) => {
      expect(statusTagClass(status)).toBe(expectedClass);
    });
  });

  describe("formatDeadlineShort", () => {
    it("marks past deadlines as closed", () => {
      expect(formatDeadlineShort("2026-07-31T11:59:59.000Z")).toBe("Closed");
    });

    it("uses whole hours while less than 48 hours remain", () => {
      expect(formatDeadlineShort("2026-08-02T11:59:00.000Z")).toBe("47h");
    });

    it("uses rounded-up days once at least 48 hours remain", () => {
      expect(formatDeadlineShort("2026-08-02T12:00:00.000Z")).toBe("2d");
      expect(formatDeadlineShort("2026-08-03")).toBe("3d");
    });
  });

  describe("formatDeadlineLong", () => {
    it("marks past deadlines as closed", () => {
      expect(formatDeadlineLong("2026-07-30T12:00:00.000Z")).toBe("Closed");
    });

    it("includes hours and minutes while less than 72 hours remain", () => {
      expect(formatDeadlineLong("2026-07-31T14:30:00.000Z")).toBe("2h 30m");
    });

    it("falls back to the locale weekday date once 72 hours or more remain", () => {
      const deadline = new Date("2026-08-04T12:00:00.000Z");

      expect(formatDeadlineLong(deadline.toISOString())).toBe(
        deadline.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      );
    });
  });

  describe("sprintColor", () => {
    it("cycles through the triad palette and bone ink", () => {
      expect([0, 1, 2, 3, 4].map((index) => sprintColor(index))).toEqual([
        "#ffd11a",
        "#2f6bff",
        "#ff3b2f",
        "#f4f3ef",
        "#ffd11a",
      ]);
    });

    it("uses the primary color fallback for negative indices", () => {
      expect(sprintColor(-1)).toBe("#ffd11a");
    });
  });
});
