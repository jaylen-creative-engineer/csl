import { describe, expect, it } from "vitest";
import {
  getFilterValues,
  getVisibleRows,
  nextSortForColumn,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Sprint" },
  { key: "status", label: "Status", kind: "status" },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "score", label: "Score", kind: "score" },
];

const rows: DataTableRow[] = [
  {
    id: "sprint-10",
    title: "Brand Sprint 10",
    subtitle: "Identity systems",
    status: "open",
    deadline: "2026-05-03T12:00:00.000Z",
    score: 12,
  },
  {
    id: "sprint-2",
    title: "brand sprint 2",
    subtitle: "Retail launch",
    status: "open",
    deadline: "2026-05-01T12:00:00.000Z",
    score: 7,
  },
  {
    id: "poster-1",
    title: "Poster sprint",
    subtitle: "Brand extensions",
    status: "closed",
    deadline: "2026-04-29T12:00:00.000Z",
    score: null,
  },
  {
    id: "zine-1",
    title: "Zine Sprint",
    subtitle: "",
    status: "",
    deadline: "2026-05-02T12:00:00.000Z",
    score: 9,
  },
];

describe("dashboard data table utilities", () => {
  it("counts non-empty filter values without manufacturing blank chips", () => {
    expect(getFilterValues(rows, "status")).toEqual([
      ["open", 2],
      ["closed", 1],
    ]);
  });

  it("applies filter and case-insensitive search before sorting date columns", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      query: " BRAND ",
      searchKeys: ["title", "subtitle"],
      filterKey: "status",
      filter: "open",
      sort: { key: "deadline", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["sprint-2", "sprint-10"]);
  });

  it("uses natural, case-insensitive text sorting for sprint names", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      query: "",
      sort: { key: "title", dir: "asc" },
      filter: null,
    });

    expect(visible.map((row) => row.id)).toEqual([
      "sprint-2",
      "sprint-10",
      "poster-1",
      "zine-1",
    ]);
  });

  it("keeps missing values at the end for ascending numeric sorts", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      query: "",
      sort: { key: "score", dir: "asc" },
      filter: null,
    });

    expect(visible.map((row) => row.id)).toEqual([
      "sprint-2",
      "zine-1",
      "sprint-10",
      "poster-1",
    ]);
  });

  it("toggles the active sort direction and starts new columns ascending", () => {
    expect(nextSortForColumn(null, "title")).toEqual({ key: "title", dir: "asc" });
    expect(nextSortForColumn({ key: "title", dir: "asc" }, "title")).toEqual({
      key: "title",
      dir: "desc",
    });
    expect(nextSortForColumn({ key: "title", dir: "desc" }, "score")).toEqual({
      key: "score",
      dir: "asc",
    });
  });
});
