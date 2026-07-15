"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { MaritimeMap } from "@/components/map/maritime-map";
import { PageHeader } from "@/components/dashboard/page-header";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { ApiError, endpoints } from "@/lib/api";
import { Map } from "lucide-react";

export default function MapPage() {
  const { data, error } = useQuery({ queryKey: ["map-layers"], queryFn: () => endpoints.mapLayers() });
  const errorLabel = error instanceof ApiError && error.status === 401
    ? "Sign in again to load maritime map layers."
    : "Unable to load maritime layers. Confirm the API and warehouse are available.";
  return (
    <AppShell><div className="space-y-5"><PageHeader eyebrow="Geospatial command" title="Maritime Intelligence Map" description="Explore clustered ports, risk fields, disruptions, chokepoints, and animated global trade corridors." icon={Map}/>{error ? <ErrorState label={errorLabel}/> : data ? <MaritimeMap layers={data} /> : <LoadingState label="Loading geospatial intelligence"/>}</div></AppShell>
  );
}
