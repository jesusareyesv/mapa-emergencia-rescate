import type { InputHTMLAttributes } from "react";
import { inputBase, inputLabel } from "../tokens";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional accessible label rendered as a <label> element. */
  label?: string;
}

/**
 * Átomo Input — controlled, accessible, domain-agnostic.
 *
 * Renders a native <input> with an optional associated <label>.
 * All standard HTML input attributes are forwarded (value, onChange, type, …).
 * Default type is "text".
 */
export function Input({
  label,
  id,
  type = "text",
  className = "",
  ...rest
}: InputProps) {
  const inputId =
    id ??
    (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className={inputLabel}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={[inputBase, className].filter(Boolean).join(" ")}
        {...rest}
      />
    </div>
  );
}
