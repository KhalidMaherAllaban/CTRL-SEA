"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Clock3, Database, RefreshCw, ShieldCheck, UserCog, Wifi } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatusTone = "healthy" | "warning" | "critical";

export type CommandAlert = {
  id: string;
  label: string;
  tone: StatusTone;
  detail: string;
};

function toneClasses(tone: StatusTone) {
  if (tone === "critical") return "border-rose-300/25 bg-rose-400/10 text-rose-200";
  if (tone === "warning") return "border-[#D6A85F]/30 bg-[#D6A85F]/10 text-[#F8E0AD]";
  return "border-emerald-300/20 bg-emerald-400/10 text-emerald-200";
}

function statusFrom(value?: string): StatusTone {
  const normalized = value?.toLowerCase() ?? "";
  if (!normalized || normalized.includes("offline") || normalized.includes("unavailable") || normalized.includes("failed")) return "critical";
  if (normalized.includes("degraded") || normalized.includes("warning")) return "warning";
  return "healthy";
}

function formatUtc(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
    hour12: false
  }).format(date);
}

export function CommandCenterHeader({
  apiStatus,
  databaseStatus,
  warehouseStatus,
  lastRefresh,
  userRole,
  isRefreshing,
  alerts
}: {
  apiStatus?: string;
  databaseStatus?: string;
  warehouseStatus?: string;
  lastRefresh?: Date;
  userRole?: string;
  isRefreshing?: boolean;
  alerts: CommandAlert[];
}) {
  const [now, setNow] = useState(() => new Date());
  const criticalCount = alerts.filter((alert) => alert.tone === "critical").length;
  const apiTone = statusFrom(apiStatus);
  const databaseTone = statusFrom(databaseStatus);
  const warehouseTone = statusFrom(warehouseStatus);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const statusItems = useMemo(() => [
    { label: "API", value: apiStatus ?? "checking", tone: apiTone, icon: Wifi },
    { label: "Database", value: databaseStatus ?? "checking", tone: databaseTone, icon: Database },
    { label: "Warehouse", value: warehouseStatus ?? "checking", tone: warehouseTone, icon: ShieldCheck }
  ], [apiStatus, apiTone, databaseStatus, databaseTone, warehouseStatus, warehouseTone]);

  return (
    <Card className="relative overflow-hidden p-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(48,213,255,.16),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(214,168,95,.12),transparent_26%)]" />
      <div className="relative grid gap-4 p-5 xl:grid-cols-[1fr_auto]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D6A85F]">Live Command Center</p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Global Maritime Command Center</h1>
            <span className="rounded-md border border-cyan-300/15 bg-slate-950/60 px-2 py-1 font-mono text-xs text-cyan-100">UTC {formatUtc(now)}</span>
          </div>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            Operational view of trade, port activity, climate exposure, chokepoint pressure, supply-chain propagation, and executive risk posture.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[560px] xl:grid-cols-3">
          {statusItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={cn("rounded-md border px-3 py-2", toneClasses(item.tone))}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]"><Icon size={14} />{item.label}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                </div>
                <p className="mt-1 truncate text-sm font-medium capitalize">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative grid gap-2 border-t border-cyan-300/10 bg-slate-950/30 px-5 py-3 text-xs text-slate-400 md:grid-cols-4">
        <span className="flex items-center gap-2"><Clock3 size={14} /> Last refresh: {lastRefresh ? lastRefresh.toLocaleTimeString() : "pending"}</span>
        <span className="flex items-center gap-2"><UserCog size={14} /> Role: {(userRole ?? "analyst").toUpperCase()}</span>
        <span className="flex items-center gap-2"><RefreshCw size={14} className={isRefreshing ? "animate-spin text-cyan-200" : ""} /> Auto-refresh: 60s</span>
        <span className={cn("flex items-center gap-2", criticalCount ? "text-rose-200" : "text-emerald-200")}><Bell size={14} /> Notifications: {alerts.length}</span>
      </div>
    </Card>
  );
}
