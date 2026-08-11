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

export type SortSpec = { key: string; dir: "asc" | "desc" };

export function cellValue(row: DataTableRow, key: string): unknown {
  return row[key];
}

function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

export function getFilterCounts(rows: DataTableRow[], filterKey?: string): Array<[string, number]> {
  if (!filterKey) return [];
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = String(cellValue(row, filterKey) ?? "");
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()];
}

export function deriveVisibleRows({
  rows,
  columns,
  query,
  filter,
  filterKey,
  searchKeys,
  sort,
}: {
  rows: DataTableRow[];
  columns: ColumnSpec[];
  query: string;
  filter: string | null;
  filterKey?: string;
  searchKeys?: string[];
  sort: SortSpec | null;
}): DataTableRow[] {
  let out = rows;
  if (filterKey && filter) {
    out = out.filter((row) => String(cellValue(row, filterKey)) === filter);
  }
  if (query.trim() && searchKeys?.length) {
    const q = query.trim().toLowerCase();
    out = out.filter((row) =>
      searchKeys.some((key) => String(cellValue(row, key) ?? "").toLowerCase().includes(q)),
    );
  }
  if (sort) {
    const col = columns.find((column) => column.key === sort.key);
    const dirMul = sort.dir === "asc" ? 1 : -1;
    out = [...out].sort((a, b) => {
      let av = cellValue(a, sort.key);
      let bv = cellValue(b, sort.key);
      if (col?.kind === "deadline" || col?.kind === "date") {
        av = new Date(String(av)).getTime();
        bv = new Date(String(bv)).getTime();
      }
      return compare(av, bv) * dirMul;
    });
  }
  return out;
}

export function nextSortState(prev: SortSpec | null, key: string): SortSpec {
  return prev?.key === key
    ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
    : { key, dir: "asc" };
}
