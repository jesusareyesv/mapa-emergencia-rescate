/**
 * API registry — maps logical API identifiers to base URLs read from env.
 *
 * Throws a clear configuration error at startup if a required env var is missing.
 * This throw is intentional: a missing base URL is a deployment misconfiguration,
 * not a runtime error that should be silently swallowed.
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
  return value;
}
