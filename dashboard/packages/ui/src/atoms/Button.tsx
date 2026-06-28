import type { ButtonHTMLAttributes } from "react";

/** Variantes visuales del botón. */
export type ButtonVariant = "primary" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
  ghost:
    "bg-transparent text-blue-600 hover:bg-blue-50 focus-visible:ring-blue-500",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/**
 * Átomo Button — presentacional y agnóstico de dominio.
 * Usa utilidades Tailwind directas (sin tokens propios todavía).
 */
export function Button({
  variant = "primary",
  type = "button",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
