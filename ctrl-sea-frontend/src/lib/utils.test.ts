import { describe, expect, it } from "vitest";
import { formatMetric, formatNumber, formatPercent, formatUsd } from "@/lib/utils";

describe("executive number formatting", () => {
  it("formats warehouse magnitudes without raw values", () => {
    expect(formatMetric(1_500)).toBe("1.5K");
    expect(formatMetric(1_250_000)).toBe("1.25M");
    expect(formatMetric(2_100_000_000)).toBe("2.1B");
  });

  it("formats currency, percentages, and locale-aware decimals", () => {
    expect(formatUsd(1_250_000)).toBe("$1.25M");
    expect(formatPercent(12.34)).toBe("12.3%");
    expect(formatNumber(1234.56)).toBe("1,234.56");
  });
});
