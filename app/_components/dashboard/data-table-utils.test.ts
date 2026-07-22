import { describe, expect, it } from "vitest";
import {
  compareDataTableValues,
  getFilterValues,
  getVisibleRows,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Sprint" },
  { key: "status", label: "Status" },
  { key: "score", label: "Score", numeric: true },
  { key: "deadline", label: "Deadline", kind: "deadline" },
];

const rows: DataTableRow[] = [
  {
    id: "a",
    title: "Poster Sprint 10",
    status: "open",
    score: 8.2,
    deadline: "2026-08-03T10:00:00.000Z",
  },
  {
    id: "b",
    title: "Logo Sprint 2",
    status: "judging",
    score: 9.1,
    deadline: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "c",
    title: "Motion Sprint 1",
    status: "open",
    score: 7.5,
    deadline: "2026-08-02T10:00:00.000Z",
  },
];

describe("dashboard data table helpers", () => {
  it("counts non-empty filter values in first-seen order", () => {
    expect(getFilterValues([...rows, { id: "d", title: "Draft", status: "" }], "status")).toEqual(
      [
        ["open", 2],
        ["judging", 1],
      ],
    );
  });

  it("filters and searches rows using trimmed case-insensitive queries", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      filterKey: "status",
      filter: "open",
      query: " motion ",
      searchKeys: ["title", "status"],
      sort: null,
    });

    expect(visible.map((row) => row.id)).toEqual(["c"]);
  });

  it("sorts date-like columns chronologically instead of lexically", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      filter: null,
      query: "",
      sort: { key: "deadline", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["b", "c", "a"]);
  });

  it("uses natural string comparison for dashboard labels", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      filter: null,
      query: "",
      sort: { key: "title", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["b", "c", "a"]);
  });

  it("keeps nullish values after populated values in ascending comparisons", () => {
    expect(compareDataTableValues(null, "Sprint")).toBeGreaterThan(0);
    expect(compareDataTableValues("Sprint", undefined)).toBeLessThan(0);
  });
});
