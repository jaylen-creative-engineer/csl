import { describe, expect, it } from "vitest";
import {
  getFilterValueCounts,
  getVisibleRows,
  nextSortState,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Challenge" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", kind: "score", numeric: true },
];

const rows: DataTableRow[] = [
  {
    id: "alpha",
    title: "Sprint 2",
    owner: "Maya",
    status: "open",
    deadline: "2026-01-03T12:00:00.000Z",
    score: 92.5,
  },
  {
    id: "beta",
    title: "Sprint 10",
    owner: "Noah",
    status: "judging",
    deadline: "2026-01-01T12:00:00.000Z",
    score: 84,
  },
  {
    id: "gamma",
    title: "Sprint 1",
    owner: "Ava",
    status: "open",
    deadline: "2026-01-02T12:00:00.000Z",
    score: 99,
  },
  {
    id: "delta",
    title: "Archive",
    owner: "Maya",
    status: "",
    deadline: "2026-01-04T12:00:00.000Z",
    score: null,
  },
];

function ids(visibleRows: DataTableRow[]): string[] {
  return visibleRows.map((row) => row.id);
}

describe("data table utilities", () => {
  it("counts non-empty filter values in first-seen order", () => {
    expect(getFilterValueCounts(rows, "status")).toEqual([
      ["open", 2],
      ["judging", 1],
    ]);
  });

  it("applies exact filters before trimmed case-insensitive search", () => {
    const visibleRows = getVisibleRows({
      columns,
      rows,
      filterKey: "status",
      filter: "open",
      searchKeys: ["title", "owner"],
      query: "  MAY  ",
      sort: null,
    });

    expect(ids(visibleRows)).toEqual(["alpha"]);
  });

  it("uses natural string sorting without mutating input rows", () => {
    const visibleRows = getVisibleRows({
      columns,
      rows,
      query: "",
      filter: null,
      searchKeys: ["title"],
      sort: { key: "title", dir: "asc" },
    });

    expect(ids(visibleRows)).toEqual(["delta", "gamma", "alpha", "beta"]);
    expect(ids(rows)).toEqual(["alpha", "beta", "gamma", "delta"]);
  });

  it("sorts deadline columns chronologically in both directions", () => {
    const ascending = getVisibleRows({
      columns,
      rows,
      query: "",
      filter: null,
      sort: { key: "deadline", dir: "asc" },
    });
    const descending = getVisibleRows({
      columns,
      rows,
      query: "",
      filter: null,
      sort: { key: "deadline", dir: "desc" },
    });

    expect(ids(ascending)).toEqual(["beta", "gamma", "alpha", "delta"]);
    expect(ids(descending)).toEqual(["delta", "alpha", "gamma", "beta"]);
  });

  it("places null scalar values last in ascending order and first in descending order", () => {
    const ascending = getVisibleRows({
      columns,
      rows,
      query: "",
      filter: null,
      sort: { key: "score", dir: "asc" },
    });
    const descending = getVisibleRows({
      columns,
      rows,
      query: "",
      filter: null,
      sort: { key: "score", dir: "desc" },
    });

    expect(ids(ascending)).toEqual(["beta", "alpha", "gamma", "delta"]);
    expect(ids(descending)).toEqual(["delta", "gamma", "alpha", "beta"]);
  });

  it("toggles the active column direction and resets new columns to ascending", () => {
    expect(nextSortState(null, "title")).toEqual({ key: "title", dir: "asc" });
    expect(nextSortState({ key: "title", dir: "asc" }, "title")).toEqual({
      key: "title",
      dir: "desc",
    });
    expect(nextSortState({ key: "title", dir: "desc" }, "score")).toEqual({
      key: "score",
      dir: "asc",
    });
  });
});
