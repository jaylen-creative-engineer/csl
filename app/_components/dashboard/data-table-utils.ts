export type ColumnKind =
  | "primary"
  | "status"
  | "deadline"
  | "score"
  | "mono"
  | "date"
  | "text";

/**
 * Serializable column spec so server components can pass config across
 * the RSC boundary (no render functions).
 *
 * kind:
 *  - "primary"  -> dot + title (+ optional subKey) - the row's identity cell
 *  - "status"   -> status tag pill
 *  - "deadline" -> relative deadline, mono
 *  - "score"    -> accent-colored number
 *  - "mono"     -> mono muted text (ids, counts)
 *  - "date"     -> locale date from ISO string
 *  - "text"     -> plain text
 */
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

export function compareDataTableValues(a: unknown, b: unknown): number {
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
    const v = String(cellValue(row, filterKey) ?? "");
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()];
}

type VisibleRowsOptions = {
  rows: DataTableRow[];
  columns: ColumnSpec[];
  query: string;
  searchKeys?: string[];
  filterKey?: string;
  filter: string | null;
  sort: DataTableSort | null;
};

export function getVisibleRows({
  rows,
  columns,
  query,
  searchKeys,
  filterKey,
  filter,
  sort,
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
      return compareDataTableValues(av, bv) * dirMul;
    });
  }
  return out;
}
