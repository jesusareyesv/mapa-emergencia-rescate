import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, beforeEach } from "vitest";
import { server } from "@repo/config/vitest/setup";
import { AdminPanel } from "@/app/admin-panel";
import { renderWithProviders } from "@/tests/_utils/render-with-providers";

/**
 * AdminGate integration tests.
 *
 * AdminPanel composes AdminSessionProvider + AdminGate, so we test via AdminPanel
 * (same composition that exists in the real app) rather than mounting AdminGate
 * in isolation — AdminGate requires the session context to be provided.
 */
describe("AdminGate", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  describe("when no token is stored", () => {
    it("shows the login form", () => {
      renderWithProviders(<AdminPanel />);
      expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
    });

    it("does not render children", () => {
      renderWithProviders(<AdminPanel />);
      // AdminPanelInner (metrics) is not rendered — no metric labels
      expect(screen.queryByText(/total reportes/i)).not.toBeInTheDocument();
    });
  });

  describe("successful login", () => {
    it("renders children after correct password", async () => {
      server.use(
        http.post("/api/auth/login", () => HttpResponse.json({ ok: true }, { status: 200 })),
        http.get("/api/reports", () => new Promise(() => {})), // keep in loading state
      );
      const user = userEvent.setup();
      renderWithProviders(<AdminPanel />);

      await user.type(screen.getByLabelText("Contraseña"), "correct-password");
      await user.click(screen.getByRole("button", { name: /entrar/i }));

      await waitFor(() => {
        expect(screen.getByText(/cargando/i)).toBeInTheDocument();
      });
    });
  });

  describe("failed login", () => {
    it("shows error message on wrong password", async () => {
      server.use(
        http.post("/api/auth/login", () =>
          HttpResponse.json({ error: "Invalid credentials" }, { status: 401 }),
        ),
      );
      const user = userEvent.setup();
      renderWithProviders(<AdminPanel />);

      await user.type(screen.getByLabelText("Contraseña"), "wrong-password");
      await user.click(screen.getByRole("button", { name: /entrar/i }));

      await waitFor(() => {
        expect(screen.getByText(/credenciales inválidas|error|invalid/i)).toBeInTheDocument();
      });
    });

    it("does not show children on failed login", async () => {
      server.use(
        http.post("/api/auth/login", () =>
          HttpResponse.json({ error: "Invalid credentials" }, { status: 401 }),
        ),
      );
      const user = userEvent.setup();
      renderWithProviders(<AdminPanel />);

      await user.type(screen.getByLabelText("Contraseña"), "wrong-password");
      await user.click(screen.getByRole("button", { name: /entrar/i }));

      await waitFor(() => {
        expect(screen.queryByText(/total reportes/i)).not.toBeInTheDocument();
      });
    });
  });
});
