import { describe, expect, it } from "vitest";
import { ADMIN_TOKEN_HEADER, getAdminToken } from "./admin-token";

describe("getAdminToken", () => {
  it("returns the token value when x-admin-token header is present", () => {
    const request = new Request("http://localhost/api/test", {
      headers: { [ADMIN_TOKEN_HEADER]: "my-secret-token" },
    });

    const token = getAdminToken(request);

    expect(token).toBe("my-secret-token");
  });

  it("returns null when x-admin-token header is absent", () => {
    const request = new Request("http://localhost/api/test");

    const token = getAdminToken(request);

    expect(token).toBeNull();
  });

  it("returns null when x-admin-token header is an empty string", () => {
    const request = new Request("http://localhost/api/test", {
      headers: { [ADMIN_TOKEN_HEADER]: "" },
    });

    const token = getAdminToken(request);

    expect(token).toBeNull();
  });

  it("ADMIN_TOKEN_HEADER constant equals 'x-admin-token'", () => {
    expect(ADMIN_TOKEN_HEADER).toBe("x-admin-token");
  });
});
