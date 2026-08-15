import { describe, expect, it } from "vitest";
import {
  getFilterValues,
  getVisibleRows,
  nextSortState,
  sortRows,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Title" },
  { key: "status", label: "Status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", kind: "score" },
];

const rows: DataTableRow[] = [
  {
    id: "a",
    title: "Challenge 10",
    status: "open",
    deadline: "2026-05-05T00:00:00.000Z",
    score: 82,
  },
  {
    id: "b",
    title: "Challenge 2",
    status: "closed",
    deadline: "2026-05-01T00:00:00.000Z",
    score: null,
  },
  {
    id: "c",
    title: "Sprint Alpha",
    status: "open",
    deadline: "2026-05-03T00:00:00.000Z",
    score: 95,
  },
];

describe("dashboard data table helpers", () => {
  it("counts non-empty filter values in first-seen order", () => {
    expect(getFilterValues([...rows, { id: "d", title: "Draft", status: "" }], "status")).toEqual([
      ["open", 2],
      ["closed", 1],
    ]);
  });

  it("applies exact filters and trimmed case-insensitive search across configured keys", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      filterKey: "status",
      filter: "open",
      searchKeys: ["title", "status"],
      query: "  sprint  ",
      sort: null,
    });

    expect(visible.map((row) => row.id)).toEqual(["c"]);
  });

  it("does not filter when the search query is whitespace only", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      filterKey: "status",
      filter: null,
      searchKeys: ["title"],
      query: "   ",
      sort: null,
    });

    expect(visible).toBe(rows);
  });

  it("sorts titles naturally and case-insensitively", () => {
    const visible = sortRows(rows, columns, { key: "title", dir: "asc" });

    expect(visible.map((row) => row.title)).toEqual(["Challenge 2", "Challenge 10", "Sprint Alpha"]);
  });

  it("sorts date-like columns chronologically", () => {
    const visible = sortRows(rows, columns, { key: "deadline", dir: "asc" });

    expect(visible.map((row) => row.id)).toEqual(["b", "c", "a"]);
  });

  it("places null scalar values after present values when sorting ascending", () => {
    const visible = sortRows(rows, columns, { key: "score", dir: "asc" });

    expect(visible.map((row) => row.id)).toEqual(["a", "c", "b"]);
  });

  it("does not mutate the original row order when sorting", () => {
    const visible = sortRows(rows, columns, { key: "score", dir: "desc" });

    expect(visible.map((row) => row.id)).toEqual(["b", "c", "a"]);
    expect(rows.map((row) => row.id)).toEqual(["a", "b", "c"]);
  });

  it("toggles sort direction for the same key and starts ascending for a new key", () => {
    expect(nextSortState(null, "title")).toEqual({ key: "title", dir: "asc" });
    expect(nextSortState({ key: "title", dir: "asc" }, "title")).toEqual({ key: "title", dir: "desc" });
    expect(nextSortState({ key: "title", dir: "desc" }, "score")).toEqual({ key: "score", dir: "asc" });
  });
});
