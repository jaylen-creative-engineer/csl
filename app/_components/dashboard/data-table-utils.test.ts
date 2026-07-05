import { describe, expect, it } from "vitest";
import {
  compareDataTableValues,
  filterAndSortDataTableRows,
  getDataTableFilterValues,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Sprint" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", kind: "score", numeric: true },
];

const rows: DataTableRow[] = [
  {
    id: "brand",
    title: "Brand Sprint",
    participant: "Alex",
    status: "open",
    deadline: "2026-07-07T10:00:00.000Z",
    score: 91,
  },
  {
    id: "motion",
    title: "Motion Study",
    participant: "Blair",
    status: "judging",
    deadline: "2026-07-06T10:00:00.000Z",
    score: 95,
  },
  {
    id: "logo",
    title: "Logo Kit",
    participant: "Casey",
    status: "open",
    deadline: "2026-07-08T10:00:00.000Z",
    score: null,
  },
  {
    id: "packaging",
    title: "Packaging System",
    participant: "Blair",
    status: "open",
    deadline: "2026-07-05T22:00:00.000Z",
    score: 80,
  },
];

describe("compareDataTableValues", () => {
  it("sorts nullish values after populated values", () => {
    expect(compareDataTableValues(null, null)).toBe(0);
    expect(compareDataTableValues(null, "open")).toBeGreaterThan(0);
    expect(compareDataTableValues("open", undefined)).toBeLessThan(0);
  });

  it("uses numeric ordering for numbers and natural ordering for strings", () => {
    expect(compareDataTableValues(10, 2)).toBe(8);
    expect(compareDataTableValues("Sprint 2", "sprint 10")).toBeLessThan(0);
  });
});

describe("getDataTableFilterValues", () => {
  it("counts non-empty filter values in row order", () => {
    expect(getDataTableFilterValues(rows, "status")).toEqual([
      ["open", 3],
      ["judging", 1],
    ]);
  });

  it("returns no filters when no filter key is configured", () => {
    expect(getDataTableFilterValues(rows)).toEqual([]);
  });
});

describe("filterAndSortDataTableRows", () => {
  it("combines exact filters with trimmed case-insensitive search", () => {
    const visible = filterAndSortDataTableRows({
      rows,
      columns,
      filterKey: "status",
      filter: "open",
      query: "  blair  ",
      searchKeys: ["title", "participant"],
    });

    expect(visible.map((row) => row.id)).toEqual(["packaging"]);
  });

  it("coerces deadline and date columns before sorting", () => {
    const visible = filterAndSortDataTableRows({
      rows,
      columns,
      filterKey: "status",
      filter: "open",
      sort: { key: "deadline", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["packaging", "brand", "logo"]);
  });

  it("does not mutate the caller's row order when sorting", () => {
    const visible = filterAndSortDataTableRows({
      rows,
      columns,
      sort: { key: "score", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["packaging", "brand", "motion", "logo"]);
    expect(rows.map((row) => row.id)).toEqual(["brand", "motion", "logo", "packaging"]);
  });
});
