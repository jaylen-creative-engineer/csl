import { describe, expect, it } from "vitest";
import {
  compareValues,
  filterCounts,
  nextSortState,
  visibleRows,
} from "./data-table-utils.js";
import type { ColumnSpec, DataTableRow } from "./data-table-utils.js";

const rows: DataTableRow[] = [
  {
    id: "sprint-10",
    title: "Sprint 10",
    owner: "Alex",
    status: "open",
    deadline: "2026-10-01T00:00:00.000Z",
    score: 92,
  },
  {
    id: "sprint-2",
    title: "Sprint 2",
    owner: "Blair",
    status: "judging",
    deadline: "2026-02-01T00:00:00.000Z",
    score: 87,
  },
  {
    id: "sprint-1",
    title: "Sprint 1",
    owner: "Casey",
    status: "open",
    deadline: "2026-05-01T00:00:00.000Z",
    score: 99,
  },
  {
    id: "sprint-empty",
    title: "Untitled",
    owner: null,
    status: "",
    deadline: "2026-06-01T00:00:00.000Z",
    score: null,
  },
];

const columns: ColumnSpec[] = [
  { key: "title", label: "Sprint" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", numeric: true },
];

describe("dashboard data-table helpers", () => {
  it("counts non-empty filter values without sorting away insertion order", () => {
    expect(filterCounts(rows, "status")).toEqual([
      ["open", 2],
      ["judging", 1],
    ]);
  });

  it("applies exact filters and trimmed case-insensitive search", () => {
    const visible = visibleRows({
      columns,
      rows,
      query: "  alex ",
      filterKey: "status",
      filter: "open",
      searchKeys: ["title", "owner"],
      sort: null,
    });

    expect(visible.map((row) => row.id)).toEqual(["sprint-10"]);
  });

  it("sorts natural string values without mutating the source rows", () => {
    const visible = visibleRows({
      columns,
      rows,
      query: "",
      filter: null,
      searchKeys: ["title"],
      sort: { key: "title", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual([
      "sprint-1",
      "sprint-2",
      "sprint-10",
      "sprint-empty",
    ]);
    expect(rows.map((row) => row.id)).toEqual([
      "sprint-10",
      "sprint-2",
      "sprint-1",
      "sprint-empty",
    ]);
  });

  it("sorts deadline columns by timestamp rather than lexicographic label", () => {
    const visible = visibleRows({
      columns,
      rows,
      query: "",
      filter: null,
      searchKeys: ["title"],
      sort: { key: "deadline", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual([
      "sprint-2",
      "sprint-1",
      "sprint-empty",
      "sprint-10",
    ]);
  });

  it("uses numeric comparison and keeps null scalar values last", () => {
    expect(compareValues(2, 10)).toBe(-8);
    expect(compareValues(null, 10)).toBe(1);
    expect(compareValues(10, undefined)).toBe(-1);
  });

  it("starts sorting ascending and toggles direction for the same key", () => {
    expect(nextSortState(null, "deadline")).toEqual({ key: "deadline", dir: "asc" });
    expect(nextSortState({ key: "deadline", dir: "asc" }, "deadline")).toEqual({
      key: "deadline",
      dir: "desc",
    });
    expect(nextSortState({ key: "deadline", dir: "desc" }, "score")).toEqual({
      key: "score",
      dir: "asc",
    });
  });
});
