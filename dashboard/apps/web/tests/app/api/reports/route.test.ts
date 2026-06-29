import { HttpResponse, http } from "msw";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { server } from "@repo/config/vitest/setup";
import { GET } from "@/app/api/reports/route";

const TEST_API_URL = "http://test-emergency.example.com";

const REPORT_DTO = {
  id: "r1",
  type: "supplies",
  lat: 39.47,
  lng: -0.38,
  place: "Valencia",
  affected: 3,
  needs: "Blankets",
  photoUrl: "/api/photos/r1",
  confirmations: 0,
  createdAt: 1700000000000,
};

const ADMIN_DATA_RESPONSE = {
  generatedAt: Date.now(),
  persistent: true,
  stats: {},
  reports: [REPORT_DTO],
  messages: [],
  people: [],
  sync: { runs: [], state: [] },
};

function makeRequest(token: string | null): Request {
  const headers: Record<string, string> = {};
  if (token !== null) {
    headers["x-admin-token"] = token;
  }
  return new Request("http://localhost/api/reports", { headers });
}

beforeAll(() => {
  process.env.EMERGENCY_API_URL = TEST_API_URL;
});

afterAll(() => {
  delete process.env.EMERGENCY_API_URL;
});

describe("GET /api/reports", () => {
  describe("success — returns mapped Report[]", () => {
    it("returns 200 with domain Report[] when upstream responds 200", async () => {
      server.use(
        http.get(`${TEST_API_URL}/api/admin/data`, () => HttpResponse.json(ADMIN_DATA_RESPONSE)),
      );

      const response = await GET(makeRequest("my-token"));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe("r1");
      expect(body[0].type).toBe("supplies");
      expect(body[0].photoUrl).toBe("/api/photos/r1");
    });

    it("sets Cache-Control: no-store", async () => {
      server.use(
        http.get(`${TEST_API_URL}/api/admin/data`, () => HttpResponse.json(ADMIN_DATA_RESPONSE)),
      );

      const response = await GET(makeRequest("my-token"));

      expect(response.headers.get("Cache-Control")).toBe("no-store");
    });
  });

  describe("missing token — returns 401 without calling upstream", () => {
    it("returns 401 when x-admin-token header is absent", async () => {
      // No MSW handler — if fetch is called, MSW would throw (onUnhandledRequest: "error")
      const response = await GET(makeRequest(null));

      expect(response.status).toBe(401);
    });
  });

  describe("upstream returns 401 — token invalid", () => {
    it("returns 401 when emergency API rejects the token", async () => {
      server.use(
        http.get(`${TEST_API_URL}/api/admin/data`, () =>
          HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
        ),
      );

      const response = await GET(makeRequest("bad-token"));

      expect(response.status).toBe(401);
    });
  });

  describe("network failure — returns 502", () => {
    it("returns 502 when emergency API is unreachable", async () => {
      server.use(http.get(`${TEST_API_URL}/api/admin/data`, () => HttpResponse.error()));

      const response = await GET(makeRequest("my-token"));

      expect(response.status).toBe(502);
    });
  });
});
