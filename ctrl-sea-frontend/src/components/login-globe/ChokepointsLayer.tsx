"use client";

import type { GlobeChokepoint } from "@/components/login-globe/AnimatedRoutes";
import type Graphic from "@arcgis/core/Graphic";
import type Point from "@arcgis/core/geometry/Point";
import type GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

type ArcGISModules = {
  Graphic: typeof Graphic;
  GraphicsLayer: typeof GraphicsLayer;
  Point: typeof Point;
};

export function createChokepointsLayer(chokepoints: GlobeChokepoint[], modules: ArcGISModules) {
  const layer = new modules.GraphicsLayer({
    title: "Strategic Chokepoints",
    elevationInfo: { mode: "relative-to-ground", offset: 18000 },
  });

  const graphics = chokepoints.flatMap((chokepoint) => {
    const geometry = new modules.Point({
      longitude: chokepoint.longitude,
      latitude: chokepoint.latitude,
      z: 18000,
    });

    return [
      new modules.Graphic({
        geometry,
        attributes: chokepoint,
        symbol: {
          type: "simple-marker",
          style: "circle",
          size: 30,
          color: [214, 168, 95, 0.13],
          outline: { color: [214, 168, 95, 0.8], width: 1.2 },
        },
      }),
      new modules.Graphic({
        geometry,
        attributes: chokepoint,
        symbol: {
          type: "simple-marker",
          style: "circle",
          size: 9,
          color: [248, 224, 173, 0.98],
          outline: { color: [214, 168, 95, 1], width: 1 },
        },
        popupTemplate: {
          title: "{name}",
          content: "Strategic maritime chokepoint monitored by CTRL SEA.",
        },
      }),
    ];
  });

  layer.addMany(graphics);
  return layer;
}
