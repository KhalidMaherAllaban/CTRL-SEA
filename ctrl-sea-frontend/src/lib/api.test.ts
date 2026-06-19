import { describe, expect, it } from "vitest";

import { api } from "@/lib/api";

describe("api client", () => {
  it("uses the Next.js API proxy with secure browser credentials", () => {
    expect(api.defaults.baseURL).toBe("/api");
    expect(api.defaults.withCredentials).toBe(true);
  });
});
