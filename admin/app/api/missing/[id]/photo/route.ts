import { NextResponse } from "next/server";
import { getApiBaseUrl } from "../../../../../src/config/api-registry";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await ctx.params;
  const backendUrl = `${getApiBaseUrl("emergency")}/api/missing/${id}/photo`;

  try {
    const res = await fetch(backendUrl, {
      redirect: "manual",
    });

    if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
      return Response.redirect(res.headers.get("location") || "", res.status);
    }

    if (!res.ok) {
      return new Response(null, { status: res.status });
    }

    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": res.headers.get("Cache-Control") || "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new Response(null, { status: 502 });
  }
}
