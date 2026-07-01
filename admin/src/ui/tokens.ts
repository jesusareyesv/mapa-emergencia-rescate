/**
 * Design-system tokens for @/src/ui atoms.
 *
 * Uses CSS variables from globals.css (brand-navy, crisis-red, etc.) so atoms
 * stay visually consistent with the public site design system (DESIGN.md).
 */

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export const buttonBase =
  "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50 transition-colors";

export const buttonVariants = {
  primary:
    "bg-navy text-on-dark hover:bg-[#0e3352] focus-visible:ring-brand-blue",
  ghost:
    "bg-transparent text-brand-blue hover:bg-blue-50 focus-visible:ring-brand-blue",
  danger:
    "bg-crisis text-on-dark hover:bg-crisis-h focus-visible:ring-red-500",
} as const;

// ---------------------------------------------------------------------------
// MetricCard
// ---------------------------------------------------------------------------

export const metricCardShell =
  "rounded-xl border border-border bg-surface p-4 shadow-sm";
export const metricCardLabel = "text-xs font-semibold uppercase tracking-wide text-etext-muted";
export const metricCardValue = "mt-1 text-3xl font-bold text-etext";
export const metricCardSub   = "mt-0.5 text-xs text-etext-soft";

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export const inputBase =
  "block w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-etext " +
  "placeholder:text-etext-soft " +
  "focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:border-brand-blue " +
  "disabled:pointer-events-none disabled:opacity-50";
export const inputLabel = "mb-1 block text-sm font-medium text-etext";
