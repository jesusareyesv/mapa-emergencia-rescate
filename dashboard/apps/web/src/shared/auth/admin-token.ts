/**
 * Admin token helper (server-side).
 *
 * Reads the x-admin-token header from an incoming request and returns its value,
 * or null when the header is absent or empty.
 *
 * This is intentionally minimal (YAGNI): Task 9 gateways will forward this token
 * downstream as x-admin-token when calling the emergency API.
 */

export const ADMIN_TOKEN_HEADER = "x-admin-token";

/**
 * Extracts the admin token from an incoming Request.
 *
 * @returns The token string if present and non-empty, null otherwise.
 */
export function getAdminToken(request: Request): string | null {
  const value = request.headers.get(ADMIN_TOKEN_HEADER);
  if (!value || value.trim() === "") {
    return null;
  }
  return value.trim();
}
