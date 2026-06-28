/**
 * BFF auth login passthrough.
 *
 * Receives { password } from the browser, forwards it to the emergency API's
 * /api/admin/login endpoint via HttpClient, and returns a minimal response.
 *
 * - 200 { ok: true }  — emergency API accepted the password
 * - 401               — emergency API rejected the password
 * - 502               — emergency API is unreachable or returned an unexpected error
 * - 400               — client sent an invalid request body
 *
 * Never leaks internal backend error details to the browser.
 *
 * Note: use-admin-session.ts (browser → this BFF, same-origin) is intentionally
 * NOT routed through HttpClient — that hook calls its own BFF and is a different
 * concern. HttpClient is for server → external API calls.
 */

import { NextResponse } from "next/server";
import { createHttpClient } from "../../../../src/shared/http/http-client";
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

  // --- 2. Forward to emergency API via HttpClient ---
  const client = createHttpClient({ baseUrl: getApiBaseUrl("emergency") });
  const result = await client.post("/api/admin/login", { password });

  // --- 3. Map Result → HTTP ---
  if (result.ok) {
    return NextResponse.json({ ok: true }, { status: 200, headers: HEADERS });
  }

  if (result.error.kind === "auth") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401, headers: HEADERS });
  }

  return NextResponse.json(
    { error: "Authentication service returned an unexpected error." },
    { status: 502, headers: HEADERS },
  );
}
