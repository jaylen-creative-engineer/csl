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

export type DataTableSort = { key: string; dir: "asc" | "desc" };

export function cellValue(row: DataTableRow, key: string): unknown {
  return row[key];
}

function compareValues(a: unknown, b: unknown): number {
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

export function getVisibleRows({
  rows,
  columns,
  query,
  searchKeys,
  filterKey,
  filter,
  sort,
}: {
  rows: DataTableRow[];
  columns: ColumnSpec[];
  query: string;
  searchKeys?: string[];
  filterKey?: string;
  filter: string | null;
  sort: DataTableSort | null;
}): DataTableRow[] {
  let out = rows;

  if (filterKey && filter) {
    out = out.filter((row) => String(cellValue(row, filterKey)) === filter);
  }

  if (query.trim() && searchKeys?.length) {
    const normalizedQuery = query.trim().toLowerCase();
    out = out.filter((row) =>
      searchKeys.some((key) =>
        String(cellValue(row, key) ?? "").toLowerCase().includes(normalizedQuery),
      ),
    );
  }

  if (sort) {
    const column = columns.find((candidate) => candidate.key === sort.key);
    const direction = sort.dir === "asc" ? 1 : -1;
    out = [...out].sort((a, b) => {
      let av = cellValue(a, sort.key);
      let bv = cellValue(b, sort.key);
      if (column?.kind === "deadline" || column?.kind === "date") {
        av = new Date(String(av)).getTime();
        bv = new Date(String(bv)).getTime();
      }
      return compareValues(av, bv) * direction;
    });
  }

  return out;
}

export function nextSortForColumn(
  currentSort: DataTableSort | null,
  key: string,
): DataTableSort {
  return currentSort?.key === key
    ? { key, dir: currentSort.dir === "asc" ? "desc" : "asc" }
    : { key, dir: "asc" };
}
