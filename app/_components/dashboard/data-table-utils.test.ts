import { describe, expect, it } from "vitest";
import {
  getFilterValues,
  getVisibleRows,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Sprint" },
  { key: "status", label: "Status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", kind: "score", numeric: true },
];

const rows: DataTableRow[] = [
  {
    id: "alpha",
    title: "Sprint 10",
    owner: "Maya",
    status: "active",
    deadline: "2030-01-03T00:00:00.000Z",
    score: 9.5,
  },
  {
    id: "beta",
    title: "Sprint 2",
    owner: "Jaylen",
    status: "draft",
    deadline: "2029-12-31T00:00:00.000Z",
    score: 7,
  },
  {
    id: "gamma",
    title: "Portfolio Review",
    owner: "Alex",
    status: "active",
    deadline: "2030-01-02T00:00:00.000Z",
    score: null,
  },
  {
    id: "delta",
    title: "Unscheduled",
    owner: null,
    status: "",
    deadline: null,
    score: 8,
  },
];

describe("dashboard data table utilities", () => {
  it("counts available filter values and skips blank values", () => {
    expect(getFilterValues(rows, "status")).toEqual([
      ["active", 2],
      ["draft", 1],
    ]);
  });

  it("applies filter and case-insensitive search across configured fields", () => {
    const visible = getVisibleRows({
      columns,
      rows,
      filterKey: "status",
      filter: "active",
      searchKeys: ["title", "owner"],
      query: " maya ",
    });

    expect(visible.map((row) => row.id)).toEqual(["alpha"]);
  });

  it("sorts numeric values ascending with empty values last", () => {
    const visible = getVisibleRows({
      columns,
      rows,
      sort: { key: "score", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["beta", "delta", "alpha", "gamma"]);
  });

  it("sorts deadlines by timestamp instead of formatted string order", () => {
    const visible = getVisibleRows({
      columns,
      rows: rows.slice(0, 3),
      sort: { key: "deadline", dir: "desc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["alpha", "gamma", "beta"]);
  });

  it("uses natural string sorting for numbered sprint titles", () => {
    const visible = getVisibleRows({
      columns,
      rows: rows.slice(0, 2),
      sort: { key: "title", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["beta", "alpha"]);
  });
});
