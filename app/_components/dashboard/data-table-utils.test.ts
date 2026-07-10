import { describe, expect, it } from "vitest";
import {
  getFilterValues,
  getVisibleRows,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Challenge", kind: "primary" },
  { key: "leagueName", label: "League" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", kind: "score" },
];

const rows: DataTableRow[] = [
  {
    id: "challenge-2",
    title: "Sprint 10: Sponsor deck",
    leagueName: "Future Brand",
    status: "open",
    deadline: "2026-07-13T10:00:00.000Z",
    score: 8.7,
  },
  {
    id: "challenge-1",
    title: "Sprint 2: Motion system",
    leagueName: "Future Motion",
    status: "judging",
    deadline: "2026-07-11T10:00:00.000Z",
    score: 9.2,
  },
  {
    id: "challenge-3",
    title: "Sprint 1: Portfolio polish",
    leagueName: "Future Brand",
    status: "open",
    deadline: "2026-07-12T10:00:00.000Z",
    score: null,
  },
];

describe("dashboard data table utilities", () => {
  it("counts non-empty filter values in first-seen order", () => {
    expect(
      getFilterValues(
        [
          ...rows,
          { id: "challenge-4", title: "Draft", status: "draft" },
          { id: "challenge-5", title: "No status", status: "" },
          { id: "challenge-6", title: "Null status", status: null },
        ],
        "status",
      ),
    ).toEqual([
      ["open", 2],
      ["judging", 1],
      ["draft", 1],
    ]);
  });

  it("applies exact filters and trimmed case-insensitive search across configured keys", () => {
    const visible = getVisibleRows({
      columns,
      rows,
      filterKey: "status",
      filter: "open",
      query: "  future brand  ",
      searchKeys: ["title", "leagueName"],
      sort: null,
    });

    expect(visible.map((row) => row.id)).toEqual(["challenge-2", "challenge-3"]);
  });

  it("sorts date and deadline columns chronologically without mutating input order", () => {
    const visible = getVisibleRows({
      columns,
      rows,
      filter: null,
      query: "",
      sort: { key: "deadline", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["challenge-1", "challenge-3", "challenge-2"]);
    expect(rows.map((row) => row.id)).toEqual(["challenge-2", "challenge-1", "challenge-3"]);
  });

  it("uses natural string sorting and keeps null values last for ascending sorts", () => {
    const byTitle = getVisibleRows({
      columns,
      rows,
      filter: null,
      query: "",
      sort: { key: "title", dir: "asc" },
    });
    const byScore = getVisibleRows({
      columns,
      rows,
      filter: null,
      query: "",
      sort: { key: "score", dir: "asc" },
    });

    expect(byTitle.map((row) => row.id)).toEqual(["challenge-3", "challenge-1", "challenge-2"]);
    expect(byScore.map((row) => row.id)).toEqual(["challenge-2", "challenge-1", "challenge-3"]);
  });
});
