import { describe, expect, it } from "vitest";
import {
  getFilterValues,
  getNextSort,
  getVisibleRows,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Sprint" },
  { key: "status", label: "Status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", numeric: true },
];

const rows: DataTableRow[] = [
  {
    id: "zine-2",
    title: "Zine 2",
    status: "open",
    deadline: "2026-04-02T12:00:00.000Z",
    score: 7.5,
    handle: "Alpha",
  },
  {
    id: "zine-10",
    title: "zine 10",
    status: "closed",
    deadline: "2026-03-30T12:00:00.000Z",
    score: 4,
    handle: "Beta",
  },
  {
    id: "poster",
    title: "Poster Sprint",
    status: "open",
    deadline: "2026-04-01T12:00:00.000Z",
    score: null,
    handle: "Gamma",
  },
];

describe("data table utilities", () => {
  it("counts non-empty filter values in first-seen order", () => {
    expect(getFilterValues([...rows, { id: "empty-status", status: "" }], "status")).toEqual([
      ["open", 2],
      ["closed", 1],
    ]);
  });

  it("combines exact filters with trimmed case-insensitive search", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      searchKeys: ["title", "handle"],
      filterKey: "status",
      filter: "open",
      query: " zInE ",
      sort: null,
    });

    expect(visible.map((row) => row.id)).toEqual(["zine-2"]);
  });

  it("treats whitespace-only searches as a no-op", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      searchKeys: ["title"],
      query: "   ",
      filter: null,
      sort: null,
    });

    expect(visible).toBe(rows);
  });

  it("sorts natural strings case-insensitively", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      query: "",
      filter: null,
      sort: { key: "title", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["poster", "zine-2", "zine-10"]);
  });

  it("sorts dates chronologically without mutating source rows", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      query: "",
      filter: null,
      sort: { key: "deadline", dir: "asc" },
    });

    expect(visible).not.toBe(rows);
    expect(visible.map((row) => row.id)).toEqual(["zine-10", "poster", "zine-2"]);
    expect(rows.map((row) => row.id)).toEqual(["zine-2", "zine-10", "poster"]);
  });

  it("places null scalar values last in ascending sorts", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      query: "",
      filter: null,
      sort: { key: "score", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["zine-10", "zine-2", "poster"]);
  });

  it("toggles the active sort direction and starts new keys ascending", () => {
    expect(getNextSort(null, "title")).toEqual({ key: "title", dir: "asc" });
    expect(getNextSort({ key: "title", dir: "asc" }, "title")).toEqual({
      key: "title",
      dir: "desc",
    });
    expect(getNextSort({ key: "title", dir: "desc" }, "deadline")).toEqual({
      key: "deadline",
      dir: "asc",
    });
  });
});
