/**
 * Domain model for an emergency report.
 *
 * ReportType mirrors the keys defined in the root repo's lib/types.ts.
 * Replicated here — no import from the root repo (separate project boundary).
 */

export type ReportType =
  "critical" | "supplies" | "shelter" | "nopower" | "missing" | "building" | "starlink";

export interface Report {
  id: string;
  type: ReportType;
  lat: number;
  lng: number;
  place: string;
  affected: number;
  needs: string;
  photoUrl: string | null;
  confirmations: number;
  createdAt: number;
}
