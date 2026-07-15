"use client";

import type SceneView from "@arcgis/core/views/SceneView";

type CameraControllerOptions = {
  view: SceneView;
  container: HTMLElement;
  reducedMotion: boolean;
};

export function startGlobeCameraController({ view, container, reducedMotion }: CameraControllerOptions) {
  if (reducedMotion) return () => undefined;

  let frame = 0;
  let paused = false;
  let longitude = -32;

  const pause = () => { paused = true; };
  const resume = () => { paused = false; };
  container.addEventListener("pointerenter", pause);
  container.addEventListener("pointerleave", resume);

  const tick = () => {
    if (!paused && !view.destroyed) {
      longitude = ((longitude + 0.045 + 540) % 360) - 180;
      const camera = view.camera.clone();
      camera.position = {
        latitude: 18,
        longitude,
        z: 19_500_000,
      };
      camera.heading = 0;
      camera.tilt = 0;
      view.camera = camera;
    }
    frame = window.requestAnimationFrame(tick);
  };

  frame = window.requestAnimationFrame(tick);

  return () => {
    window.cancelAnimationFrame(frame);
    container.removeEventListener("pointerenter", pause);
    container.removeEventListener("pointerleave", resume);
  };
}
