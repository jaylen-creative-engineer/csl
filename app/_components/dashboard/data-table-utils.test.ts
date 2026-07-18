import { describe, expect, it } from "vitest";
import {
  getFilterCounts,
  getVisibleRows,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const rows: DataTableRow[] = [
  {
    id: "challenge-10",
    title: "Sprint 10",
    subtitle: "Brand system",
    status: "open",
    deadline: "2026-01-10T00:00:00.000Z",
    score: 9.1,
  },
  {
    id: "challenge-2",
    title: "Sprint 2",
    subtitle: "Motion study",
    status: "judging",
    deadline: "2026-01-02T00:00:00.000Z",
    score: 7.4,
  },
  {
    id: "challenge-1",
    title: "Sprint 1",
    subtitle: "Brand sprint",
    status: "open",
    deadline: "2026-01-05T00:00:00.000Z",
    score: 8.2,
  },
  {
    id: "challenge-empty-status",
    title: "Sprint 11",
    subtitle: "Archive",
    status: "",
    deadline: "2026-01-11T00:00:00.000Z",
    score: 0,
  },
];

const columns: ColumnSpec[] = [
  { key: "title", label: "Sprint" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", numeric: true },
];

function ids(visibleRows: DataTableRow[]): string[] {
  return visibleRows.map((row) => row.id);
}

describe("data-table utils", () => {
  it("counts non-empty filter values in row order", () => {
    expect(getFilterCounts(rows, "status")).toEqual([
      ["open", 2],
      ["judging", 1],
    ]);
  });

  it("combines status filtering with trimmed case-insensitive search", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      filterKey: "status",
      filter: "open",
      query: " BRAND ",
      searchKeys: ["title", "subtitle"],
      sort: null,
    });

    expect(ids(visible)).toEqual(["challenge-10", "challenge-1"]);
  });

  it("sorts strings naturally without mutating the source rows", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      filterKey: undefined,
      filter: null,
      query: "",
      searchKeys: ["title"],
      sort: { key: "title", dir: "asc" },
    });

    expect(ids(visible)).toEqual([
      "challenge-1",
      "challenge-2",
      "challenge-10",
      "challenge-empty-status",
    ]);
    expect(ids(rows)).toEqual([
      "challenge-10",
      "challenge-2",
      "challenge-1",
      "challenge-empty-status",
    ]);
  });

  it("sorts deadline columns by time instead of display text", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      filterKey: undefined,
      filter: null,
      query: "",
      searchKeys: ["title"],
      sort: { key: "deadline", dir: "asc" },
    });

    expect(ids(visible)).toEqual([
      "challenge-2",
      "challenge-1",
      "challenge-10",
      "challenge-empty-status",
    ]);
  });
});
