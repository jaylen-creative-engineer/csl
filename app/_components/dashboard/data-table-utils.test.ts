import { describe, expect, it } from "vitest";
import {
  deriveVisibleRows,
  getFilterValues,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Sprint", kind: "primary" },
  { key: "leagueName", label: "League" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", kind: "score" },
];

const rows: DataTableRow[] = [
  {
    id: "brand",
    title: "Brand System Sprint",
    leagueName: "Design League",
    status: "open",
    deadline: "2026-04-20T12:00:00.000Z",
    score: 82.4,
  },
  {
    id: "motion",
    title: "Motion Identity",
    leagueName: "Film League",
    status: "judging",
    deadline: "2026-04-18T12:00:00.000Z",
    score: 91.2,
  },
  {
    id: "editorial",
    title: "Editorial Campaign",
    leagueName: "Design League",
    status: "open",
    deadline: "2026-04-22T12:00:00.000Z",
    score: 74.8,
  },
  {
    id: "archive",
    title: "Archive Refresh",
    leagueName: "History League",
    status: "closed",
    deadline: "2026-04-16T12:00:00.000Z",
    score: null,
  },
];

describe("dashboard data table utilities", () => {
  it("counts non-empty filter values without collapsing distinct statuses", () => {
    expect(getFilterValues(rows, "status")).toEqual([
      ["open", 2],
      ["judging", 1],
      ["closed", 1],
    ]);
  });

  it("filters by status and searches across configured keys", () => {
    const visible = deriveVisibleRows({
      rows,
      columns,
      query: " design ",
      filter: "open",
      filterKey: "status",
      searchKeys: ["title", "leagueName"],
      sort: null,
    });

    expect(visible.map((row) => row.id)).toEqual(["brand", "editorial"]);
  });

  it("sorts date-like dashboard columns chronologically", () => {
    const visible = deriveVisibleRows({
      rows,
      columns,
      query: "",
      filter: null,
      filterKey: "status",
      searchKeys: ["title", "leagueName"],
      sort: { key: "deadline", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["archive", "motion", "brand", "editorial"]);
  });

  it("sorts strings naturally and case-insensitively", () => {
    const visible = deriveVisibleRows({
      rows: [
        { id: "sprint-10", title: "Sprint 10" },
        { id: "sprint-2", title: "sprint 2" },
        { id: "sprint-1", title: "Sprint 1" },
      ],
      columns,
      query: "",
      filter: null,
      sort: { key: "title", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["sprint-1", "sprint-2", "sprint-10"]);
  });
});
