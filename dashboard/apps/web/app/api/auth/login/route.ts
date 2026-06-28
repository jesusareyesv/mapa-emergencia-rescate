/**
 * BFF auth login passthrough.
 *
 * Receives { password } from the browser, forwards it to the emergency API's
 * /api/admin/login endpoint, and returns a minimal response.
 *
 * - 200 { ok: true }  — emergency API accepted the password
 * - 401               — emergency API rejected the password
 * - 502               — emergency API is unreachable (network failure)
 * - 400               — client sent an invalid request body
 *
 * Never leaks internal backend error details to the browser.
 */

import { NextResponse } from "next/server";
import { getApiBaseUrl } from "../../../../src/config/api-registry";

export const dynamic = "force-dynamic";

const HEADERS = { "Cache-Control": "no-store" };

export async function POST(request: Request): Promise<NextResponse> {
  // --- 1. Parse and validate body ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: HEADERS });
  }

  const passwordCandidate =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>).password
      : undefined;

  if (typeof passwordCandidate !== "string" || passwordCandidate.length === 0) {
    return NextResponse.json(
      { error: "password is required and must be a non-empty string" },
      { status: 400, headers: HEADERS },
    );
  }

  const password = passwordCandidate;

  // --- 2. Forward to emergency API ---
  const baseUrl = getApiBaseUrl("emergency");
  const url = `${baseUrl}/api/admin/login`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
  } catch {
    // Network failure — do not expose internal details
    return NextResponse.json(
      { error: "Authentication service is unavailable. Please try again later." },
      { status: 502, headers: HEADERS },
    );
  }

  // --- 3. Map upstream status ---
  if (upstream.status === 401) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401, headers: HEADERS });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Authentication service returned an unexpected error." },
      { status: 502, headers: HEADERS },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: HEADERS });
}
