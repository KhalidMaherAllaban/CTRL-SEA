import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

describe("auth middleware", () => {
  it("redirects anonymous protected routes to login", () => {
    const response = middleware(new NextRequest("http://localhost:3000/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fdashboard");
  });

  it("allows refresh-cookie sessions to reach protected routes", () => {
    const request = new NextRequest("http://localhost:3000/map", { headers: { cookie: "ctrl_sea_refresh=refresh-token" } });
    expect(middleware(request).headers.get("x-middleware-next")).toBe("1");
  });

  it("protects the analytics alias", () => {
    const response = middleware(new NextRequest("http://localhost:3000/analytics"));
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fanalytics");
  });

  it("protects the AI copilot page", () => {
    const response = middleware(new NextRequest("http://localhost:3000/ai"));
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fai");
  });

  it("allows report files to be served from public assets", () => {
    const response = middleware(new NextRequest("http://localhost:3000/reports/ctrl-sea-dashboard.pbix"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
