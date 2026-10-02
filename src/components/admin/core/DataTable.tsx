"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";
import { Fragment, type ReactNode, useMemo, useState } from "react";
import { useT } from "@/components/providers/LangProvider";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Enables sorting on this column. */
  sort?: (row: T) => string | number | null;
  className?: string;
  /** Hide below md (desktop-first columns). */
  hideOnMobile?: boolean;
}

/**
 * Generic admin table: free-text search, sortable columns, toolbar slot for
 * filters, optional expandable rows, "show more" paging. Scrolls inside its
 * own box on small screens so the page never scrolls sideways.
 */
export function DataTable<T>({
  rows, columns, rowKey, search, searchPlaceholder, toolbar, empty, onRowClick, rowClassName, expanded, initialSort, initialQuery = "", pageSize = 50, caption,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  search?: (row: T) => string;
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  expanded?: (row: T) => ReactNode | null;
  initialSort?: { key: string; dir: "asc" | "desc" };
  initialQuery?: string;
  pageSize?: number;
  caption?: ReactNode;
}) {
  const { tx, d } = useT();
  const [q, setQ] = useState(initialQuery);
  const [sort, setSort] = useState(initialSort ?? null);
  const [limit, setLimit] = useState(pageSize);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let out = t && search ? rows.filter((r) => search(r).toLowerCase().includes(t)) : rows;
    const col = sort && columns.find((c) => c.key === sort.key);
    if (col?.sort) {
      const get = col.sort;
      out = [...out].sort((a, b) => {
        const x = get(a);
        const y = get(b);
        if (x === y) return 0;
        if (x === null) return 1;
        if (y === null) return -1;
        const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
        return sort!.dir === "asc" ? r : -r;
      });
    }
    return out;
  }, [rows, q, search, sort, columns]);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" }));

  const shown = filtered.slice(0, limit);

  return (
    <div className="rounded-2xl border border-line bg-card">
      {(search || toolbar || caption) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          {caption && <div className="mr-auto font-bold">{caption}</div>}
          {search && (
            <label className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={searchPlaceholder ?? tx("খুঁজুন…", "Search…")}
                className="min-h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm outline-none focus:border-brand"
              />
            </label>
          )}
          {toolbar}
          <span className="text-xs text-muted">{d(filtered.length)} {tx("টি", "rows")}</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={clsx("whitespace-nowrap px-3 py-2 font-semibold", c.hideOnMobile && "hidden md:table-cell", c.className)}>
                  {c.sort ? (
                    <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-ink">
                      {c.header}
                      {sort?.key === c.key ? sort.dir === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" /> : <ChevronsUpDown className="size-3.5 opacity-50" />}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const extra = expanded?.(r);
              return (
                <Fragment key={rowKey(r)}>
                  <tr
                    onClick={onRowClick ? () => onRowClick(r) : undefined}
                    className={clsx("border-t border-line align-top", onRowClick && "cursor-pointer hover:bg-surface/60", rowClassName?.(r))}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={clsx("px-3 py-2.5", c.hideOnMobile && "hidden md:table-cell", c.className)}>
                        {c.cell(r)}
                      </td>
                    ))}
                  </tr>
                  {extra && (
                    <tr className="bg-surface/40">
                      <td colSpan={columns.length} className="px-3 pb-3 pt-0">
                        {extra}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="px-4 py-10 text-center text-muted">{empty ?? tx("কিছু নেই", "Nothing here")}</div>}
      </div>
      {filtered.length > limit && (
        <div className="border-t border-line p-2 text-center">
          <button type="button" onClick={() => setLimit((l) => l + pageSize)} className="min-h-10 rounded-xl px-4 text-sm font-semibold text-brand hover:bg-brand-soft/50">
            {tx("আরও দেখুন", "Show more")} ({d(filtered.length - limit)})
          </button>
        </div>
      )}
    </div>
  );
}

/** Compact select for table toolbars. */
export function FilterSelect<V extends string>({ value, onChange, options, label }: { value: V; onChange: (v: V) => void; options: { value: V; label: string }[]; label: string }) {
  return (
    <select
      aria-label={label}
      title={label}
      value={value}
      onChange={(e) => onChange(e.target.value as V)}
      className="min-h-10 max-w-48 rounded-xl border border-line bg-card px-2 text-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Small toggle chip for boolean filters. */
export function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={clsx("min-h-10 rounded-xl border px-3 text-sm font-semibold", active ? "border-ink bg-ink text-white" : "border-line bg-card hover:border-ink/40")}
    >
      {children}
    </button>
  );
}
