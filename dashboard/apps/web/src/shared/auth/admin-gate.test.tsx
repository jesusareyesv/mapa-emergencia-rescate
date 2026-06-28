import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, beforeEach } from "vitest";
import { server } from "@repo/config/vitest/setup";
import { AdminGate } from "./admin-gate";
import { renderWithProviders } from "../test-utils/render-with-providers";

describe("AdminGate", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  describe("when no token is stored", () => {
    it("shows the login form", () => {
      renderWithProviders(<AdminGate>content</AdminGate>);
      expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
    });

    it("does not render children", () => {
      renderWithProviders(<AdminGate>secret content</AdminGate>);
      expect(screen.queryByText("secret content")).not.toBeInTheDocument();
    });
  });

  describe("successful login", () => {
    it("renders children after correct password", async () => {
      server.use(
        http.post("/api/auth/login", () => HttpResponse.json({ ok: true }, { status: 200 })),
      );
      const user = userEvent.setup();
      renderWithProviders(<AdminGate>protected content</AdminGate>);

      await user.type(screen.getByLabelText("Contraseña"), "correct-password");
      await user.click(screen.getByRole("button", { name: /entrar/i }));

      await waitFor(() => {
        expect(screen.getByText("protected content")).toBeInTheDocument();
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
      renderWithProviders(<AdminGate>protected</AdminGate>);

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
      renderWithProviders(<AdminGate>protected</AdminGate>);

      await user.type(screen.getByLabelText("Contraseña"), "wrong-password");
      await user.click(screen.getByRole("button", { name: /entrar/i }));

      await waitFor(() => {
        expect(screen.queryByText("protected")).not.toBeInTheDocument();
      });
    });
  });
});
