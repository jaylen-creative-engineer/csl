import { describe, expect, it } from "vitest";
import {
  getFilterValues,
  getVisibleRows,
  nextSortState,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Title" },
  { key: "leagueName", label: "League" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", kind: "score" },
];

const rows: DataTableRow[] = [
  {
    id: "alpha",
    title: "Brand Sprint",
    leagueName: "Design League",
    status: "open",
    deadline: "Feb 1, 2026",
    score: 8,
  },
  {
    id: "beta",
    title: "Motion Pass",
    leagueName: "Video Lab",
    status: "judging",
    deadline: "Jan 20, 2026",
    score: 9,
  },
  {
    id: "gamma",
    title: "Archive Kit",
    leagueName: "Design League",
    status: "open",
    deadline: "Mar 1, 2026",
    score: 6,
  },
  {
    id: "delta",
    title: "Untallied Work",
    leagueName: "Open Lab",
    status: "",
  },
];

function visibleIds(args: Parameters<typeof getVisibleRows>[0]): string[] {
  return getVisibleRows(args).map((row) => row.id);
}

describe("dashboard data table utilities", () => {
  it("builds non-empty filter facets with counts in row order", () => {
    expect(getFilterValues(rows, "status")).toEqual([
      ["open", 2],
      ["judging", 1],
    ]);
    expect(getFilterValues(rows)).toEqual([]);
  });

  it("combines active filter and trimmed case-insensitive search across keys", () => {
    expect(
      visibleIds({
        rows,
        columns,
        query: "  DESIGN  ",
        searchKeys: ["title", "leagueName"],
        filterKey: "status",
        filter: "open",
        sort: null,
      }),
    ).toEqual(["alpha", "gamma"]);
  });

  it("sorts numeric values without mutating the source rows", () => {
    expect(
      visibleIds({
        rows,
        columns,
        query: "",
        filter: null,
        sort: { key: "score", dir: "asc" },
      }),
    ).toEqual(["gamma", "alpha", "beta", "delta"]);

    expect(rows.map((row) => row.id)).toEqual(["alpha", "beta", "gamma", "delta"]);
  });

  it("sorts deadline columns by parsed time instead of display string", () => {
    expect(
      visibleIds({
        rows,
        columns,
        query: "",
        filter: null,
        sort: { key: "deadline", dir: "asc" },
      }),
    ).toEqual(["beta", "alpha", "gamma", "delta"]);
  });

  it("toggles the active sort direction and starts new keys ascending", () => {
    expect(nextSortState(null, "score")).toEqual({ key: "score", dir: "asc" });
    expect(nextSortState({ key: "score", dir: "asc" }, "score")).toEqual({
      key: "score",
      dir: "desc",
    });
    expect(nextSortState({ key: "score", dir: "desc" }, "deadline")).toEqual({
      key: "deadline",
      dir: "asc",
    });
  });
});
