import { describe, expect, it } from "vitest";
import {
  getFilterValues,
  getNextSort,
  getVisibleRows,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Title", kind: "text" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", numeric: true },
];

const rows: DataTableRow[] = [
  {
    id: "r1",
    title: "Sprint 10",
    status: "open",
    owner: "Maya",
    deadline: "2026-01-03T00:00:00.000Z",
    score: 12,
  },
  {
    id: "r2",
    title: "Sprint 2",
    status: "judging",
    owner: "Alex",
    deadline: "2026-01-01T00:00:00.000Z",
    score: 9,
  },
  {
    id: "r3",
    title: "Sprint 1",
    status: "open",
    owner: "Riley",
    deadline: "2026-01-02T00:00:00.000Z",
    score: 15,
  },
  {
    id: "r4",
    title: "Archived sprint",
    status: "",
    owner: null,
    deadline: "2026-01-04T00:00:00.000Z",
    score: 3,
  },
];

function ids(result: DataTableRow[]): string[] {
  return result.map((row) => row.id);
}

describe("data table utilities", () => {
  it("builds filter counts in row order and skips empty values", () => {
    expect(getFilterValues(rows, "status")).toEqual([
      ["open", 2],
      ["judging", 1],
    ]);
  });

  it("applies exact filters before trimmed case-insensitive search", () => {
    const result = getVisibleRows({
      columns,
      rows,
      filterKey: "status",
      filter: "open",
      query: "  riLeY  ",
      searchKeys: ["title", "owner"],
    });

    expect(ids(result)).toEqual(["r3"]);
  });

  it("sorts string values naturally without case sensitivity", () => {
    const result = getVisibleRows({
      columns,
      rows: rows.slice(0, 3),
      sort: { key: "title", dir: "asc" },
    });

    expect(ids(result)).toEqual(["r3", "r2", "r1"]);
  });

  it("sorts deadline columns chronologically", () => {
    const result = getVisibleRows({
      columns,
      rows: rows.slice(0, 3),
      sort: { key: "deadline", dir: "asc" },
    });

    expect(ids(result)).toEqual(["r2", "r3", "r1"]);
  });

  it("sorts numeric values without mutating the source rows", () => {
    const source = rows.slice(0, 3);
    const result = getVisibleRows({
      columns,
      rows: source,
      sort: { key: "score", dir: "desc" },
    });

    expect(ids(result)).toEqual(["r3", "r1", "r2"]);
    expect(ids(source)).toEqual(["r1", "r2", "r3"]);
  });

  it("places missing scalar values after populated values in ascending order", () => {
    const sparseRows: DataTableRow[] = [
      { id: "missing", title: null },
      { id: "present", title: "Alpha" },
    ];

    const result = getVisibleRows({
      columns,
      rows: sparseRows,
      sort: { key: "title", dir: "asc" },
    });

    expect(ids(result)).toEqual(["present", "missing"]);
  });

  it("starts a new sort ascending and toggles the same key", () => {
    expect(getNextSort(null, "title")).toEqual({ key: "title", dir: "asc" });
    expect(getNextSort({ key: "title", dir: "asc" }, "title")).toEqual({
      key: "title",
      dir: "desc",
    });
    expect(getNextSort({ key: "title", dir: "desc" }, "score")).toEqual({
      key: "score",
      dir: "asc",
    });
  });
});
