"use client";

import { AlertTriangle, Bell, Database, ShieldAlert, Wifi, type LucideIcon } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import type { CommandAlert } from "@/components/dashboard/command-center-header";
import { cn } from "@/lib/utils";

const iconByAlert: Record<CommandAlert["tone"], typeof Bell> = {
  healthy: Bell,
  warning: AlertTriangle,
  critical: ShieldAlert
};

function toneClasses(tone: CommandAlert["tone"]) {
  if (tone === "critical") return "border-rose-300/25 bg-rose-400/10 text-rose-200";
  if (tone === "warning") return "border-[#D6A85F]/30 bg-[#D6A85F]/10 text-[#F8E0AD]";
  return "border-emerald-300/20 bg-emerald-400/10 text-emerald-200";
}

export function NotificationCenter({ alerts, onSelect }: { alerts: CommandAlert[]; onSelect: (alert: CommandAlert) => void }) {
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-cyan-300/10 p-5">
        <div>
          <CardTitle>Notification Center</CardTitle>
          <p className="mt-1 text-xs text-slate-500">Operational alerts linked to dashboard context.</p>
        </div>
        <span className="rounded-md border border-cyan-300/15 bg-slate-950/60 px-2 py-1 text-xs text-cyan-100">{alerts.length}</span>
      </div>
      <div className="space-y-2 p-4">
        {alerts.map((alert) => {
          const Icon = iconByAlert[alert.tone];
          return (
            <button key={alert.id} type="button" onClick={() => onSelect(alert)} className={cn("w-full rounded-md border p-3 text-left transition hover:translate-x-1", toneClasses(alert.tone))}>
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]"><Icon size={15} />{alert.label}</span>
              <span className="mt-1 block text-xs leading-5 opacity-80">{alert.detail}</span>
            </button>
          );
        })}
        {!alerts.length && (
          <div className="rounded-md border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">
            <Database className="mb-2 h-4 w-4" /> No active operational alerts.
          </div>
        )}
      </div>
    </Card>
  );
}

export function RealtimeStatusStrip() {
  const statusItems: Array<{ label: string; value: string; icon: LucideIcon }> = [
    { label: "Warehouse stream", value: "Live polling", icon: Wifi },
    { label: "Map updates", value: "Layer cache ready", icon: Database },
    { label: "Alerts", value: "Auto-refresh enabled", icon: Bell }
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {statusItems.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-md border border-cyan-300/10 bg-slate-950/45 px-3 py-2 text-xs text-slate-400">
          <span className="flex items-center gap-2 text-cyan-100"><Icon size={14} />{label}</span>
          <p className="mt-1">{value}</p>
        </div>
      ))}
    </div>
  );
}
