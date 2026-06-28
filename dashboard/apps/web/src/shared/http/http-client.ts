/**
 * Domain-agnostic HTTP client factory.
 *
 * createHttpClient({ baseUrl, defaultHeaders? }) returns a client with:
 *   get<T>(path, opts?) => Promise<Result<T | NotModified>>
 *
 * Never throws — all error paths return Result.
 *
 * 304 design choice: a 304 response is treated as a successful, explicit
 * "not modified" signal rather than an error. The client returns
 * ok({ notModified: true }) so callers can branch without checking error kinds.
 * This keeps the type as Result<T | NotModifiedResult> and avoids forcing
 * callers into an error-handling path for a normal cache-hit scenario.
 */

import type { ApiError, Result } from "../result";
import { err, ok } from "../result";

export type NotModifiedResult = { notModified: true };

export type GetOptions = {
  headers?: Record<string, string>;
  etag?: string;
  signal?: AbortSignal;
};

export type HttpClientConfig = {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
};

export type HttpClient = {
  get<T>(path: string, opts?: GetOptions): Promise<Result<T | NotModifiedResult>>;
};

export function createHttpClient(config: HttpClientConfig): HttpClient {
  const { baseUrl, defaultHeaders = {} } = config;

  return {
    async get<T>(path: string, opts: GetOptions = {}): Promise<Result<T | NotModifiedResult>> {
      const headers: Record<string, string> = {
        ...defaultHeaders,
        ...opts.headers,
      };

      if (opts.etag !== undefined) {
        headers["If-None-Match"] = opts.etag;
      }

      let response: Response;
      try {
        response = await fetch(`${baseUrl}${path}`, {
          headers,
          signal: opts.signal,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Network request failed";
        return err<ApiError>({ kind: "network", message });
      }

      if (response.status === 304) {
        return ok<NotModifiedResult>({ notModified: true });
      }

      if (response.status === 401) {
        return err<ApiError>({ kind: "auth", status: 401, message: "Unauthorized" });
      }

      if (!response.ok) {
        return err<ApiError>({
          kind: "http",
          status: response.status,
          message: response.statusText || `HTTP error ${response.status}`,
        });
      }

      let data: T;
      try {
        data = (await response.json()) as T;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to parse response body";
        return err<ApiError>({ kind: "parse", message });
      }

      return ok<T>(data);
    },
  };
}
