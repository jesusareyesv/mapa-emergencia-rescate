/**
 * Domain model for an emergency report.
 *
 * ReportType mirrors the keys defined in the root repo's lib/types.ts.
 * Replicated here — no import from the root repo (separate project boundary).
 *
 * REPORT_TYPES is the single source of truth; the ReportType union is derived
 * from it so adding a new type only requires touching this file.
 */

export const REPORT_TYPES = [
  "critical",
  "supplies",
  "shelter",
  "nopower",
  "missing",
  "building",
  "starlink",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

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
