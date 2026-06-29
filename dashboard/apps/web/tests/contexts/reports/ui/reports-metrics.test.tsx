import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, beforeEach } from "vitest";
import { server } from "@repo/config/vitest/setup";
import { ReportsMetrics } from "@/src/contexts/reports/ui/reports-metrics";
import { AdminPanel } from "@/app/admin-panel";
import { renderWithProviders } from "@/tests/_utils/render-with-providers";

const TOKEN_KEY = "dashboard:adminToken";

const SAMPLE_REPORTS = [
  {
    id: "r1",
    type: "critical",
    lat: 0,
    lng: 0,
    place: "A",
    affected: 10,
    needs: "water",
    photoUrl: null,
    confirmations: 1,
    createdAt: 1700000000000,
  },
  {
    id: "r2",
    type: "supplies",
    lat: 0,
    lng: 0,
    place: "B",
    affected: 5,
    needs: "food",
    photoUrl: null,
    confirmations: 0,
    createdAt: 1700000001000,
  },
  {
    id: "r3",
    type: "critical",
    lat: 0,
    lng: 0,
    place: "C",
    affected: 3,
    needs: "med",
    photoUrl: null,
    confirmations: 2,
    createdAt: 1700000002000,
  },
];

describe("ReportsMetrics", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("401 → logout (composition test)", () => {
    it("returns to the login form when /api/reports responds 401 while authenticated", async () => {
      // Pre-seed the token so AdminGate shows children (the metrics screen)
      sessionStorage.setItem(TOKEN_KEY, "valid-token");

      server.use(
        http.get("/api/reports", () =>
          HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
        ),
      );

      renderWithProviders(<AdminPanel />);

      // The login form (password input) should reappear after the 401 triggers logout
      await waitFor(() => {
        expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
      });
    });
  });

  describe("loading state", () => {
    it("shows a loading indicator initially", () => {
      server.use(
        http.get("/api/reports", () => new Promise(() => {})), // never resolves
      );
      renderWithProviders(<ReportsMetrics token="test-token" onUnauthorized={() => {}} />);
      expect(screen.getByText(/cargando|loading/i)).toBeInTheDocument();
    });
  });

  describe("success state", () => {
    it("shows total report count", async () => {
      server.use(http.get("/api/reports", () => HttpResponse.json(SAMPLE_REPORTS)));
      renderWithProviders(<ReportsMetrics token="test-token" onUnauthorized={() => {}} />);

      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument();
      });
    });

    it("shows total affected count", async () => {
      server.use(http.get("/api/reports", () => HttpResponse.json(SAMPLE_REPORTS)));
      renderWithProviders(<ReportsMetrics token="test-token" onUnauthorized={() => {}} />);

      await waitFor(() => {
        expect(screen.getByText("18")).toBeInTheDocument(); // 10+5+3
      });
    });

    it("forwards x-admin-token header", async () => {
      let capturedToken: string | null = null;
      server.use(
        http.get("/api/reports", ({ request }) => {
          capturedToken = request.headers.get("x-admin-token");
          return HttpResponse.json([]);
        }),
      );
      renderWithProviders(<ReportsMetrics token="my-secret-token" onUnauthorized={() => {}} />);

      await waitFor(() => {
        expect(capturedToken).toBe("my-secret-token");
      });
    });
  });

  describe("error state", () => {
    it("shows an error message when BFF returns 500", async () => {
      server.use(
        http.get("/api/reports", () =>
          HttpResponse.json({ error: "Internal Server Error" }, { status: 500 }),
        ),
      );
      renderWithProviders(<ReportsMetrics token="test-token" onUnauthorized={() => {}} />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});
