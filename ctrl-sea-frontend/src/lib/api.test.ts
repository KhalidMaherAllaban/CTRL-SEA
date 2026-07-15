import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import { API_ENDPOINT_PATHS, api } from "@/lib/api";

const FASTAPI_ROUTER_PREFIXES = [
  "/health",
  "/auth",
  "/dashboard",
  "/map",
  "/ports",
  "/countries",
  "/chokepoints",
  "/climate-risk",
  "/trade-risk",
  "/spillover",
  "/disruptions",
  "/risk-center",
  "/insights",
  "/reports",
  "/admin"
];

describe("api client", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the Next.js API proxy with secure browser credentials", () => {
    expect(api.defaults.baseURL).toBe("/api");
    expect(api.defaults.withCredentials).toBe(true);
  });

  it("does not reference obsolete course or versioned API routes", () => {
    expect(API_ENDPOINT_PATHS.some((path) => path.includes("/api/v1") || path.toLowerCase().includes("course"))).toBe(false);
  });

  it("only exposes paths mounted by the FastAPI router", () => {
    const invalidPaths = API_ENDPOINT_PATHS.filter((path) => !FASTAPI_ROUTER_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)));

    expect(invalidPaths).toEqual([]);
  });

  it("retries transient GET failures", async () => {
    let attempts = 0;
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    api.defaults.adapter = async (config) => {
      attempts += 1;
      if (attempts < 3) {
        const error = Object.assign(new Error("offline"), { config, request: {}, isAxiosError: true });
        throw error;
      }
      return { data: { status: "healthy" }, status: 200, statusText: "OK", headers: {}, config };
    };

    const response = await api.get("/health");

    expect(response.status).toBe(200);
    expect(attempts).toBe(3);
  });
});
