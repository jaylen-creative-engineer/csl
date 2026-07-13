import { describe, expect, it } from "vitest";
import {
  getFilterValues,
  getVisibleRows,
  type ColumnSpec,
  type DataTableRow,
} from "./data-table-utils.js";

const columns: ColumnSpec[] = [
  { key: "title", label: "Title", kind: "primary" },
  { key: "status", label: "Status", kind: "status" },
  { key: "score", label: "Score", kind: "score", numeric: true },
  { key: "deadline", label: "Deadline", kind: "deadline" },
  { key: "code", label: "Code", kind: "mono" },
];

const rows: DataTableRow[] = [
  {
    id: "sprint-10",
    title: "Poster Sprint",
    discipline: "Design",
    status: "open",
    score: 92.5,
    deadline: "2026-02-01T00:00:00.000Z",
    code: "item 10",
  },
  {
    id: "sprint-2",
    title: "Audio Remix",
    discipline: "Audio",
    status: "judging",
    score: 88,
    deadline: "2026-01-01T00:00:00.000Z",
    code: "item 2",
  },
  {
    id: "sprint-1",
    title: "Motion Study",
    discipline: "Motion",
    status: "open",
    score: null,
    deadline: "2026-03-01T00:00:00.000Z",
    code: "item 1",
  },
];

describe("data table utilities", () => {
  it("builds filter counts in row order and skips empty values", () => {
    expect(getFilterValues([...rows, { id: "draft", status: "" }], "status")).toEqual([
      ["open", 2],
      ["judging", 1],
    ]);
  });

  it("filters rows before applying a trimmed case-insensitive search", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      filterKey: "status",
      filter: "open",
      query: "  des  ",
      searchKeys: ["title", "discipline"],
      sort: null,
    });

    expect(visible.map((row) => row.id)).toEqual(["sprint-10"]);
  });

  it("sorts numeric columns ascending with null values last", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      filter: null,
      query: "",
      searchKeys: ["title"],
      sort: { key: "score", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["sprint-2", "sprint-10", "sprint-1"]);
  });

  it("sorts date-like columns by timestamp", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      filter: null,
      query: "",
      searchKeys: ["title"],
      sort: { key: "deadline", dir: "desc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["sprint-1", "sprint-10", "sprint-2"]);
  });

  it("uses natural case-insensitive ordering for string columns", () => {
    const visible = getVisibleRows({
      rows,
      columns,
      filter: null,
      query: "",
      searchKeys: ["title"],
      sort: { key: "code", dir: "asc" },
    });

    expect(visible.map((row) => row.id)).toEqual(["sprint-1", "sprint-2", "sprint-10"]);
  });

  it("does not mutate the input rows while sorting", () => {
    const originalOrder = rows.map((row) => row.id);

    getVisibleRows({
      rows,
      columns,
      filter: null,
      query: "",
      searchKeys: ["title"],
      sort: { key: "deadline", dir: "desc" },
    });

    expect(rows.map((row) => row.id)).toEqual(originalOrder);
  });
});
