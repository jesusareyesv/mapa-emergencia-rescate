import { afterEach, describe, expect, it, vi } from "vitest";
import { getApiBaseUrl } from "@/src/config/api-registry";

describe("getApiBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns EMERGENCY_API_URL for 'emergency' id", () => {
    vi.stubEnv("EMERGENCY_API_URL", "https://emergency.example.com");
    expect(getApiBaseUrl("emergency")).toBe("https://emergency.example.com");
  });

  it("returns SUPPLIES_API_URL for 'supplies' id", () => {
    vi.stubEnv("SUPPLIES_API_URL", "https://supplies.example.com");
    expect(getApiBaseUrl("supplies")).toBe("https://supplies.example.com");
  });

  it("throws a clear error when EMERGENCY_API_URL is not set", () => {
    vi.stubEnv("EMERGENCY_API_URL", undefined);
    expect(() => getApiBaseUrl("emergency")).toThrow("EMERGENCY_API_URL is not set");
  });

  it("throws a clear error when SUPPLIES_API_URL is not set", () => {
    vi.stubEnv("SUPPLIES_API_URL", undefined);
    expect(() => getApiBaseUrl("supplies")).toThrow("SUPPLIES_API_URL is not set");
  });
});
