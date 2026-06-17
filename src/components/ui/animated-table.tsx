"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AnimatedColumn<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  className?: string;
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => string | number;
  /** Custom cell renderer. Defaults to row[key]. */
  render?: (row: T) => React.ReactNode;
  /** Value used for CSV export. Defaults to sortValue or row[key]. */
  exportValue?: (row: T) => string | number;
};

/**
 * Generic animated data-table — sortable headers, staggered row entrance,
 * optional CSV export, pagination and row-click. Styled with design tokens
 * (works in light/dark + brand). Drop-in for any column/row data.
 */
export function AnimatedTable<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  pageSize = 10,
  exportName,
  emptyLabel = "Nothing here yet.",
}: {
  columns: AnimatedColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  exportName?: string;
  emptyLabel?: string;
}) {
  const reduce = useReducedMotion();
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(1);

  const sorted = React.useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return order === "asc" ? -1 : 1;
      if (av > bv) return order === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, columns, sortKey, order]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (col: AnimatedColumn<T>) => {
    if (!col.sortValue) return;
    if (sortKey === col.key) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortKey(col.key); setOrder("asc"); }
    setPage(1);
  };

  const exportCSV = () => {
    const headers = columns.filter((c) => c.key !== "actions").map((c) => c.header);
    const valueOf = (c: AnimatedColumn<T>, row: T) =>
      c.exportValue ? c.exportValue(row) : c.sortValue ? c.sortValue(row) : String((row as Record<string, unknown>)[c.key] ?? "");
    const body = sorted.map((row) =>
      columns.filter((c) => c.key !== "actions").map((c) => `"${String(valueOf(c, row)).replace(/"/g, '""')}"`).join(","),
    );
    const csv = [headers.join(","), ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${exportName}.csv`;
    link.click();
  };

  const container = { visible: { transition: { staggerChildren: 0.03, delayChildren: 0.05 } } };
  const rowV = {
    hidden: { opacity: 0, y: 12, filter: "blur(3px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring" as const, stiffness: 400, damping: 28, mass: 0.6 } },
  };
  const animate = !reduce;

  return (
    <div className="space-y-3">
      {exportName && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={sorted.length === 0}>
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              {columns.map((c) => {
                const active = sortKey === c.key;
                const Icon = !c.sortValue ? null : active ? (order === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th key={c.key} className={cn("px-3 py-2.5 font-medium", c.align === "right" && "text-right", c.className)}>
                    {c.sortValue ? (
                      <button onClick={() => toggleSort(c)} className={cn("inline-flex items-center gap-1 transition-colors hover:text-foreground", active && "text-foreground")}>
                        {c.header}
                        {Icon && <Icon className="size-3" />}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <motion.tbody key={`p-${safePage}-${sortKey}-${order}`} variants={animate ? container : undefined} initial={animate ? "hidden" : false} animate="visible">
            {paged.map((row) => (
              <motion.tr
                key={getRowId(row)}
                variants={animate ? rowV : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn("border-b transition-colors last:border-0 hover:bg-muted/40", onRowClick && "cursor-pointer")}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-3 py-3", c.align === "right" && "text-right", c.className)}>
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                  </td>
                ))}
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
        {paged.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{emptyLabel}</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">Page {safePage} of {totalPages} · {sorted.length} rows</p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
