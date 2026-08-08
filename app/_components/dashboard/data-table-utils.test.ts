import { describe, expect, it } from "vitest";
import {
  filterValuesForRows,
  nextSortState,
  visibleRowsForState,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Title" },
  { key: "league", label: "League" },
  { key: "status", label: "Status", kind: "status" },
  { key: "score", label: "Score", kind: "score", numeric: true },
  { key: "deadline", label: "Deadline", kind: "deadline" },
];

const rows: DataTableRow[] = [
  {
    id: "sprint-10",
    title: "Sprint 10",
    league: "Motion League",
    status: "open",
    score: 89,
    deadline: "2026-03-10T00:00:00.000Z",
  },
  {
    id: "sprint-2",
    title: "sprint 2",
    league: "Brand League",
    status: "judging",
    score: null,
    deadline: "2026-01-05T00:00:00.000Z",
  },
  {
    id: "alpha",
    title: "Alpha build",
    league: "Motion League",
    status: "open",
    score: 72,
    deadline: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "draft",
    title: "No status sprint",
    league: "Ops League",
    status: "",
    score: 91,
    deadline: "2026-02-15T00:00:00.000Z",
  },
];

function idsFor(visibleRows: DataTableRow[]) {
  return visibleRows.map((row) => row.id);
}

describe("DataTable state utilities", () => {
  it("counts non-empty filter values in row order", () => {
    expect(filterValuesForRows(rows, "status")).toEqual([
      ["open", 2],
      ["judging", 1],
    ]);
  });

  it("applies exact filters before trimmed case-insensitive search", () => {
    const visible = visibleRowsForState({
      columns,
      rows,
      query: " motion ",
      filter: "open",
      filterKey: "status",
      searchKeys: ["title", "league"],
      sort: null,
    });

    expect(idsFor(visible)).toEqual(["sprint-10", "alpha"]);
  });

  it("treats whitespace-only search as a no-op", () => {
    const visible = visibleRowsForState({
      columns,
      rows,
      query: "   ",
      filter: null,
      searchKeys: ["title"],
      sort: null,
    });

    expect(visible).toBe(rows);
  });

  it("uses natural case-insensitive ordering for string sorts", () => {
    const visible = visibleRowsForState({
      columns,
      rows,
      query: "",
      filter: null,
      searchKeys: ["title"],
      sort: { key: "title", dir: "asc" },
    });

    expect(idsFor(visible)).toEqual(["alpha", "draft", "sprint-2", "sprint-10"]);
  });

  it("sorts deadline columns chronologically", () => {
    const visible = visibleRowsForState({
      columns,
      rows,
      query: "",
      filter: null,
      sort: { key: "deadline", dir: "asc" },
    });

    expect(idsFor(visible)).toEqual(["sprint-2", "alpha", "draft", "sprint-10"]);
  });

  it("keeps null scalar values last for ascending sorts without mutating input", () => {
    const originalOrder = idsFor(rows);
    const visible = visibleRowsForState({
      columns,
      rows,
      query: "",
      filter: null,
      sort: { key: "score", dir: "asc" },
    });

    expect(idsFor(visible)).toEqual(["alpha", "sprint-10", "draft", "sprint-2"]);
    expect(idsFor(rows)).toEqual(originalOrder);
  });

  it("starts a new sort ascending and toggles the same key", () => {
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
