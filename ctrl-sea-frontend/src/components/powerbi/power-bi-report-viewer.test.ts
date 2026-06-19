import { describe, expect, it } from "vitest";
import { secureEmbedUrl } from "./power-bi-utils";

describe("secureEmbedUrl", () => {
  it("rejects non-HTTP embed schemes", () => {
    expect(secureEmbedUrl("javascript:alert(1)")).toBeNull();
  });

  it("adds page, filter, and theme parameters to HTTPS reports", () => {
    const value = secureEmbedUrl("https://app.powerbi.com/reportEmbed?id=1", "Summary", { country: "EGY" });
    expect(value).toContain("pageName=Summary");
    expect(value).toContain("filter.country=EGY");
    expect(value).toContain("theme=ctrl-sea-dark");
  });
});
