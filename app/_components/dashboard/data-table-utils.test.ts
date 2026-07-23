import { describe, expect, it } from "vitest";
import {
  getFilterValues,
  getVisibleRows,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Sprint", kind: "primary" },
  { key: "leagueName", label: "League" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Closes", kind: "deadline" },
  { key: "rank", label: "Rank" },
];

const rows: DataTableRow[] = [
  {
    id: "sprint-10",
    title: "Sprint 10",
    leagueName: "Audio League",
    status: "open",
    deadline: "2026-06-10T10:00:00.000Z",
    rank: 10,
  },
  {
    id: "sprint-2",
    title: "Sprint 2",
    leagueName: "Visual League",
    status: "judging",
    deadline: "2026-06-02T10:00:00.000Z",
    rank: 2,
  },
  {
    id: "sprint-1",
    title: "Sprint 1",
    leagueName: "Audio League",
    status: "open",
    deadline: "2026-06-01T10:00:00.000Z",
    rank: 1,
  },
  {
    id: "sprint-empty-status",
    title: "Sprint 99",
    leagueName: "Archive League",
    status: "",
    deadline: "2026-05-01T10:00:00.000Z",
    rank: 99,
  },
];

function ids(visibleRows: DataTableRow[]): string[] {
  return visibleRows.map((row) => row.id);
}

describe("dashboard data table utilities", () => {
  it("counts non-empty filter values in the order they first appear", () => {
    expect(getFilterValues(rows, "status")).toEqual([
      ["open", 2],
      ["judging", 1],
    ]);
  });

  it("combines exact status filtering with trimmed case-insensitive search", () => {
    const visibleRows = getVisibleRows({
      columns,
      rows,
      filterKey: "status",
      filter: "open",
      query: " audio ",
      searchKeys: ["title", "leagueName"],
      sort: null,
    });

    expect(ids(visibleRows)).toEqual(["sprint-10", "sprint-1"]);
  });

  it("uses natural string ordering for sprint titles", () => {
    const visibleRows = getVisibleRows({
      columns,
      rows,
      filter: null,
      query: "",
      searchKeys: ["title"],
      sort: { key: "title", dir: "asc" },
    });

    expect(ids(visibleRows)).toEqual([
      "sprint-1",
      "sprint-2",
      "sprint-10",
      "sprint-empty-status",
    ]);
  });

  it("sorts deadline columns chronologically instead of lexically", () => {
    const visibleRows = getVisibleRows({
      columns,
      rows,
      filter: null,
      query: "",
      sort: { key: "deadline", dir: "desc" },
    });

    expect(ids(visibleRows)).toEqual([
      "sprint-10",
      "sprint-2",
      "sprint-1",
      "sprint-empty-status",
    ]);
  });
});
