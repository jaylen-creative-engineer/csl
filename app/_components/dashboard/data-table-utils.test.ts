import { describe, expect, it } from "vitest";
import {
  getFilterValues,
  getVisibleRows,
  nextSortState,
  type SortState,
} from "./data-table-utils.js";
import type { ColumnSpec, DataTableRow } from "./data-table.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Sprint", kind: "primary" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", numeric: true },
];

const rows: DataTableRow[] = [
  {
    id: "1",
    title: "Sprint 10",
    league: "Visual Systems",
    status: "open",
    deadline: "2026-05-06T12:00:00.000Z",
    score: 91,
  },
  {
    id: "2",
    title: "Sprint 2",
    league: "Audio Lab",
    status: "judging",
    deadline: "2026-05-02T12:00:00.000Z",
    score: 88,
  },
  {
    id: "3",
    title: "Sprint 1",
    league: "Visual Systems",
    status: "open",
    deadline: "2026-05-04T12:00:00.000Z",
    score: null,
  },
];

function visible(options: Partial<Parameters<typeof getVisibleRows>[0]> = {}): DataTableRow[] {
  return getVisibleRows({
    rows,
    columns,
    query: "",
    filter: null,
    filterKey: "status",
    searchKeys: ["title", "league"],
    sort: null,
    ...options,
  });
}

describe("dashboard data table utilities", () => {
  it("counts non-empty filter values without losing duplicate statuses", () => {
    expect(getFilterValues(rows, "status")).toEqual([
      ["open", 2],
      ["judging", 1],
    ]);
    expect(getFilterValues([...rows, { id: "4", status: "" }], "status")).toEqual([
      ["open", 2],
      ["judging", 1],
    ]);
  });

  it("applies exact status filters before trimmed case-insensitive search", () => {
    const result = visible({ filter: "open", query: " visual " });

    expect(result.map((row) => row.id)).toEqual(["1", "3"]);
  });

  it("treats whitespace-only search as a no-op", () => {
    expect(visible({ query: "   " }).map((row) => row.id)).toEqual(["1", "2", "3"]);
  });

  it("sorts titles naturally so Sprint 2 comes before Sprint 10", () => {
    const result = visible({ sort: { key: "title", dir: "asc" } });

    expect(result.map((row) => row.title)).toEqual(["Sprint 1", "Sprint 2", "Sprint 10"]);
  });

  it("sorts deadline columns chronologically", () => {
    const result = visible({ sort: { key: "deadline", dir: "asc" } });

    expect(result.map((row) => row.id)).toEqual(["2", "3", "1"]);
  });

  it("sorts scalar values without mutating the input rows", () => {
    const originalOrder = rows.map((row) => row.id);
    const result = visible({ sort: { key: "score", dir: "asc" } });

    expect(result.map((row) => row.id)).toEqual(["2", "1", "3"]);
    expect(rows.map((row) => row.id)).toEqual(originalOrder);
  });

  it("starts sorting ascending and toggles an active column descending", () => {
    const initial: SortState | null = null;
    const first = nextSortState(initial, "deadline");

    expect(first).toEqual({ key: "deadline", dir: "asc" });
    expect(nextSortState(first, "deadline")).toEqual({ key: "deadline", dir: "desc" });
    expect(nextSortState({ key: "title", dir: "desc" }, "deadline")).toEqual({
      key: "deadline",
      dir: "asc",
    });
  });
});
