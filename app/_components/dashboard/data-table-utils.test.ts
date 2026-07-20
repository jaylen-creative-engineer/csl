import { describe, expect, it } from "vitest";
import {
  compareDataTableValues,
  getDataTableFilterValues,
  getVisibleDataTableRows,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Sprint", kind: "primary" },
  { key: "leagueName", label: "League" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Closes", kind: "deadline" },
  { key: "score", label: "Score", kind: "score" },
];

const rows: DataTableRow[] = [
  {
    id: "motion-10",
    title: "Motion Sprint 10",
    leagueName: "Editorial Systems",
    status: "open",
    deadline: "2026-07-22T10:00:00.000Z",
    score: 8.5,
  },
  {
    id: "brand-2",
    title: "Brand Sprint 2",
    leagueName: "Identity Lab",
    status: "judging",
    deadline: "2026-07-20T10:00:00.000Z",
    score: 9.2,
  },
  {
    id: "motion-2",
    title: "Motion Sprint 2",
    leagueName: "Editorial Systems",
    status: "open",
    deadline: "2026-07-21T10:00:00.000Z",
    score: 7.1,
  },
  {
    id: "archive",
    title: "Archive Sprint",
    leagueName: null,
    status: "closed",
    deadline: "2026-07-19T10:00:00.000Z",
    score: null,
  },
];

describe("DataTable utilities", () => {
  it("counts populated filter values without adding empty chips", () => {
    expect(getDataTableFilterValues([...rows, { id: "no-status", status: "" }], "status")).toEqual([
      ["open", 2],
      ["judging", 1],
      ["closed", 1],
    ]);
  });

  it("applies status filters and trimmed multi-key search together", () => {
    const visible = getVisibleDataTableRows({
      columns,
      rows,
      filterKey: "status",
      filter: "open",
      query: "  editorial  ",
      searchKeys: ["title", "leagueName"],
    });

    expect(visible.map((row) => row.id)).toEqual(["motion-10", "motion-2"]);
  });

  it("sorts deadline and date columns by timestamp instead of display text", () => {
    const visible = getVisibleDataTableRows({
      columns,
      rows,
      sort: { key: "deadline", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual([
      "archive",
      "brand-2",
      "motion-2",
      "motion-10",
    ]);
  });

  it("uses natural string comparison for numbered sprint names", () => {
    const visible = getVisibleDataTableRows({
      columns,
      rows,
      sort: { key: "title", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual([
      "archive",
      "brand-2",
      "motion-2",
      "motion-10",
    ]);
  });

  it("sorts numeric scores without mutating the incoming row order", () => {
    const scoredRows = rows.filter((row) => row.score != null);
    const visible = getVisibleDataTableRows({
      columns,
      rows: scoredRows,
      sort: { key: "score", dir: "desc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["brand-2", "motion-10", "motion-2"]);
    expect(rows.map((row) => row.id)).toEqual(["motion-10", "brand-2", "motion-2", "archive"]);
  });

  it("keeps empty values after populated values for ascending comparisons", () => {
    expect(compareDataTableValues(null, "open")).toBeGreaterThan(0);
    expect(compareDataTableValues("open", undefined)).toBeLessThan(0);
    expect(compareDataTableValues(null, undefined)).toBe(0);
  });
});
