"use client";

import { useEffect, useRef, useState } from "react";
import { endpoints } from "@/lib/api";
import { demoGlobeData, GlobeData, interpolatePath, normalizeMapLayers } from "@/components/login-globe/AnimatedRoutes";
import { createChokepointsLayer } from "@/components/login-globe/ChokepointsLayer";
import { startGlobeCameraController } from "@/components/login-globe/GlobeCameraController";
import { LoadingOverlay } from "@/components/login-globe/LoadingOverlay";
import { createPortsLayer } from "@/components/login-globe/PortsLayer";
import { createTradeRoutesLayer, RouteGraphic } from "@/components/login-globe/TradeRoutesLayer";

type ArcGISModules = {
  ArcGISMap: typeof import("@arcgis/core/Map").default;
  SceneView: typeof import("@arcgis/core/views/SceneView").default;
  Graphic: typeof import("@arcgis/core/Graphic").default;
  GraphicsLayer: typeof import("@arcgis/core/layers/GraphicsLayer").default;
  Point: typeof import("@arcgis/core/geometry/Point").default;
  Polyline: typeof import("@arcgis/core/geometry/Polyline").default;
};

async function loadArcGISModules(): Promise<ArcGISModules> {
  const [
    { default: ArcGISMap },
    { default: SceneView },
    { default: Graphic },
    { default: GraphicsLayer },
    { default: Point },
    { default: Polyline },
  ] = await Promise.all([
    import("@arcgis/core/Map"),
    import("@arcgis/core/views/SceneView"),
    import("@arcgis/core/Graphic"),
    import("@arcgis/core/layers/GraphicsLayer"),
    import("@arcgis/core/geometry/Point"),
    import("@arcgis/core/geometry/Polyline"),
  ]);

  return { ArcGISMap, SceneView, Graphic, GraphicsLayer, Point, Polyline };
}

async function loadGlobeData(): Promise<GlobeData> {
  try {
    const layers = await endpoints.mapLayers({ route_limit: 90 });
    return normalizeMapLayers(layers);
  } catch {
    return demoGlobeData;
  }
}

function startParticles(routeGraphics: RouteGraphic[], modules: ArcGISModules, reducedMotion: boolean) {
  const particleLayer = new modules.GraphicsLayer({
    title: "Route Pulse Particles",
    elevationInfo: { mode: "relative-to-ground", offset: 42000 },
  });

  if (reducedMotion) return { particleLayer, cleanup: () => undefined };

  const particles = routeGraphics.slice(0, 42).map((item, index) => {
    const [longitude, latitude] = interpolatePath(item.path, (index * 0.11) % 1);
    return {
      item,
      phase: (index * 0.137) % 1,
      speed: 0.00075 + (index % 5) * 0.00016,
      graphic: new modules.Graphic({
        geometry: new modules.Point({ longitude, latitude, z: 52000 }),
        symbol: {
          type: "simple-marker",
          style: "circle",
          size: 5 + (index % 3),
          color: [48, 213, 255, 0.96],
          outline: { color: [226, 232, 240, 0.58], width: 0.6 },
        },
      }),
    };
  });

  particleLayer.addMany(particles.map((particle) => particle.graphic));

  let animation = 0;
  const tick = () => {
    particles.forEach((particle) => {
      particle.phase = (particle.phase + particle.speed) % 1;
      const [longitude, latitude] = interpolatePath(particle.item.path, particle.phase);
      particle.graphic.geometry = new modules.Point({ longitude, latitude, z: 52000 });
    });
    animation = window.requestAnimationFrame(tick);
  };
  animation = window.requestAnimationFrame(tick);

  return {
    particleLayer,
    cleanup: () => window.cancelAnimationFrame(animation),
  };
}

export function ArcGISGlobe() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<GlobeData["source"]>("demo");

  useEffect(() => {
    let cleanup = () => undefined;
    let cancelled = false;

    async function boot() {
      if (!containerRef.current) return;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 768px)").matches;
      const [modules, globeData] = await Promise.all([loadArcGISModules(), loadGlobeData()]);
      if (cancelled || !containerRef.current) return;

      setDataSource(globeData.source);

      const map = new modules.ArcGISMap({
        basemap: "satellite",
        ground: "world-elevation",
      });
      const view = new modules.SceneView({
        container: containerRef.current,
        map,
        viewingMode: "global",
        qualityProfile: "high",
        alphaCompositingEnabled: true,
        camera: {
          position: { longitude: -28, latitude: 18, z: 19_500_000 },
          tilt: 0,
          heading: 0,
        },
        environment: {
          atmosphereEnabled: true,
          starsEnabled: true,
          lighting: {
            directShadowsEnabled: true,
          },
        },
        ui: { components: [] },
        popup: {
          dockEnabled: false,
        },
        constraints: {
          altitude: { min: 2_200_000, max: 28_000_000 },
        },
      });

      const { layer: routeLayer, glowLayer, routeGraphics } = createTradeRoutesLayer(globeData.routes, modules);
      const portsLayer = createPortsLayer(globeData.ports, modules);
      const chokepointsLayer = createChokepointsLayer(globeData.chokepoints, modules);
      const { particleLayer, cleanup: cleanupParticles } = startParticles(routeGraphics, modules, reducedMotion);

      map.addMany([glowLayer, routeLayer, particleLayer, portsLayer, chokepointsLayer]);

      await view.when();
      if (!cancelled) setLoading(false);

      const cleanupCamera = startGlobeCameraController({
        view,
        container: containerRef.current!,
        reducedMotion,
      });

      cleanup = () => {
        cleanupCamera();
        cleanupParticles();
        view.destroy();
      };
    }

    void boot();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#020617]">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_48%_42%,transparent_0%,rgba(2,6,23,.12)_38%,rgba(2,6,23,.88)_84%),linear-gradient(90deg,rgba(2,6,23,.2),transparent_42%,rgba(2,6,23,.68))]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,.18),transparent_28%),radial-gradient(circle_at_70%_68%,rgba(214,168,95,.12),transparent_34%)] mix-blend-screen" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#020617] via-[#020617]/68 to-transparent" />
      <div className="pointer-events-none absolute bottom-8 left-8 z-10 hidden max-w-sm rounded-md border border-cyan-300/15 bg-slate-950/50 p-4 text-cyan-50 shadow-[0_0_70px_rgba(48,213,255,.16)] backdrop-blur-xl md:block">
        <p className="text-xs uppercase tracking-[0.26em] text-[#D6A85F]">Esri ArcGIS Globe</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Routes, ports, and chokepoints render as a live maritime intelligence layer. Source: {dataSource === "live" ? "CTRL SEA warehouse" : "demo preview"}.
        </p>
      </div>
      {loading && <LoadingOverlay />}
    </div>
  );
}
