"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { MaritimeMap } from "@/components/map/maritime-map";
import { endpoints } from "@/lib/api";

export default function MapPage() {
  const { data } = useQuery({ queryKey: ["map-layers"], queryFn: endpoints.mapLayers });
  return (
    <AppShell>
      {data ? <MaritimeMap layers={data} /> : <p className="text-cyan-200">Loading global maritime layers...</p>}
    </AppShell>
  );
}
