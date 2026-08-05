import { describe, expect, it } from "vitest";
import {
  getFilterValues,
  getVisibleRows,
  nextSortState,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Sprint" },
  { key: "leagueName", label: "League" },
  { key: "status", label: "Status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score" },
];

const rows: DataTableRow[] = [
  {
    id: "a",
    title: "Poster Sprint 2",
    leagueName: "Motion Lab",
    status: "open",
    deadline: "2026-06-03T00:00:00.000Z",
    score: 9.2,
  },
  {
    id: "b",
    title: "Poster Sprint 10",
    leagueName: "Brand Studio",
    status: "judging",
    deadline: "2026-06-01T00:00:00.000Z",
    score: null,
  },
  {
    id: "c",
    title: "Audio Sprint 1",
    leagueName: "Motion Lab",
    status: "open",
    deadline: "2026-06-02T00:00:00.000Z",
    score: 8.7,
  },
];

describe("DataTable data utilities", () => {
  it("counts non-empty filter values while preserving first-seen order", () => {
    expect(getFilterValues([...rows, { id: "d", status: "" }], "status")).toEqual([
      ["open", 2],
      ["judging", 1],
    ]);
  });

  it("applies exact filters and trimmed case-insensitive search across configured keys", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      filterKey: "status",
      filter: "open",
      query: "  motion  ",
      searchKeys: ["title", "leagueName"],
      sort: null,
    });

    expect(visible.map((row) => row.id)).toEqual(["a", "c"]);
  });

  it("treats whitespace-only search as a no-op", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      query: "   ",
      filter: null,
      sort: null,
      searchKeys: ["title"],
    });

    expect(visible).toBe(rows);
  });

  it("sorts date-like deadline columns chronologically without mutating input rows", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      query: "",
      filter: null,
      sort: { key: "deadline", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["b", "c", "a"]);
    expect(rows.map((row) => row.id)).toEqual(["a", "b", "c"]);
  });

  it("uses natural, case-insensitive ordering for text columns", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      query: "",
      filter: null,
      sort: { key: "title", dir: "asc" },
    });

    expect(visible.map((row) => row.title)).toEqual([
      "Audio Sprint 1",
      "Poster Sprint 2",
      "Poster Sprint 10",
    ]);
  });

  it("keeps null scalar values at the end for ascending sorts", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      query: "",
      filter: null,
      sort: { key: "score", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["c", "a", "b"]);
  });

  it("toggles the active sort direction and starts new columns ascending", () => {
    expect(nextSortState(null, "deadline")).toEqual({ key: "deadline", dir: "asc" });
    expect(nextSortState({ key: "deadline", dir: "asc" }, "deadline")).toEqual({
      key: "deadline",
      dir: "desc",
    });
    expect(nextSortState({ key: "deadline", dir: "desc" }, "title")).toEqual({
      key: "title",
      dir: "asc",
    });
  });
});
