"use client";

import type { GlobeRoute } from "@/components/login-globe/AnimatedRoutes";
import { greatCirclePath } from "@/components/login-globe/AnimatedRoutes";
import type Graphic from "@arcgis/core/Graphic";
import type Polyline from "@arcgis/core/geometry/Polyline";
import type GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

type ArcGISModules = {
  Graphic: typeof Graphic;
  GraphicsLayer: typeof GraphicsLayer;
  Polyline: typeof Polyline;
};

export type RouteGraphic = {
  route: GlobeRoute;
  path: number[][];
};

export function createTradeRoutesLayer(routes: GlobeRoute[], modules: ArcGISModules) {
  const layer = new modules.GraphicsLayer({
    title: "Animated Trade Routes",
    elevationInfo: { mode: "relative-to-ground", offset: 26000 },
  });
  const glowLayer = new modules.GraphicsLayer({
    title: "Trade Route Glow",
    elevationInfo: { mode: "relative-to-ground", offset: 25000 },
  });

  const maxTrade = Math.max(...routes.map((route) => route.tradeVolume), 1);
  const routeGraphics: RouteGraphic[] = [];

  routes.forEach((route) => {
    const path = greatCirclePath(route.origin, route.destination, 84);
    routeGraphics.push({ route, path });
    const width = Math.max(1.3, Math.min(5.8, 1.4 + (route.tradeVolume / maxTrade) * 4.4));
    const geometry = new modules.Polyline({
      paths: [path],
      spatialReference: { wkid: 4326 },
    });

    glowLayer.add(new modules.Graphic({
      geometry,
      symbol: {
        type: "simple-line",
        color: [34, 211, 238, 0.16],
        width: width + 6,
      },
    }));

    layer.add(new modules.Graphic({
      geometry,
      attributes: {
        origin: route.origin.name,
        destination: route.destination.name,
        tradeVolume: route.tradeVolume,
        riskScore: route.riskScore,
      },
      symbol: {
        type: "simple-line",
        color: [48, 213, 255, 0.78],
        width,
        style: "short-dash",
      },
      popupTemplate: {
        title: "{origin} to {destination}",
        content: "Daily maritime capacity at risk: {tradeVolume}<br/>Risk score: {riskScore}",
      },
    }));
  });

  return { layer, glowLayer, routeGraphics };
}
