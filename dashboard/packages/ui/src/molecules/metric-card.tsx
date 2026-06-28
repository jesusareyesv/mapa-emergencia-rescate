export interface MetricCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
}

/**
 * MetricCard molecule — domain-agnostic metric display.
 * Presentational: shows a label, a prominent value, and an optional sub-line.
 */
export function MetricCard({ label, value, sub }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      {sub !== undefined && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
