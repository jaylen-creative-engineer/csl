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

export function compareDataTableValues(a: unknown, b: unknown): number {
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
  sort: SortState | null;
}): DataTableRow[] {
  let visibleRows = rows;

  if (filterKey && filter) {
    visibleRows = visibleRows.filter((row) => String(cellValue(row, filterKey)) === filter);
  }

  if (query.trim() && searchKeys?.length) {
    const normalizedQuery = query.trim().toLowerCase();
    visibleRows = visibleRows.filter((row) =>
      searchKeys.some((key) =>
        String(cellValue(row, key) ?? "")
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    );
  }

  if (sort) {
    const column = columns.find((col) => col.key === sort.key);
    const direction = sort.dir === "asc" ? 1 : -1;
    visibleRows = [...visibleRows].sort((a, b) => {
      let aValue = cellValue(a, sort.key);
      let bValue = cellValue(b, sort.key);
      if (column?.kind === "deadline" || column?.kind === "date") {
        aValue = new Date(String(aValue)).getTime();
        bValue = new Date(String(bValue)).getTime();
      }
      return compareDataTableValues(aValue, bValue) * direction;
    });
  }

  return visibleRows;
}
