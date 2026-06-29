import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import Page from "@/app/page";

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("Home page", () => {
  it("renders the admin panel heading in Spanish", () => {
    render(<Page />, { wrapper });
    expect(screen.getByRole("heading", { name: "Panel de administración" })).toBeInTheDocument();
  });

  it("shows the login form when no token is stored", () => {
    render(<Page />, { wrapper });
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });
});
