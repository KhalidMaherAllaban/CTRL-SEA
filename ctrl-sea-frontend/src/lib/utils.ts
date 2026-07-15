import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(value || 0);
}

export function formatMetric(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value || 0);
}

export function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value || 0);
}

export function formatPercent(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits }).format((value || 0) / 100);
}

export function exportRows(filename: string, rows: Array<Record<string, unknown>>, format: "csv" | "xls" = "csv") {
  if (!rows.length || typeof window === "undefined") return;
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const separator = format === "xls" ? "\t" : ",";
  const escape = (value: unknown) => {
    const text = String(value ?? "").replace(/\r?\n/g, " ");
    return format === "xls" ? text.replace(/\t/g, " ") : `"${text.replace(/"/g, '""')}"`;
  };
  const body = [headers.join(separator), ...rows.map((row) => headers.map((header) => escape(row[header])).join(separator))].join("\n");
  const blob = new Blob([format === "xls" ? `\ufeff${body}` : body], { type: format === "xls" ? "application/vnd.ms-excel" : "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}.${format}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
