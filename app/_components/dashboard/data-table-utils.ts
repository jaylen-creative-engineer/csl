export type ColumnKind =
  | "primary"
  | "status"
  | "deadline"
  | "score"
  | "mono"
  | "date"
  | "text";

export interface ColumnSpec {
  key: string;
  label: string;
  kind?: ColumnKind;
  subKey?: string;
  dotColorKey?: string;
  sortable?: boolean;
  numeric?: boolean;
  width?: string;
}

export interface DataTableRow {
  id: string;
  href?: string;
  [key: string]: unknown;
}

export type SortState = { key: string; dir: "asc" | "desc" };

export function cellValue(row: DataTableRow, key: string): unknown {
  return row[key];
}

export function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

export function getFilterValues(rows: DataTableRow[], filterKey?: string): [string, number][] {
  if (!filterKey) return [];
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = String(cellValue(row, filterKey) ?? "");
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()];
}

export function sortRows(
  rows: DataTableRow[],
  columns: ColumnSpec[],
  sort: SortState | null,
): DataTableRow[] {
  if (!sort) return rows;
  const col = columns.find((candidate) => candidate.key === sort.key);
  const dirMul = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let av = cellValue(a, sort.key);
    let bv = cellValue(b, sort.key);
    if (col?.kind === "deadline" || col?.kind === "date") {
      av = new Date(String(av)).getTime();
      bv = new Date(String(bv)).getTime();
    }
    return compareValues(av, bv) * dirMul;
  });
}

export function getVisibleRows({
  rows,
  columns,
  searchKeys,
  filterKey,
  filter,
  query,
  sort,
}: {
  rows: DataTableRow[];
  columns: ColumnSpec[];
  searchKeys?: string[];
  filterKey?: string;
  filter: string | null;
  query: string;
  sort: SortState | null;
}): DataTableRow[] {
  let out = rows;
  if (filterKey && filter) {
    out = out.filter((row) => String(cellValue(row, filterKey)) === filter);
  }
  if (query.trim() && searchKeys?.length) {
    const normalizedQuery = query.trim().toLowerCase();
    out = out.filter((row) =>
      searchKeys.some((key) => String(cellValue(row, key) ?? "").toLowerCase().includes(normalizedQuery)),
    );
  }
  return sortRows(out, columns, sort);
}

export function nextSortState(previous: SortState | null, key: string): SortState {
  return previous?.key === key ? { key, dir: previous.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" };
}
