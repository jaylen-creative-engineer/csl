import { describe, expect, it } from "vitest";
import {
  getFilterValues,
  getVisibleRows,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Sprint", kind: "primary" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", kind: "score", numeric: true },
];

const rows: DataTableRow[] = [
  {
    id: "late-brand",
    title: "Brand Sprint 10",
    maker: "Alex",
    status: "active",
    deadline: "2026-07-20T12:00:00.000Z",
    score: 89,
  },
  {
    id: "early-brand",
    title: "Brand Sprint 2",
    maker: "Jordan",
    status: "active",
    deadline: "2026-07-12T12:00:00.000Z",
    score: 94,
  },
  {
    id: "closed-motion",
    title: "Motion Sprint",
    maker: "Casey",
    status: "closed",
    deadline: "2026-07-10T12:00:00.000Z",
    score: 71,
  },
  {
    id: "missing-status",
    title: "Archive",
    maker: "Morgan",
    deadline: "2026-07-18T12:00:00.000Z",
    score: null,
  },
];

describe("dashboard data table helpers", () => {
  it("counts non-empty filter values without inventing missing buckets", () => {
    expect(getFilterValues(rows, "status")).toEqual([
      ["active", 2],
      ["closed", 1],
    ]);
  });

  it("filters, searches across configured keys, and date-sorts the visible rows", () => {
    const visible = getVisibleRows({
      columns,
      rows,
      searchKeys: ["title", "maker"],
      filterKey: "status",
      filter: "active",
      query: " brand ",
      sort: { key: "deadline", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["early-brand", "late-brand"]);
  });

  it("uses numeric-aware string sorting for sprint names", () => {
    const visible = getVisibleRows({
      columns,
      rows,
      searchKeys: ["title"],
      filterKey: undefined,
      filter: null,
      query: "sprint",
      sort: { key: "title", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual([
      "early-brand",
      "late-brand",
      "closed-motion",
    ]);
  });

  it("keeps source rows in their original order when sorting", () => {
    const originalOrder = rows.map((row) => row.id);

    const visible = getVisibleRows({
      columns,
      rows,
      searchKeys: undefined,
      filterKey: undefined,
      filter: null,
      query: "",
      sort: { key: "score", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual([
      "closed-motion",
      "late-brand",
      "early-brand",
      "missing-status",
    ]);
    expect(rows.map((row) => row.id)).toEqual(originalOrder);
  });
});
