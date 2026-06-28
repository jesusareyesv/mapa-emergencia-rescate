import { NextResponse } from "next/server";

// Force dynamic so Next never pre-renders/caches this route at build time.
export const dynamic = "force-dynamic";

/**
 * Kubernetes liveness / readiness probe.
 *
 * Health is intentionally decoupled from upstream services (emergency API,
 * etc.): if a dependency is down the dashboard should stay Ready so users see
 * the error in the UI, not a traffic-less pod.
 */
export function GET(): NextResponse {
  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
