import { HttpResponse, http } from "msw";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { server } from "@repo/config/vitest/setup";
import { POST } from "@/app/api/auth/login/route";

const TEST_API_URL = "http://test-api.example.com";

beforeAll(() => {
  process.env.EMERGENCY_API_URL = TEST_API_URL;
});

afterAll(() => {
  delete process.env.EMERGENCY_API_URL;
});

function makeLoginRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  describe("valid login — emergency API returns 200", () => {
    it("returns 200 with { ok: true }", async () => {
      server.use(
        http.post(`${TEST_API_URL}/api/admin/login`, () =>
          HttpResponse.json({ token: "some-token" }, { status: 200 }),
        ),
      );

      const response = await POST(makeLoginRequest({ password: "correct-password" }));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ ok: true });
    });

    it("forwards { password } body to the upstream API", async () => {
      let capturedBody: unknown;
      server.use(
        http.post(`${TEST_API_URL}/api/admin/login`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ token: "some-token" }, { status: 200 });
        }),
      );

      await POST(makeLoginRequest({ password: "my-secret-pw" }));

      expect(capturedBody).toEqual({ password: "my-secret-pw" });
    });

    it("sets Cache-Control: no-store", async () => {
      server.use(
        http.post(`${TEST_API_URL}/api/admin/login`, () =>
          HttpResponse.json({ token: "some-token" }, { status: 200 }),
        ),
      );

      const response = await POST(makeLoginRequest({ password: "correct-password" }));

      expect(response.headers.get("Cache-Control")).toBe("no-store");
    });
  });

  describe("wrong password — emergency API returns 401", () => {
    it("returns 401", async () => {
      server.use(
        http.post(`${TEST_API_URL}/api/admin/login`, () =>
          HttpResponse.json({ message: "Unauthorized" }, { status: 401 }),
        ),
      );

      const response = await POST(makeLoginRequest({ password: "wrong-password" }));

      expect(response.status).toBe(401);
    });

    it("does not leak backend details in the response body", async () => {
      server.use(
        http.post(`${TEST_API_URL}/api/admin/login`, () =>
          HttpResponse.json({ message: "Internal auth detail" }, { status: 401 }),
        ),
      );

      const response = await POST(makeLoginRequest({ password: "wrong-password" }));
      const body = await response.json();

      expect(body).not.toHaveProperty("message", "Internal auth detail");
    });
  });

  describe("backend down — network failure", () => {
    it("returns 502 when emergency API is unreachable", async () => {
      server.use(http.post(`${TEST_API_URL}/api/admin/login`, () => HttpResponse.error()));

      const response = await POST(makeLoginRequest({ password: "any-password" }));

      expect(response.status).toBeGreaterThanOrEqual(502);
      expect(response.status).toBeLessThanOrEqual(503);
    });

    it("includes a clear error message without internal details", async () => {
      server.use(http.post(`${TEST_API_URL}/api/admin/login`, () => HttpResponse.error()));

      const response = await POST(makeLoginRequest({ password: "any-password" }));
      const body = await response.json();

      expect(body).toHaveProperty("error");
      expect(typeof body.error).toBe("string");
      expect(body.error.length).toBeGreaterThan(0);
    });
  });

  describe("invalid body — returns 400 without calling backend", () => {
    it("returns 400 when password is missing", async () => {
      // No MSW handler registered — if fetch is called, it would throw because
      // onUnhandledRequest: "error" is set in setup.ts.
      const response = await POST(makeLoginRequest({}));

      expect(response.status).toBe(400);
    });

    it("returns 400 when password is not a string", async () => {
      const response = await POST(makeLoginRequest({ password: 123 }));

      expect(response.status).toBe(400);
    });

    it("returns 400 when password is an empty string", async () => {
      const response = await POST(makeLoginRequest({ password: "" }));

      expect(response.status).toBe(400);
    });

    it("returns 400 when body is not valid JSON", async () => {
      const request = new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-valid-json{{{",
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
