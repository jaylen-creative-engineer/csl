import { describe, expect, it } from "vitest";
import {
  getDataTableFilterValues,
  getVisibleDataTableRows,
  nextDataTableSort,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Sprint", kind: "primary" },
  { key: "leagueName", label: "League" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Closes", kind: "deadline", numeric: true },
  { key: "score", label: "Score", kind: "score", numeric: true },
];

const rows: DataTableRow[] = [
  {
    id: "row:1",
    title: "Sprint 10",
    leagueName: "Motion Lab",
    status: "open",
    deadline: "2026-08-20T10:00:00.000Z",
    score: 78.2,
  },
  {
    id: "row:2",
    title: "Sprint 2",
    leagueName: "Brand Studio",
    status: "judging",
    deadline: "2026-08-15T10:00:00.000Z",
    score: 91.4,
  },
  {
    id: "row:3",
    title: "Sprint 1",
    leagueName: "Motion Lab",
    status: "open",
    deadline: "2026-08-18T10:00:00.000Z",
    score: 85,
  },
  {
    id: "row:4",
    title: "Archived sprint",
    leagueName: "Vault",
    status: "",
    deadline: "2026-08-10T10:00:00.000Z",
    score: null,
  },
];

function ids(visibleRows: DataTableRow[]) {
  return visibleRows.map((row) => row.id);
}

describe("DataTable view utilities", () => {
  it("counts filter values in row order while ignoring blank values", () => {
    expect(getDataTableFilterValues(rows, "status")).toEqual([
      ["open", 2],
      ["judging", 1],
    ]);
  });

  it("applies exact filters before trimmed case-insensitive search", () => {
    const visible = getVisibleDataTableRows({
      columns,
      rows,
      filterKey: "status",
      filter: "open",
      query: "  motion  ",
      searchKeys: ["title", "leagueName"],
    });

    expect(ids(visible)).toEqual(["row:1", "row:3"]);
  });

  it("treats whitespace-only searches as no-ops", () => {
    const visible = getVisibleDataTableRows({
      columns,
      rows,
      query: "   ",
      searchKeys: ["title"],
    });

    expect(visible).toBe(rows);
  });

  it("sorts text with natural numeric ordering without mutating the source rows", () => {
    const visible = getVisibleDataTableRows({
      columns,
      rows,
      sort: { key: "title", dir: "asc" },
    });

    expect(ids(visible)).toEqual(["row:4", "row:3", "row:2", "row:1"]);
    expect(ids(rows)).toEqual(["row:1", "row:2", "row:3", "row:4"]);
  });

  it("sorts deadline columns chronologically in the requested direction", () => {
    const ascending = getVisibleDataTableRows({
      columns,
      rows,
      sort: { key: "deadline", dir: "asc" },
    });
    const descending = getVisibleDataTableRows({
      columns,
      rows,
      sort: { key: "deadline", dir: "desc" },
    });

    expect(ids(ascending)).toEqual(["row:4", "row:2", "row:3", "row:1"]);
    expect(ids(descending)).toEqual(["row:1", "row:3", "row:2", "row:4"]);
  });

  it("places null scalar values last for ascending score sorts", () => {
    const visible = getVisibleDataTableRows({
      columns,
      rows,
      sort: { key: "score", dir: "asc" },
    });

    expect(ids(visible)).toEqual(["row:1", "row:3", "row:2", "row:4"]);
  });

  it("toggles the active sort direction and starts new columns ascending", () => {
    expect(nextDataTableSort(null, "title")).toEqual({ key: "title", dir: "asc" });
    expect(nextDataTableSort({ key: "title", dir: "asc" }, "title")).toEqual({
      key: "title",
      dir: "desc",
    });
    expect(nextDataTableSort({ key: "title", dir: "desc" }, "deadline")).toEqual({
      key: "deadline",
      dir: "asc",
    });
  });
});
