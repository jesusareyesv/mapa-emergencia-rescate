import { describe, expect, it, afterEach } from "vitest";
import { getApiBaseUrl } from "@/src/config/api-registry";

describe("getApiBaseUrl", () => {
  afterEach(() => {
    delete process.env.EMERGENCY_API_URL;
    delete process.env.SUPPLIES_API_URL;
  });

  it("returns the URL when env var is set", () => {
    process.env.EMERGENCY_API_URL = "https://api.example.com";
    expect(getApiBaseUrl("emergency")).toBe("https://api.example.com");
  });

  it("strips a trailing slash from the URL", () => {
    process.env.EMERGENCY_API_URL = "https://api.example.com/";
    expect(getApiBaseUrl("emergency")).toBe("https://api.example.com");
  });

  it("strips multiple trailing slashes from the URL", () => {
    process.env.EMERGENCY_API_URL = "https://api.example.com//";
    expect(getApiBaseUrl("emergency")).toBe("https://api.example.com");
  });

  it("throws a clear error when the env var is not set", () => {
    delete process.env.EMERGENCY_API_URL;
    expect(() => getApiBaseUrl("emergency")).toThrow("EMERGENCY_API_URL is not set");
  });

  it("throws a clear error when the value is not a valid URL", () => {
    process.env.EMERGENCY_API_URL = "not-a-url";
    expect(() => getApiBaseUrl("emergency")).toThrow(
      "EMERGENCY_API_URL is not a valid URL: not-a-url",
    );
  });

  it("throws a clear error for relative-path values", () => {
    process.env.SUPPLIES_API_URL = "/relative/path";
    expect(() => getApiBaseUrl("supplies")).toThrow(
      "SUPPLIES_API_URL is not a valid URL: /relative/path",
    );
  });

  it("works for the supplies API id", () => {
    process.env.SUPPLIES_API_URL = "https://supplies.example.com/v1/";
    expect(getApiBaseUrl("supplies")).toBe("https://supplies.example.com/v1");
  });
});
