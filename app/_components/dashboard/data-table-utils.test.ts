import { describe, expect, it } from "vitest";
import {
  compareDataTableValues,
  getDataTableFilterValues,
  getVisibleDataTableRows,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Sprint", kind: "primary" },
  { key: "leagueName", label: "League" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Closes", kind: "deadline" },
  { key: "score", label: "Score", kind: "score", numeric: true },
];

const rows: DataTableRow[] = [
  {
    id: "row:brand-2",
    title: "Brand 2",
    leagueName: "North League",
    status: "open",
    deadline: "2026-01-03T00:00:00.000Z",
    score: 8.5,
  },
  {
    id: "row:brand-10",
    title: "Brand 10",
    leagueName: "South League",
    status: "judging",
    deadline: "2026-01-01T00:00:00.000Z",
    score: null,
  },
  {
    id: "row:poster",
    title: "Poster Sprint",
    leagueName: "North League",
    status: "open",
    deadline: "2026-01-02T00:00:00.000Z",
    score: 10,
  },
  {
    id: "row:motion",
    title: "Motion Sprint",
    status: "",
    deadline: "2026-01-04T00:00:00.000Z",
    score: 7,
  },
];

describe("data table utilities", () => {
  it("builds filter chip counts while omitting empty filter values", () => {
    expect(getDataTableFilterValues(rows, "status")).toEqual([
      ["open", 2],
      ["judging", 1],
    ]);
    expect(getDataTableFilterValues(rows)).toEqual([]);
  });

  it("filters and searches rows without mutating the source order", () => {
    const visible = getVisibleDataTableRows({
      columns,
      rows,
      filterKey: "status",
      filter: "open",
      searchKeys: ["title", "leagueName"],
      query: " north ",
      sort: null,
    });

    expect(visible.map((row) => row.id)).toEqual(["row:brand-2", "row:poster"]);
    expect(rows.map((row) => row.id)).toEqual([
      "row:brand-2",
      "row:brand-10",
      "row:poster",
      "row:motion",
    ]);
  });

  it("sorts date-like columns chronologically for dashboard deadline views", () => {
    const visible = getVisibleDataTableRows({
      columns,
      rows,
      filter: null,
      query: "",
      sort: { key: "deadline", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual([
      "row:brand-10",
      "row:poster",
      "row:brand-2",
      "row:motion",
    ]);
  });

  it("uses natural string ordering and keeps null values last in ascending sorts", () => {
    expect(compareDataTableValues("Brand 2", "Brand 10")).toBeLessThan(0);

    const asc = getVisibleDataTableRows({
      columns,
      rows,
      filter: null,
      query: "",
      sort: { key: "score", dir: "asc" },
    });
    expect(asc.map((row) => row.id)).toEqual([
      "row:motion",
      "row:brand-2",
      "row:poster",
      "row:brand-10",
    ]);
  });
});
