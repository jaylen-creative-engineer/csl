import { describe, expect, it } from "vitest";
import { collectFilterValues, getVisibleRows } from "./data-table-utils.js";
import type { ColumnSpec, DataTableRow } from "./data-table.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Challenge", kind: "primary" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", kind: "score" },
];

const rows: DataTableRow[] = [
  {
    id: "row-1",
    title: "Brand Sprint",
    leagueName: "Design League",
    status: "open",
    deadline: "2026-07-12T12:00:00.000Z",
    score: 84.5,
  },
  {
    id: "row-2",
    title: "Motion Lab",
    leagueName: "Animation League",
    status: "judging",
    deadline: "2026-07-09T12:00:00.000Z",
    score: 91,
  },
  {
    id: "row-3",
    title: "Poster Systems",
    leagueName: "Design League",
    status: "open",
    deadline: "2026-07-15T12:00:00.000Z",
    score: 72,
  },
  {
    id: "row-4",
    title: "Unscheduled Draft",
    leagueName: "Ops League",
    status: "",
    deadline: null,
    score: null,
  },
];

const populatedRows = rows.slice(0, 3);

describe("dashboard data table utilities", () => {
  it("counts only meaningful filter values in first-seen order", () => {
    expect(collectFilterValues(rows, "status")).toEqual([
      ["open", 2],
      ["judging", 1],
    ]);
  });

  it("combines exact filter matching with trimmed case-insensitive search", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      query: "  design  ",
      filterKey: "status",
      filter: "open",
      searchKeys: ["title", "leagueName"],
      sort: null,
    });

    expect(visible.map((row) => row.id)).toEqual(["row-1", "row-3"]);
  });

  it("sorts date-like columns chronologically without mutating the source rows", () => {
    const visible = getVisibleRows({
      rows: populatedRows,
      columns,
      query: "",
      filter: null,
      searchKeys: ["title"],
      sort: { key: "deadline", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["row-2", "row-1", "row-3"]);
    expect(rows.map((row) => row.id)).toEqual(["row-1", "row-2", "row-3", "row-4"]);
  });

  it("sorts numeric score columns in descending order for leaderboard-style tables", () => {
    const visible = getVisibleRows({
      rows: populatedRows,
      columns,
      query: "",
      filter: null,
      searchKeys: ["title"],
      sort: { key: "score", dir: "desc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["row-2", "row-1", "row-3"]);
  });
});
