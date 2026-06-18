"use client";

import axios from "axios";
import type {
  AdminHealth,
  AdminUser,
  Chokepoint,
  ClimateRisk,
  CountryAnalytics,
  DashboardOverview,
  Disruption,
  EtlResult,
  MapLayers,
  Paginated,
  Port,
  Report,
  SpilloverPayload,
  SpilloverResult,
  TokenResponse,
  TradeRisk,
  User
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export type SocialProvider = "google" | "microsoft" | "github";

export function getSocialAuthUrl(provider: SocialProvider) {
  if (provider === "google") {
    return "https://adwshtheflame.app.n8n.cloud/webhook-test/google-login-welcome";
  }
  return `${API_URL}/auth/${provider}/login`;
}

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
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ctrl-sea-token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(extractApiError(error))
);

export const endpoints = {
  login: (email: string, password: string) => api.post<TokenResponse>("/auth/login", { email, password }).then((r) => r.data),
  register: (full_name: string, email: string, password: string) => api.post<TokenResponse>("/auth/register", { full_name, email, password }).then((r) => r.data),
  me: () => api.get<User>("/auth/me").then((r) => r.data),
  dashboard: () => api.get<DashboardOverview>("/dashboard").then((r) => r.data),
  mapLayers: () => api.get<MapLayers>("/map/layers").then((r) => r.data),
  ports: (params?: Record<string, string | number>) => api.get<Paginated<Port>>("/ports", { params }).then((r) => r.data),
  portAnalytics: () => api.get("/ports/analytics").then((r) => r.data),
  countryAnalytics: () => api.get<CountryAnalytics>("/countries/analytics").then((r) => r.data),
  chokepoints: () => api.get<Chokepoint[]>("/chokepoints").then((r) => r.data),
  chokepointAnalytics: () => api.get("/chokepoints/analytics").then((r) => r.data),
  climate: () => api.get<ClimateRisk>("/climate-risk").then((r) => r.data),
  trade: () => api.get<TradeRisk>("/trade-risk").then((r) => r.data),
  spillover: (payload: SpilloverPayload) => api.post<SpilloverResult>("/spillover/simulate", payload).then((r) => r.data),
  disruptions: () => api.get<Disruption[]>("/disruptions").then((r) => r.data),
  reports: () => api.get<Report[]>("/reports").then((r) => r.data),
  adminHealth: () => api.get<AdminHealth>("/admin/health").then((r) => r.data),
  users: () => api.get<AdminUser[]>("/admin/users").then((r) => r.data),
  runEtl: () => api.post<EtlResult>("/admin/etl/run").then((r) => r.data),
  etlArchitecture: () => api.get<EtlResult>("/admin/etl/architecture").then((r) => r.data)
};
