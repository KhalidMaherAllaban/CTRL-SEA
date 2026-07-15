"use client";

import dynamic from "next/dynamic";
import { LoadingOverlay } from "@/components/login-globe/LoadingOverlay";

const ArcGISGlobe = dynamic(
  () => import("@/components/login-globe/ArcGISGlobe").then((module) => module.ArcGISGlobe),
  {
    ssr: false,
    loading: () => <LoadingOverlay label="Loading Esri globe engine" />,
  }
);

export function MapLoader() {
  return (
    <div className="absolute inset-0">
      <ArcGISGlobe />
    </div>
  );
}
