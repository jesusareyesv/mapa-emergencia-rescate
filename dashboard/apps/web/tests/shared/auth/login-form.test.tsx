import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/src/shared/auth/login-form";

describe("LoginForm", () => {
  it("renders the Input atom with label 'Contraseña'", () => {
    render(<LoginForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
  });

  it("renders the Button atom with text 'Entrar'", () => {
    render(<LoginForm onSubmit={vi.fn()} />);
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("calls onSubmit with the typed password", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText("Contraseña"), "mypassword");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(handleSubmit).toHaveBeenCalledWith("mypassword");
  });

  it("shows error message after onSubmit rejects", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockRejectedValue(new Error("401"));

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText("Contraseña"), "wrong");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
    });
  });

  it("does not display an error before any submission", () => {
    render(<LoginForm onSubmit={vi.fn()} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("disables the button and shows 'Entrando...' while onSubmit is in progress", async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    const handleSubmit = vi.fn(
      () =>
        new Promise<void>((res) => {
          resolve = res;
        }),
    );

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText("Contraseña"), "pass");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(screen.getByRole("button", { name: /entrando/i })).toBeDisabled();

    // Clean up: resolve the promise so the component settles
    resolve();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
    });
  });

  it("uses the Input atom (no raw <input> with hand-rolled Tailwind)", () => {
    const { container } = render(<LoginForm onSubmit={vi.fn()} />);
    // The Input atom wraps the native input in a <div> with a <label>
    expect(container.querySelector("label")).toBeInTheDocument();
    // No inline className on the raw input (the atom handles styling)
    const input = container.querySelector("input");
    expect(input).toBeInTheDocument();
    // The atom adds its own classes (from tokens.ts), not ad-hoc Tailwind
    expect(input?.className).toContain("rounded-md");
  });
});
