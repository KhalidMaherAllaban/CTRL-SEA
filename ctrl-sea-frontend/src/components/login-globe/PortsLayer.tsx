"use client";

import type { GlobePort } from "@/components/login-globe/AnimatedRoutes";
import { riskColor } from "@/components/login-globe/AnimatedRoutes";
import type Graphic from "@arcgis/core/Graphic";
import type Point from "@arcgis/core/geometry/Point";
import type GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

type ArcGISModules = {
  Graphic: typeof Graphic;
  GraphicsLayer: typeof GraphicsLayer;
  Point: typeof Point;
};

export function createPortsLayer(ports: GlobePort[], modules: ArcGISModules) {
  const layer = new modules.GraphicsLayer({
    title: "Glowing Ports",
    elevationInfo: { mode: "relative-to-ground", offset: 9000 },
  });

  const maxTrade = Math.max(...ports.map((port) => port.tradeVolume), 1);
  const graphics = ports.map((port) => {
    const size = Math.max(7, Math.min(20, 7 + (port.tradeVolume / maxTrade) * 15));
    const color = riskColor(port.riskScore);
    return new modules.Graphic({
      geometry: new modules.Point({
        longitude: port.longitude,
        latitude: port.latitude,
        z: 12000,
      }),
      attributes: port,
      symbol: {
        type: "simple-marker",
        style: "circle",
        size,
        color,
        outline: {
          color: [226, 232, 240, 0.75],
          width: 0.8,
        },
      },
      popupTemplate: {
        title: "{name}",
        content: [
          {
            type: "fields",
            fieldInfos: [
              { fieldName: "country", label: "Country" },
              { fieldName: "tradeVolume", label: "Trade Volume", format: { digitSeparator: true, places: 0 } },
              { fieldName: "riskScore", label: "Risk Score", format: { places: 1 } },
              { fieldName: "congestion", label: "Congestion", format: { places: 1 } },
            ],
          },
        ],
      },
    });
  });

  layer.addMany(graphics);
  return layer;
}
