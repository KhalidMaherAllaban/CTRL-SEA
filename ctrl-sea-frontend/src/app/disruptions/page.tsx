"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { endpoints } from "@/lib/api";
import { formatUsd } from "@/lib/utils";

const categories = ["All", "Weather", "Conflict", "Canal Closures", "Congestion", "Labor Strikes", "Geopolitical Risks"];

export default function DisruptionsPage() {
  const [category, setCategory] = useState("All");
  const { data } = useQuery({ queryKey: ["disruptions"], queryFn: endpoints.disruptions });
  const rows = data?.filter((event) => category === "All" || event.event_type === category) ?? [];

  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((item) => (
          <button key={item} onClick={() => setCategory(item)} className={`rounded border px-3 py-1.5 text-sm transition ${category === item ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-100" : "border-slate-700 text-slate-400 hover:text-white"}`}>{item}</button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((event) => (
          <Card key={event.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{event.event_type}</CardTitle>
                <h2 className="mt-2 text-xl font-semibold text-white">{event.event_name}</h2>
                <p className="mt-2 text-sm text-slate-400">{event.impacted_ports.join(", ")} &middot; {event.affected_regions.join(", ")}</p>
              </div>
              <span className="rounded-md border border-rose-300/25 bg-rose-400/10 px-3 py-1 text-sm text-rose-200">{event.severity}</span>
            </div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <Metric label="Impact" value={`${event.impact_score}`} />
              <Metric label="Routes" value={event.affected_routes.join(", ")} />
              <Metric label="Countries" value={event.affected_countries.join(", ")} />
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4 text-sm">
              <span className="text-slate-500">{new Date(event.started_at).toLocaleDateString()}</span>
              <span className="text-cyan-200">{formatUsd(event.estimated_loss_usd)}</span>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-cyan-300/10 bg-slate-950/40 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 line-clamp-2 text-cyan-100">{value}</p>
    </div>
  );
}
