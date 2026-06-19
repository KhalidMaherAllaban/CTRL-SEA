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
});
