import { describe, expect, it } from "vitest";
import {
  deriveVisibleRows,
  getFilterCounts,
  nextSortState,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Sprint", kind: "primary" },
  { key: "leagueName", label: "League" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "topScore", label: "Top score", kind: "score", numeric: true },
];

const rows: DataTableRow[] = [
  {
    id: "sprint-10",
    title: "Sprint 10",
    leagueName: "Beta League",
    status: "judging",
    deadline: "2026-08-14T12:00:00.000Z",
    topScore: 91,
  },
  {
    id: "portfolio",
    title: "Portfolio Sprint",
    leagueName: "Alpha League",
    status: "open",
    deadline: "2026-08-13T12:00:00.000Z",
    topScore: 72,
  },
  {
    id: "sprint-2",
    title: "Sprint 2",
    leagueName: "Alpha League",
    status: "open",
    deadline: "2026-08-12T12:00:00.000Z",
    topScore: 84,
  },
];

function visibleIds(options: Partial<Parameters<typeof deriveVisibleRows>[0]> = {}) {
  return deriveVisibleRows({
    rows,
    columns,
    query: "",
    filter: null,
    filterKey: undefined,
    searchKeys: undefined,
    sort: null,
    ...options,
  }).map((row) => row.id);
}

describe("dashboard data table utilities", () => {
  it("builds stable exact-value filter counts and skips empty filter values", () => {
    expect(getFilterCounts([...rows, { id: "draft", status: "" }], "status")).toEqual([
      ["judging", 1],
      ["open", 2],
    ]);
  });

  it("combines exact filters with trimmed case-insensitive search across configured keys", () => {
    expect(
      visibleIds({
        filterKey: "status",
        filter: "open",
        searchKeys: ["title", "leagueName"],
        query: " alpha ",
      }),
    ).toEqual(["portfolio", "sprint-2"]);
  });

  it("treats whitespace-only search as a no-op", () => {
    expect(visibleIds({ searchKeys: ["title"], query: "   " })).toEqual([
      "sprint-10",
      "portfolio",
      "sprint-2",
    ]);
  });

  it("sorts text with natural numeric ordering", () => {
    expect(visibleIds({ sort: { key: "title", dir: "asc" } })).toEqual([
      "portfolio",
      "sprint-2",
      "sprint-10",
    ]);
  });

  it("sorts deadline columns chronologically", () => {
    expect(visibleIds({ sort: { key: "deadline", dir: "asc" } })).toEqual([
      "sprint-2",
      "portfolio",
      "sprint-10",
    ]);
  });

  it("sorts numeric columns without mutating the source rows", () => {
    expect(visibleIds({ sort: { key: "topScore", dir: "desc" } })).toEqual([
      "sprint-10",
      "sprint-2",
      "portfolio",
    ]);
    expect(rows.map((row) => row.id)).toEqual(["sprint-10", "portfolio", "sprint-2"]);
  });

  it("starts new sort keys ascending and toggles the active key direction", () => {
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
