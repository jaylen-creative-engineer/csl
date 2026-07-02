import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDeadlineLong,
  formatDeadlineShort,
  formatSubmissionDate,
} from "../../app/_components/app-shell/app-utils.js";

const NOW = new Date("2026-07-02T10:00:00.000Z");

function hoursFromNow(hours: number, minutes = 0): string {
  return new Date(NOW.getTime() + hours * 60 * 60 * 1000 + minutes * 60 * 1000).toISOString();
}

describe("app shell date utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("formatDeadlineShort", () => {
    it("shows closed for past deadlines", () => {
      expect(formatDeadlineShort(hoursFromNow(-1))).toBe("Closed");
    });

    it("keeps urgent deadlines in hours and rounds longer deadlines up to days", () => {
      expect(formatDeadlineShort(hoursFromNow(47))).toBe("47h");
      expect(formatDeadlineShort(hoursFromNow(49))).toBe("3d");
    });

    it("uses a safe fallback for invalid deadlines", () => {
      expect(formatDeadlineShort("not-a-date")).toBe("Unknown");
    });
  });

  describe("formatDeadlineLong", () => {
    it("includes hours and minutes for deadlines inside the 72 hour window", () => {
      expect(formatDeadlineLong(hoursFromNow(2, 30))).toBe("2h 30m");
    });

    it("shows closed and unknown states without leaking invalid date text", () => {
      expect(formatDeadlineLong(hoursFromNow(-1))).toBe("Closed");
      expect(formatDeadlineLong("not-a-date")).toBe("Unknown");
    });
  });

  describe("formatSubmissionDate", () => {
    it("prefers the domain submittedAt field over createdAt", () => {
      const submittedAt = "2026-05-04T12:00:00.000Z";
      const createdAt = "2026-01-01T12:00:00.000Z";

      expect(formatSubmissionDate({ submittedAt, createdAt })).toBe(
        new Date(submittedAt).toLocaleDateString()
      );
    });

    it("falls back to createdAt for legacy-shaped submissions", () => {
      const createdAt = "2026-01-01T12:00:00.000Z";

      expect(formatSubmissionDate({ createdAt })).toBe(new Date(createdAt).toLocaleDateString());
    });

    it("returns a safe fallback when no valid submission timestamp is present", () => {
      expect(formatSubmissionDate({ submittedAt: "bad", createdAt: "also-bad" })).toBe("Unknown");
      expect(formatSubmissionDate({})).toBe("Unknown");
    });
  });
});
