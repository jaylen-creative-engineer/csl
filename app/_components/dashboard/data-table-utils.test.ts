import { describe, expect, it } from "vitest";
import {
  getDataTableFilterValues,
  getVisibleDataTableRows,
  nextDataTableSort,
} from "./data-table-utils.js";
import type { ColumnSpec, DataTableRow } from "./data-table.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Title", kind: "primary" },
  { key: "status", label: "Status", kind: "status" },
  { key: "score", label: "Score", kind: "score" },
  { key: "submittedAt", label: "Submitted", kind: "date" },
];

const rows: DataTableRow[] = [
  {
    id: "row-1",
    title: "Poster Sprint 10",
    owner: "Mina",
    status: "open",
    score: 10,
    submittedAt: "2026-03-01T10:00:00.000Z",
  },
  {
    id: "row-2",
    title: "Poster Sprint 2",
    owner: "Noor",
    status: "closed",
    score: 2,
    submittedAt: "2026-03-01T09:00:00.000Z",
  },
  {
    id: "row-3",
    title: "Motion Sprint",
    owner: "Alex",
    status: "open",
    score: 30,
    submittedAt: "2026-03-02T08:00:00.000Z",
  },
  {
    id: "row-4",
    title: "Empty Status",
    owner: "Riley",
    status: "",
    score: null,
    submittedAt: "2026-02-28T12:00:00.000Z",
  },
];

describe("dashboard data table helpers", () => {
  it("counts non-empty filter values in row order", () => {
    expect(getDataTableFilterValues(rows, "status")).toEqual([
      ["open", 2],
      ["closed", 1],
    ]);
  });

  it("combines filter and trimmed case-insensitive search across configured keys", () => {
    const visible = getVisibleDataTableRows({
      rows,
      columns,
      filterKey: "status",
      filter: "open",
      query: "  alex  ",
      searchKeys: ["title", "owner"],
    });

    expect(visible.map((row) => row.id)).toEqual(["row-3"]);
  });

  it("sorts numeric columns by numeric value instead of string order", () => {
    const visible = getVisibleDataTableRows({
      rows,
      columns,
      sort: { key: "score", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["row-2", "row-1", "row-3", "row-4"]);
  });

  it("sorts date columns newest first when requested", () => {
    const visible = getVisibleDataTableRows({
      rows,
      columns,
      sort: { key: "submittedAt", dir: "desc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["row-3", "row-1", "row-2", "row-4"]);
  });

  it("cycles sort state from new key asc to same key desc", () => {
    const firstSort = nextDataTableSort(null, "score");
    const secondSort = nextDataTableSort(firstSort, "score");
    const switchedSort = nextDataTableSort(secondSort, "title");

    expect(firstSort).toEqual({ key: "score", dir: "asc" });
    expect(secondSort).toEqual({ key: "score", dir: "desc" });
    expect(switchedSort).toEqual({ key: "title", dir: "asc" });
  });
});
