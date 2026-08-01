import { describe, expect, it } from "vitest";
import {
  compareDataTableValues,
  getFilterValues,
  getNextSortState,
  getVisibleRows,
} from "./data-table-utils.js";
import type { ColumnSpec, DataTableRow } from "./data-table-utils.js";

const rows: DataTableRow[] = [
  {
    id: "challenge-10",
    title: "Challenge 10",
    status: "open",
    owner: "Maya",
    deadline: "2026-02-10T12:00:00.000Z",
    score: 92.5,
  },
  {
    id: "challenge-2",
    title: "Challenge 2",
    status: "judging",
    owner: "Alex",
    deadline: "2026-02-02T12:00:00.000Z",
    score: 88,
  },
  {
    id: "challenge-1",
    title: "Challenge 1",
    status: "open",
    owner: "Jordan",
    deadline: "2026-02-01T12:00:00.000Z",
    score: null,
  },
];

const columns: ColumnSpec[] = [
  { key: "title", label: "Title" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", kind: "score", numeric: true },
];

function visibleIds(input: Partial<Parameters<typeof getVisibleRows>[0]> = {}) {
  return getVisibleRows({
    rows,
    columns,
    query: "",
    filter: null,
    sort: null,
    ...input,
  }).map((row) => row.id);
}

describe("dashboard data-table utilities", () => {
  it("counts non-empty filter values without collapsing case-distinct labels", () => {
    expect(
      getFilterValues([...rows, { id: "draft", status: "" }, { id: "case", status: "Open" }], "status"),
    ).toEqual([
      ["open", 2],
      ["judging", 1],
      ["Open", 1],
    ]);
  });

  it("applies exact filters before trimmed case-insensitive search", () => {
    expect(
      visibleIds({
        filterKey: "status",
        filter: "open",
        searchKeys: ["title", "owner"],
        query: "  maya  ",
      }),
    ).toEqual(["challenge-10"]);
  });

  it("does not search when only whitespace is provided", () => {
    expect(visibleIds({ searchKeys: ["title"], query: "   " })).toEqual([
      "challenge-10",
      "challenge-2",
      "challenge-1",
    ]);
  });

  it("sorts titles naturally instead of lexicographically", () => {
    expect(visibleIds({ sort: { key: "title", dir: "asc" } })).toEqual([
      "challenge-1",
      "challenge-2",
      "challenge-10",
    ]);
  });

  it("sorts deadline columns by timestamp", () => {
    expect(visibleIds({ sort: { key: "deadline", dir: "desc" } })).toEqual([
      "challenge-10",
      "challenge-2",
      "challenge-1",
    ]);
  });

  it("places null scalar values last for ascending sorts", () => {
    expect(visibleIds({ sort: { key: "score", dir: "asc" } })).toEqual([
      "challenge-2",
      "challenge-10",
      "challenge-1",
    ]);
  });

  it("returns a sorted copy without mutating source rows", () => {
    const sorted = getVisibleRows({
      rows,
      columns,
      query: "",
      filter: null,
      sort: { key: "title", dir: "asc" },
    });

    expect(sorted).not.toBe(rows);
    expect(rows.map((row) => row.id)).toEqual(["challenge-10", "challenge-2", "challenge-1"]);
  });

  it("toggles an existing sort key and starts new keys ascending", () => {
    expect(getNextSortState(null, "title")).toEqual({ key: "title", dir: "asc" });
    expect(getNextSortState({ key: "title", dir: "asc" }, "title")).toEqual({
      key: "title",
      dir: "desc",
    });
    expect(getNextSortState({ key: "title", dir: "desc" }, "status")).toEqual({
      key: "status",
      dir: "asc",
    });
  });

  it("compares strings case-insensitively with numeric ordering", () => {
    expect(compareDataTableValues("Sprint 2", "sprint 10")).toBeLessThan(0);
    expect(compareDataTableValues("ALPHA", "alpha")).toBe(0);
  });
});
