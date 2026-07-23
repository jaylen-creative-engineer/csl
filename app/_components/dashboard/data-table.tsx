"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { statusTagClass, formatDeadlineShort } from "../app-shell/app-utils.js";
import {
  cellValue,
  getFilterValues,
  getVisibleRows,
  type ColumnSpec,
  type DataTableRow,
  type DataTableSort,
} from "./data-table-utils.js";

/**
 * Serializable column spec so server components can pass config across
 * the RSC boundary (no render functions).
 *
 * kind:
 *  - "primary"  → dot + title (+ optional subKey) — the row's identity cell
 *  - "status"   → status tag pill
 *  - "deadline" → relative deadline, mono
 *  - "score"    → accent-colored number
 *  - "mono"     → mono muted text (ids, counts)
 *  - "date"     → locale date from ISO string
 *  - "text"     → plain text
 */
export type { ColumnKind, ColumnSpec, DataTableRow } from "./data-table-utils.js";

type DataTableProps = {
  columns: ColumnSpec[];
  rows: DataTableRow[];
  searchKeys?: string[];
  searchPlaceholder?: string;
  filterKey?: string;
  countLabel?: string;
  initialSort?: { key: string; dir: "asc" | "desc" };
  emptyTitle?: string;
  emptyBody?: string;
};

export function DataTable({
  columns,
  rows,
  searchKeys,
  searchPlaceholder = "Search…",
  filterKey,
  countLabel = "records",
  initialSort,
  emptyTitle = "Nothing here yet",
  emptyBody = "Records will appear here as soon as they exist.",
}: DataTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<DataTableSort | null>(initialSort ?? null);

  const filterValues = useMemo(() => {
    return getFilterValues(rows, filterKey);
  }, [rows, filterKey]);

  const visible = useMemo(() => {
    return getVisibleRows({ columns, rows, query, filter, sort, filterKey, searchKeys });
  }, [rows, query, filter, sort, filterKey, searchKeys, columns]);

  function toggleSort(key: string) {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }

  function renderCell(row: DataTableRow, col: ColumnSpec) {
    const raw = cellValue(row, col.key);
    switch (col.kind) {
      case "primary": {
        const dot = col.dotColorKey ? String(cellValue(row, col.dotColorKey) ?? "") : "";
        const inner = (
          <>
            <span
              className="app-dt-primary-dot"
              style={dot ? { background: dot } : undefined}
            />
            <span className="app-dt-primary-body">
              <span className="app-dt-primary-title">{String(raw ?? "—")}</span>
              {col.subKey && cellValue(row, col.subKey) != null && (
                <span className="app-dt-primary-sub">{String(cellValue(row, col.subKey))}</span>
              )}
            </span>
          </>
        );
        return row.href ? (
          <Link href={row.href} className="app-dt-primary" onClick={(e) => e.stopPropagation()}>
            {inner}
          </Link>
        ) : (
          <span className="app-dt-primary">{inner}</span>
        );
      }
      case "status":
        return <span className={statusTagClass(String(raw ?? ""))}>{String(raw ?? "—")}</span>;
      case "deadline": {
        const label = raw ? formatDeadlineShort(String(raw)) : "—";
        return (
          <span className={`app-dt-deadline${label === "Closed" ? " closed" : ""}`}>{label}</span>
        );
      }
      case "score":
        return (
          <span className="app-dt-score">
            {typeof raw === "number" ? raw.toFixed(1) : (raw as string) ?? "—"}
          </span>
        );
      case "mono":
        return <span className="app-dt-mono">{String(raw ?? "—")}</span>;
      case "date":
        return (
          <span className="app-dt-mono">
            {raw ? new Date(String(raw)).toLocaleDateString() : "—"}
          </span>
        );
      default:
        return <span>{String(raw ?? "—")}</span>;
    }
  }

  const hasLinks = rows.some((r) => r.href);

  return (
    <div>
      <div className="app-toolbar">
        {searchKeys?.length ? (
          <label className="app-toolbar-search">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(244,243,239,0.4)"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={query}
              placeholder={searchPlaceholder}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={searchPlaceholder}
            />
          </label>
        ) : null}

        {filterKey && filterValues.length > 1 && (
          <div className="app-filter-row" role="group" aria-label="Filter">
            <button
              type="button"
              className={`app-filter-chip${filter === null ? " active" : ""}`}
              onClick={() => setFilter(null)}
            >
              All<b>{rows.length}</b>
            </button>
            {filterValues.map(([value, count]) => (
              <button
                key={value}
                type="button"
                className={`app-filter-chip${filter === value ? " active" : ""}`}
                onClick={() => setFilter(filter === value ? null : value)}
              >
                {value}
                <b>{count}</b>
              </button>
            ))}
          </div>
        )}

        <span className="app-toolbar-count">
          {visible.length} / {rows.length} {countLabel}
        </span>
      </div>

      <div className="app-dt-wrap">
        <table className="app-dt">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.numeric ? "num" : undefined}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.sortable === false ? (
                    <span className="app-th-static">{col.label}</span>
                  ) : (
                    <button
                      type="button"
                      className={`app-th-btn${sort?.key === col.key ? " sorted" : ""}`}
                      onClick={() => toggleSort(col.key)}
                    >
                      {col.label}
                      <i aria-hidden>
                        {sort?.key === col.key ? (sort.dir === "asc" ? "▲" : "▼") : "△"}
                      </i>
                    </button>
                  )}
                </th>
              ))}
              {hasLinks && <th style={{ width: 44 }} aria-hidden />}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasLinks ? 1 : 0)}>
                  <div className="app-dt-empty">
                    <p className="app-section-label" style={{ marginBottom: 8 }}>
                      {query || filter ? "No matches" : emptyTitle}
                    </p>
                    <p className="app-muted" style={{ margin: 0, fontSize: 13 }}>
                      {query || filter
                        ? "Try a different search or clear the filters."
                        : emptyBody}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr
                  key={row.id}
                  className={row.href ? "rowlink" : undefined}
                  onClick={row.href ? () => router.push(row.href!) : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={col.numeric ? "num" : undefined}>
                      {renderCell(row, col)}
                    </td>
                  ))}
                  {hasLinks && (
                    <td aria-hidden>
                      {row.href ? <span className="app-dt-arrow">→</span> : null}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
