import { describe, expect, it } from "vitest";
import {
  getFilterValues,
  getVisibleRows,
  nextSortForKey,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Title" },
  { key: "status", label: "Status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", numeric: true },
];

const rows: DataTableRow[] = [
  {
    id: "row-1",
    title: "Sprint 2",
    status: "open",
    owner: "Nia",
    deadline: "2026-07-24T12:00:00.000Z",
    score: 8.5,
  },
  {
    id: "row-2",
    title: "Sprint 10",
    status: "judging",
    owner: "Kai",
    deadline: "2026-07-25T12:00:00.000Z",
    score: 9.1,
  },
  {
    id: "row-3",
    title: "Sprint 1",
    status: "open",
    owner: "Ari",
    deadline: "2026-07-23T12:00:00.000Z",
    score: 7.25,
  },
];

function visibleIds(options: Partial<Parameters<typeof getVisibleRows>[0]> = {}) {
  return getVisibleRows({
    columns,
    rows,
    query: "",
    filter: null,
    filterKey: undefined,
    searchKeys: undefined,
    sort: null,
    ...options,
  }).map((row) => row.id);
}

describe("dashboard data-table utilities", () => {
  it("counts non-empty filter values in first-seen order", () => {
    expect(getFilterValues([...rows, { id: "row-4", title: "Untyped" }], "status")).toEqual([
      ["open", 2],
      ["judging", 1],
    ]);
  });

  it("filters rows by exact filter value", () => {
    expect(visibleIds({ filterKey: "status", filter: "open" })).toEqual(["row-1", "row-3"]);
  });

  it("searches trimmed query text case-insensitively across configured keys", () => {
    expect(visibleIds({ query: "  KAI  ", searchKeys: ["title", "owner"] })).toEqual(["row-2"]);
  });

  it("sorts date-like columns chronologically", () => {
    expect(visibleIds({ sort: { key: "deadline", dir: "asc" } })).toEqual([
      "row-3",
      "row-1",
      "row-2",
    ]);
  });

  it("sorts title strings with natural numeric ordering", () => {
    expect(visibleIds({ sort: { key: "title", dir: "asc" } })).toEqual([
      "row-3",
      "row-1",
      "row-2",
    ]);
  });

  it("sorts numeric values descending without mutating the original rows", () => {
    const sorted = getVisibleRows({
      columns,
      rows,
      query: "",
      filter: null,
      sort: { key: "score", dir: "desc" },
    });

    expect(sorted.map((row) => row.id)).toEqual(["row-2", "row-1", "row-3"]);
    expect(rows.map((row) => row.id)).toEqual(["row-1", "row-2", "row-3"]);
  });

  it("places nullish values after populated values in ascending sorts", () => {
    expect(
      visibleIds({
        rows: [
          { id: "row-missing", title: null },
          { id: "row-alpha", title: "Alpha" },
        ],
        sort: { key: "title", dir: "asc" },
      }),
    ).toEqual(["row-alpha", "row-missing"]);
  });

  it("toggles sort direction for the active key and resets new keys to ascending", () => {
    expect(nextSortForKey(null, "title")).toEqual({ key: "title", dir: "asc" });
    expect(nextSortForKey({ key: "title", dir: "asc" }, "title")).toEqual({
      key: "title",
      dir: "desc",
    });
    expect(nextSortForKey({ key: "title", dir: "desc" }, "deadline")).toEqual({
      key: "deadline",
      dir: "asc",
    });
  });
});
