import { HttpResponse, http } from "msw";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { server } from "@repo/config/vitest/setup";
import { createHttpReportsGateway } from "@/src/contexts/reports/infrastructure/http-reports-gateway";

const TEST_API_URL = "http://test-emergency.example.com";
const TEST_TOKEN = "valid-admin-token";

const REPORT_DTO = {
  id: "r1",
  type: "critical",
  lat: 39.47,
  lng: -0.38,
  place: "Valencia",
  affected: 10,
  needs: "Food",
  photoUrl: null,
  confirmations: 2,
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

beforeAll(() => {
  process.env.EMERGENCY_API_URL = TEST_API_URL;
});

afterAll(() => {
  delete process.env.EMERGENCY_API_URL;
});

describe("HttpReportsGateway", () => {
  describe("list — success", () => {
    it("returns ok with mapped Report[] when the upstream returns 200", async () => {
      server.use(
        http.get(`${TEST_API_URL}/api/admin/data`, () => HttpResponse.json(ADMIN_DATA_RESPONSE)),
      );

      const gateway = createHttpReportsGateway();
      const result = await gateway.list(TEST_TOKEN);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]!.id).toBe("r1");
        expect(result.value[0]!.type).toBe("critical");
        expect(result.value[0]!.photoUrl).toBeNull();
      }
    });

    it("forwards x-admin-token header to the upstream", async () => {
      let capturedToken: string | null = null;
      server.use(
        http.get(`${TEST_API_URL}/api/admin/data`, ({ request }) => {
          capturedToken = request.headers.get("x-admin-token");
          return HttpResponse.json(ADMIN_DATA_RESPONSE);
        }),
      );

      const gateway = createHttpReportsGateway();
      await gateway.list(TEST_TOKEN);

      expect(capturedToken).toBe(TEST_TOKEN);
    });
  });

  describe("list — auth error", () => {
    it("returns err with kind=auth when upstream returns 401", async () => {
      server.use(
        http.get(`${TEST_API_URL}/api/admin/data`, () =>
          HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
        ),
      );

      const gateway = createHttpReportsGateway();
      const result = await gateway.list(TEST_TOKEN);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("auth");
      }
    });
  });

  describe("list — network failure", () => {
    it("returns err with kind=network when the upstream is unreachable", async () => {
      server.use(http.get(`${TEST_API_URL}/api/admin/data`, () => HttpResponse.error()));

      const gateway = createHttpReportsGateway();
      const result = await gateway.list(TEST_TOKEN);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("network");
      }
    });
  });
});
