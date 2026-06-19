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

<<<<<<< HEAD
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export type SocialProvider = "google" | "microsoft" | "github";

export function getSocialAuthUrl(provider: SocialProvider) {
  if (provider === "google") {
    return "https://adwshtheflame.app.n8n.cloud/webhook-test/google-login-welcome";
  }
  return `${API_URL}/auth/${provider}/login`;
}
=======
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
>>>>>>> da5a23e (feat: productionize CTRL SEA warehouse platform)

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
  login: (email: string, password: string, remember = true) => api.post<AuthResponse>("/auth/login", { email, password, remember }).then((r) => r.data),
  register: (full_name: string, email: string, password: string) => api.post<AuthResponse>("/auth/register", { full_name, email, password }).then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  refresh: () => api.post<AuthResponse>("/auth/refresh").then((r) => r.data),
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
  riskCenter: () => api.get("/risk-center").then((r) => r.data),
  insights: () => api.get<ExecutiveInsights>("/insights").then((r) => r.data),
  reports: () => api.get<Report[]>("/reports").then((r) => r.data),
  adminHealth: () => api.get<AdminHealth>("/admin/health").then((r) => r.data),
  users: () => api.get<AdminUser[]>("/admin/users").then((r) => r.data),
  runEtl: () => api.post<EtlResult>("/admin/etl/run").then((r) => r.data),
  etlArchitecture: () => api.get<EtlResult>("/admin/etl/architecture").then((r) => r.data)
};
