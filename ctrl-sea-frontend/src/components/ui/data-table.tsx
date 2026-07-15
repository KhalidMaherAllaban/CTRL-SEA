"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Download, FileSpreadsheet, Search } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/data-state";
import { exportRows, formatNumber } from "@/lib/utils";

export type DataColumn<T> = { key: string; label: string; value: (row: T) => string | number | null | undefined; render?: (row: T) => ReactNode; align?: "left" | "right" };

export function DataTable<T>({ title, rows, columns, rowKey, pageSize = 10, searchable = true }: { title: string; rows: T[]; columns: DataColumn<T>[]; rowKey: (row: T) => string | number; pageSize?: number; searchable?: boolean }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" }>({ key: columns[0]?.key ?? "", direction: "asc" });
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => rows.filter((row) => !query || columns.some((column) => String(column.value(row) ?? "").toLowerCase().includes(query.toLowerCase()))), [columns, query, rows]);
  const sorted = useMemo(() => [...filtered].sort((a, b) => { const column = columns.find((item) => item.key === sort.key); if (!column) return 0; const av = column.value(a) ?? ""; const bv = column.value(b) ?? ""; const comparison = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv)); return sort.direction === "asc" ? comparison : -comparison; }), [columns, filtered, sort]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const visible = sorted.slice((Math.min(page, totalPages) - 1) * pageSize, Math.min(page, totalPages) * pageSize);
  const exportData = sorted.map((row) => Object.fromEntries(columns.map((column) => [column.label, column.value(row)])));
  const toggleSort = (key: string) => { setPage(1); setSort((current) => current.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }); };

  return <Card className="overflow-hidden p-0"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-300/10 p-5"><div><CardTitle>{title}</CardTitle><p className="mt-1 text-xs text-slate-500">{formatNumber(filtered.length, 0)} records</p></div><div className="flex flex-wrap items-center gap-2">{searchable && <label className="flex h-9 items-center gap-2 rounded-lg border border-cyan-300/15 bg-slate-950/60 px-3"><Search size={14} className="text-slate-500" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Filter records" className="w-32 bg-transparent text-xs text-slate-200 outline-none" /></label>}<button onClick={() => exportRows(title.toLowerCase().replace(/\s+/g, "-"), exportData)} title="Export CSV" className="table-action"><Download size={14} /><span className="sr-only">Export CSV</span></button><button onClick={() => exportRows(title.toLowerCase().replace(/\s+/g, "-"), exportData, "xls")} title="Export Excel" className="table-action"><FileSpreadsheet size={14} /><span className="sr-only">Export Excel</span></button></div></div>
    {visible.length ? <div className="max-h-[520px] overflow-auto"><table className="premium-table w-full text-left text-sm"><thead><tr>{columns.map((column) => <th key={column.key} className={column.align === "right" ? "text-right" : ""}><button onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1.5 whitespace-nowrap">{column.label}{sort.key === column.key ? <ChevronDown size={13} className={sort.direction === "asc" ? "rotate-180" : ""} /> : <ChevronsUpDown size={12} className="opacity-40" />}</button></th>)}</tr></thead><tbody>{visible.map((row) => <tr key={rowKey(row)}>{columns.map((column) => <td key={column.key} className={column.align === "right" ? "text-right" : ""}>{column.render ? column.render(row) : String(column.value(row) ?? "-")}</td>)}</tr>)}</tbody></table></div> : <EmptyState />}
    <div className="flex items-center justify-between border-t border-cyan-300/10 px-5 py-3 text-xs text-slate-500"><span>Page {Math.min(page, totalPages)} of {totalPages}</span><div className="flex gap-1"><button className="table-action h-8 w-8" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={14} /></button><button className="table-action h-8 w-8" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight size={14} /></button></div></div></Card>;
}
