"use client";

import { CalendarDays, Filter, RotateCcw, Search } from "lucide-react";
import { Card } from "@/components/ui/card";

export type DashboardFilters = {
  region: string;
  country: string;
  port: string;
  cargoType: string;
  shipType: string;
  dateRange: string;
  riskLevel: string;
  tradeRoute: string;
};

export const defaultDashboardFilters: DashboardFilters = {
  region: "All",
  country: "All",
  port: "All",
  cargoType: "All",
  shipType: "All",
  dateRange: "12M",
  riskLevel: "All",
  tradeRoute: "All"
};

type OptionSet = {
  regions: string[];
  countries: string[];
  ports: string[];
  cargoTypes: string[];
  shipTypes: string[];
  tradeRoutes: string[];
};

function SelectControl({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-cyan-300/15 bg-slate-950/70 px-3 text-sm text-cyan-50 outline-none transition focus:border-cyan-300/40">
        {options.map((option) => <option key={option} className="bg-[#03152D]" value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export function GlobalFilters({ filters, options, onChange, onReset, onSearch }: { filters: DashboardFilters; options: OptionSet; onChange: (patch: Partial<DashboardFilters>) => void; onReset: () => void; onSearch: () => void }) {
  return (
    <Card className="sticky top-20 z-10 p-4 backdrop-blur-2xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#D6A85F]"><Filter size={14} /> Global Filters</p>
          <p className="mt-1 text-xs text-slate-500">Filters synchronize the dashboard widgets instantly.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onSearch} className="table-action h-9 px-3" title="Open global search">
            <Search size={14} /> <span className="hidden sm:inline">Ctrl+K</span>
          </button>
          <button type="button" onClick={onReset} className="table-action h-9 px-3" title="Reset filters">
            <RotateCcw size={14} /> <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <SelectControl label="Region" value={filters.region} options={["All", ...options.regions]} onChange={(region) => onChange({ region })} />
        <SelectControl label="Country" value={filters.country} options={["All", ...options.countries]} onChange={(country) => onChange({ country })} />
        <SelectControl label="Port" value={filters.port} options={["All", ...options.ports]} onChange={(port) => onChange({ port })} />
        <SelectControl label="Cargo Type" value={filters.cargoType} options={["All", ...options.cargoTypes]} onChange={(cargoType) => onChange({ cargoType })} />
        <SelectControl label="Ship Type" value={filters.shipType} options={["All", ...options.shipTypes]} onChange={(shipType) => onChange({ shipType })} />
        <SelectControl label="Date Range" value={filters.dateRange} options={["6M", "12M", "18M"]} onChange={(dateRange) => onChange({ dateRange })} />
        <SelectControl label="Risk Level" value={filters.riskLevel} options={["All", "Healthy", "Warning", "Critical"]} onChange={(riskLevel) => onChange({ riskLevel })} />
        <SelectControl label="Trade Route" value={filters.tradeRoute} options={["All", ...options.tradeRoutes]} onChange={(tradeRoute) => onChange({ tradeRoute })} />
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-600">
        <CalendarDays size={13} /> Date window: {filters.dateRange}
      </div>
    </Card>
  );
}
