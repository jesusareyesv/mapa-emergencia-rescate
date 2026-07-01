import { NextResponse } from "next/server";
import { getApiBaseUrl } from "../../../src/config/api-registry";
import { BFF_CACHE_HEADERS } from "../_shared/bff-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get("status") || "all";
  const page = searchParams.get("page") || "1";
  const pageSize = searchParams.get("pageSize") || "12";
  const q = searchParams.get("q");

  const backendUrl = new URL(getApiBaseUrl("emergency") + "/api/missing");
  backendUrl.searchParams.set("status", status);
  backendUrl.searchParams.set("page", page);
  backendUrl.searchParams.set("pageSize", pageSize);
  if (q && q.length >= 3) {
    backendUrl.searchParams.set("q", q);
  }

  try {
    const res = await fetch(backendUrl.toString(), {
      // Usamos el header de autorización si existiera, pero esta API es pública
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${res.status}` },
        { status: res.status === 404 ? 404 : 502, headers: BFF_CACHE_HEADERS }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200, headers: BFF_CACHE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: "Upstream service error" },
      { status: 502, headers: BFF_CACHE_HEADERS }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const backendUrl = new URL(getApiBaseUrl("emergency") + "/api/missing");
  
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const res = await fetch(backendUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        errorData || { error: `Upstream error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Upstream service error" },
      { status: 502 }
    );
  }
}
