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

function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

export function getFilterValues(
  rows: DataTableRow[],
  filterKey?: string,
): Array<[value: string, count: number]> {
  if (!filterKey) return [];
  const counts = new Map<string, number>();
  for (const row of rows) {
    const v = String(cellValue(row, filterKey) ?? "");
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()];
}

type VisibleRowsOptions = {
  columns: ColumnSpec[];
  rows: DataTableRow[];
  query: string;
  filter: string | null;
  sort: DataTableSort | null;
  filterKey?: string;
  searchKeys?: string[];
};

export function getVisibleRows({
  columns,
  rows,
  query,
  filter,
  sort,
  filterKey,
  searchKeys,
}: VisibleRowsOptions): DataTableRow[] {
  let out = rows;
  if (filterKey && filter) {
    out = out.filter((r) => String(cellValue(r, filterKey)) === filter);
  }
  if (query.trim() && searchKeys?.length) {
    const q = query.trim().toLowerCase();
    out = out.filter((r) =>
      searchKeys.some((k) => String(cellValue(r, k) ?? "").toLowerCase().includes(q)),
    );
  }
  if (sort) {
    const col = columns.find((c) => c.key === sort.key);
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
