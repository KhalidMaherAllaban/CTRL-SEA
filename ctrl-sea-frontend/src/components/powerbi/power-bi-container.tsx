"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { PowerBIReportViewer } from "@/components/powerbi/power-bi-report-viewer";
import type { Report } from "@/lib/types";

export function PowerBIContainer({ reports }: { reports: Report[] }) {
  const [reportIndex, setReportIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [countryFilter, setCountryFilter] = useState("");
  const report = reports[reportIndex];
  const pages = report?.pages?.length ? report.pages : ["ReportSection"];
  const filters = useMemo(() => ({ country: countryFilter }), [countryFilter]);

  if (!report) return null;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-cyan-300/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#D6A85F]">Power BI Analytics</p>
          <CardTitle className="mt-1">{report.title}</CardTitle>
          <p className="mt-1 text-xs text-slate-500">{report.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="text-slate-400">Dashboard <select value={reportIndex} onChange={(event) => { setReportIndex(Number(event.target.value)); setPageIndex(0); }} className="ml-2 rounded border border-cyan-300/15 bg-[#03152D] px-2 py-1.5 text-cyan-100">{reports.map((item, index) => <option key={item.id} value={index}>{item.title}</option>)}</select></label>
          <label className="text-slate-400">Country <input value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)} placeholder="Global" className="ml-2 w-28 rounded border border-cyan-300/15 bg-[#03152D] px-2 py-1.5 text-cyan-100 outline-none" /></label>
        </div>
      </div>
      <div className="my-3 flex items-center justify-between gap-3">
        <button type="button" disabled={pageIndex === 0} onClick={() => setPageIndex((current) => current - 1)} className="rounded border border-cyan-300/15 p-2 text-cyan-100 disabled:opacity-35" aria-label="Previous report page"><ChevronLeft size={16} /></button>
        <div className="flex flex-wrap justify-center gap-2">{pages.map((page, index) => <button type="button" key={page} onClick={() => setPageIndex(index)} className={`rounded px-3 py-1.5 text-xs ${index === pageIndex ? "bg-cyan-300/15 text-cyan-100" : "text-slate-500"}`}>{report.page_labels?.[index] ?? `Page ${index + 1}`}</button>)}</div>
        <button type="button" disabled={pageIndex === pages.length - 1} onClick={() => setPageIndex((current) => current + 1)} className="rounded border border-cyan-300/15 p-2 text-cyan-100 disabled:opacity-35" aria-label="Next report page"><ChevronRight size={16} /></button>
      </div>
      <PowerBIReportViewer title={report.title} embedUrl={report.embed_url} pageName={pages[pageIndex]} filters={filters} />
    </Card>
  );
}
