import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@repo/config/vitest/setup";
import { createHttpClient } from "./http-client";

const BASE_URL = "http://test-api.example.com";

describe("HttpClient", () => {
  describe("200 ok — returns parsed JSON", () => {
    it("returns ok result with parsed body", async () => {
      server.use(http.get(`${BASE_URL}/data`, () => HttpResponse.json({ id: 1, name: "test" })));

      const client = createHttpClient({ baseUrl: BASE_URL });
      const result = await client.get<{ id: number; name: string }>("/data");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ id: 1, name: "test" });
      }
    });
  });

  describe("401 auth error", () => {
    it("returns err with kind=auth and status=401", async () => {
      server.use(
        http.get(`${BASE_URL}/protected`, () =>
          HttpResponse.json({ message: "Unauthorized" }, { status: 401 }),
        ),
      );

      const client = createHttpClient({ baseUrl: BASE_URL });
      const result = await client.get("/protected");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("auth");
        expect(result.error.status).toBe(401);
      }
    });
  });

  describe("500 server error", () => {
    it("returns err with kind=http and status=500", async () => {
      server.use(
        http.get(`${BASE_URL}/error`, () =>
          HttpResponse.json({ message: "Internal Server Error" }, { status: 500 }),
        ),
      );

      const client = createHttpClient({ baseUrl: BASE_URL });
      const result = await client.get("/error");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("http");
        expect(result.error.status).toBe(500);
      }
    });
  });

  describe("304 not-modified (ETag)", () => {
    it("returns ok result with notModified=true when server responds 304", async () => {
      server.use(
        http.get(`${BASE_URL}/resource`, ({ request }) => {
          const ifNoneMatch = request.headers.get("If-None-Match");
          if (ifNoneMatch === '"abc123"') {
            return new HttpResponse(null, { status: 304 });
          }
          return HttpResponse.json({ data: "fresh" });
        }),
      );

      const client = createHttpClient({ baseUrl: BASE_URL });
      const result = await client.get("/resource", { etag: '"abc123"' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect((result.value as { notModified: boolean }).notModified).toBe(true);
      }
    });

    it("sends If-None-Match header when etag is provided", async () => {
      let capturedIfNoneMatch: string | null = null;
      server.use(
        http.get(`${BASE_URL}/resource`, ({ request }) => {
          capturedIfNoneMatch = request.headers.get("If-None-Match");
          return new HttpResponse(null, { status: 304 });
        }),
      );

      const client = createHttpClient({ baseUrl: BASE_URL });
      await client.get("/resource", { etag: '"etag-value"' });

      expect(capturedIfNoneMatch).toBe('"etag-value"');
    });
  });

  describe("network failure", () => {
    it("returns err with kind=network when fetch rejects", async () => {
      server.use(http.get(`${BASE_URL}/offline`, () => HttpResponse.error()));

      const client = createHttpClient({ baseUrl: BASE_URL });
      const result = await client.get("/offline");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("network");
      }
    });
  });

  describe("parse error — invalid JSON in 2xx body", () => {
    it("returns err with kind=parse when body is not valid JSON", async () => {
      server.use(
        http.get(
          `${BASE_URL}/bad-json`,
          () =>
            new HttpResponse("not-json{{{", {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
        ),
      );

      const client = createHttpClient({ baseUrl: BASE_URL });
      const result = await client.get("/bad-json");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("parse");
      }
    });
  });

  describe("defaultHeaders", () => {
    it("merges defaultHeaders into every request", async () => {
      let capturedAuth: string | null = null;
      server.use(
        http.get(`${BASE_URL}/secure`, ({ request }) => {
          capturedAuth = request.headers.get("Authorization");
          return HttpResponse.json({ ok: true });
        }),
      );

      const client = createHttpClient({
        baseUrl: BASE_URL,
        defaultHeaders: { Authorization: "Bearer token123" },
      });
      await client.get("/secure");

      expect(capturedAuth).toBe("Bearer token123");
    });
  });

  describe("other non-ok status codes", () => {
    it("returns err with kind=http for 403", async () => {
      server.use(
        http.get(`${BASE_URL}/forbidden`, () =>
          HttpResponse.json({ message: "Forbidden" }, { status: 403 }),
        ),
      );

      const client = createHttpClient({ baseUrl: BASE_URL });
      const result = await client.get("/forbidden");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("http");
        expect(result.error.status).toBe(403);
      }
    });
  });
});
