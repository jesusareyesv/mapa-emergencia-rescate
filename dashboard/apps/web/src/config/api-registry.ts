/**
 * API registry — maps logical API identifiers to base URLs read from env.
 *
 * Throws a clear configuration error at startup if a required env var is missing
 * or if the value is not a valid absolute URL.
 * Trailing slashes are stripped to avoid double-slash paths (e.g. https://x//api/…).
 */

export type ApiId = "emergency" | "supplies";

const ENV_KEYS: Record<ApiId, string> = {
  emergency: "EMERGENCY_API_URL",
  supplies: "SUPPLIES_API_URL",
};

export function getApiBaseUrl(id: ApiId): string {
  const envKey = ENV_KEYS[id];
  const value = process.env[envKey];
  if (!value) {
    throw new Error(`${envKey} is not set`);
  }
  try {
    new URL(value);
  } catch {
    throw new Error(`${envKey} is not a valid URL: ${value}`);
  }
  return value.replace(/\/+$/, "");
}
