import { describe, expect, it } from "vitest";
import {
  compareTableValues,
  getFilterCounts,
  getVisibleRows,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const rows: DataTableRow[] = [
  {
    id: "1",
    title: "Sprint 10",
    league: "Chicago Makers",
    status: "open",
    deadline: "12/31/2026",
    score: 88,
  },
  {
    id: "2",
    title: "Sprint 2",
    league: "Detroit Design",
    status: "judging",
    deadline: "2/1/2026",
    score: 91,
  },
  {
    id: "3",
    title: "Portfolio Review",
    league: "Chicago Makers",
    status: "open",
    deadline: "6/15/2026",
    score: null,
  },
];

const columns: ColumnSpec[] = [
  { key: "title", label: "Challenge", kind: "primary" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", numeric: true },
];

describe("dashboard data table utilities", () => {
  it("counts non-empty filter values without collapsing distinct statuses", () => {
    const counts = getFilterCounts(
      [...rows, { id: "4", status: "" }, { id: "5", status: null }],
      "status",
    );

    expect(counts).toEqual([
      ["open", 2],
      ["judging", 1],
    ]);
  });

  it("filters and searches rows with trimmed, case-insensitive matching across configured keys", () => {
    const visible = getVisibleRows({
      columns,
      rows,
      filterKey: "status",
      filter: "open",
      query: "  chicago  ",
      searchKeys: ["title", "league"],
      sort: null,
    });

    expect(visible.map((row) => row.id)).toEqual(["1", "3"]);
  });

  it("sorts strings with natural numeric ordering and nulls last in ascending order", () => {
    const visible = getVisibleRows({
      columns,
      rows,
      query: "",
      filter: null,
      searchKeys: ["title"],
      sort: { key: "title", dir: "asc" },
    });

    expect(visible.map((row) => row.title)).toEqual([
      "Portfolio Review",
      "Sprint 2",
      "Sprint 10",
    ]);
    expect(compareTableValues(null, "Sprint 1")).toBeGreaterThan(0);
  });

  it("sorts deadline columns by parsed time instead of lexicographic text", () => {
    const visible = getVisibleRows({
      columns,
      rows,
      query: "",
      filter: null,
      searchKeys: ["title"],
      sort: { key: "deadline", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["2", "3", "1"]);
  });
});
