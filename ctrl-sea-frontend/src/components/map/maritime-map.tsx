"use client";

import dynamic from "next/dynamic";
import type { MapLayers } from "@/lib/types";

const MaritimeMapClient = dynamic(
  () => import("./maritime-map-client").then((module) => module.MaritimeMapClient),
  {
    ssr: false,
    loading: () => <p className="text-cyan-200">Loading map engine...</p>,
  },
);

export function MaritimeMap({ layers }: { layers: MapLayers }) {
  return <MaritimeMapClient layers={layers} />;
}
