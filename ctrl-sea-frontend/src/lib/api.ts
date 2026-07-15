"use client";

import axios, { type InternalAxiosRequestConfig } from "axios";
import type {
  AdminHealth,
  AdminUser,
  Chokepoint,
  ClimateRisk,
  CountryAnalytics,
  DashboardOverview,
  Disruption,
  EtlResult,
  ExecutiveInsights,
  MapLayers,
  Paginated,
  Port,
  Report,
  SpilloverPayload,
  SpilloverResult,
  AuthResponse,
  TradeRisk,
  User
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const RETRYABLE_METHODS = new Set(["get", "head", "options"]);
const MAX_RETRIES = 3;

export const API_ENDPOINT_PATHS = [
  "/health",
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/auth/refresh",
  "/auth/me",
  "/dashboard",
  "/map/layers",
  "/ports",
  "/ports/analytics",
  "/countries/analytics",
  "/chokepoints",
  "/chokepoints/analytics",
  "/climate-risk",
  "/trade-risk",
  "/spillover",
  "/disruptions",
  "/risk-center",
  "/insights",
  "/reports",
  "/admin/health",
  "/admin/users",
  "/admin/etl/run",
  "/admin/etl/architecture"
] as const;

export type SocialProvider = "google" | "microsoft" | "github";

export function getSocialAuthUrl(provider: SocialProvider, next = "/dashboard") {
  if (provider === "google") {
    return `${API_URL}/auth/google/start?next=${encodeURIComponent(next)}`;
  }
  return `${API_URL}/auth/${provider}/login`;
}

type RetryableRequest = InternalAxiosRequestConfig & { _ctrlSeaRetryCount?: number };

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function extractApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const detail = error.response.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg ?? item.message ?? JSON.stringify(item)).join("; ")
        : typeof detail === "string"
          ? detail
          : error.response.statusText || "API request failed";
      return new ApiError(message, error.response.status, error.code);
    }
    if (error.request) {
      return new ApiError("Backend unreachable or CORS blocked the request. Confirm FastAPI is running and CORS allows this frontend URL.", undefined, error.code);
    }
    return new ApiError(error.message || "API request failed", undefined, error.code);
  }
  return new ApiError(error instanceof Error ? error.message : "Unexpected API error");
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.config) {
      const config = error.config as RetryableRequest;
      const method = (config.method ?? "get").toLowerCase();
      const retryableFailure = !error.response || error.response.status >= 500;
      const retryCount = config._ctrlSeaRetryCount ?? 0;

      if (RETRYABLE_METHODS.has(method) && retryableFailure && retryCount < MAX_RETRIES) {
        config._ctrlSeaRetryCount = retryCount + 1;
        await sleep(300 * 2 ** retryCount);
        return api.request(config);
      }
    }
    const requestPath = axios.isAxiosError(error) ? error.config?.url ?? "" : "";
    const isCredentialRequest = ["/auth/login", "/auth/register", "/auth/refresh"].some((path) => requestPath.endsWith(path));
    if (axios.isAxiosError(error) && error.response?.status === 401 && error.config && !isCredentialRequest && !error.config.headers?.["x-ctrl-sea-refresh"]) {
      try {
        await api.post("/auth/refresh", undefined, { headers: { "x-ctrl-sea-refresh": "1" } });
        return api.request({ ...error.config, headers: { ...error.config.headers, "x-ctrl-sea-refresh": "1" } });
      } catch {
        // Fall through to the original auth error.
      }
    }
    return Promise.reject(extractApiError(error));
  }
);

export const endpoints = {
  health: () => api.get<{ status: string; database: string }>(API_ENDPOINT_PATHS[0], { timeout: 4_000 }).then((r) => r.data),
  login: (email: string, password: string, remember = true) => api.post<AuthResponse>(API_ENDPOINT_PATHS[1], { email, password, remember }).then((r) => r.data),
  register: (full_name: string, email: string, password: string) => api.post<AuthResponse>(API_ENDPOINT_PATHS[2], { full_name, email, password }).then((r) => r.data),
  logout: () => api.post(API_ENDPOINT_PATHS[3]).then((r) => r.data),
  refresh: () => api.post<AuthResponse>(API_ENDPOINT_PATHS[4]).then((r) => r.data),
  me: () => api.get<User>(API_ENDPOINT_PATHS[5]).then((r) => r.data),
  dashboard: () => api.get<DashboardOverview>(API_ENDPOINT_PATHS[6]).then((r) => r.data),
  mapLayers: (params?: Record<string, string | number>) => api.get<MapLayers>(API_ENDPOINT_PATHS[7], { params }).then((r) => r.data),
  ports: (params?: Record<string, string | number>) => api.get<Paginated<Port>>(API_ENDPOINT_PATHS[8], { params }).then((r) => r.data),
  portAnalytics: () => api.get(API_ENDPOINT_PATHS[9]).then((r) => r.data),
  countryAnalytics: () => api.get<CountryAnalytics>(API_ENDPOINT_PATHS[10]).then((r) => r.data),
  chokepoints: () => api.get<Chokepoint[]>(API_ENDPOINT_PATHS[11]).then((r) => r.data),
  chokepointAnalytics: () => api.get(API_ENDPOINT_PATHS[12]).then((r) => r.data),
  climate: () => api.get<ClimateRisk>(API_ENDPOINT_PATHS[13]).then((r) => r.data),
  trade: () => api.get<TradeRisk>(API_ENDPOINT_PATHS[14]).then((r) => r.data),
  spillover: (payload: SpilloverPayload) => api.post<SpilloverResult>(API_ENDPOINT_PATHS[15], payload).then((r) => r.data),
  disruptions: () => api.get<Disruption[]>(API_ENDPOINT_PATHS[16]).then((r) => r.data),
  riskCenter: () => api.get(API_ENDPOINT_PATHS[17]).then((r) => r.data),
  insights: () => api.get<ExecutiveInsights>(API_ENDPOINT_PATHS[18]).then((r) => r.data),
  reports: () => api.get<Report[]>(API_ENDPOINT_PATHS[19]).then((r) => r.data),
  adminHealth: () => api.get<AdminHealth>(API_ENDPOINT_PATHS[20]).then((r) => r.data),
  users: () => api.get<AdminUser[]>(API_ENDPOINT_PATHS[21]).then((r) => r.data),
  runEtl: () => api.post<EtlResult>(API_ENDPOINT_PATHS[22]).then((r) => r.data),
  etlArchitecture: () => api.get<EtlResult>(API_ENDPOINT_PATHS[23]).then((r) => r.data)
};
