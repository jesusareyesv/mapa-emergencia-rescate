/**
 * Mapper: raw DTO (unknown) → Report domain object.
 *
 * Decouples the domain from the upstream API shape.
 * If the API changes, only this file needs updating.
 */

import type { Report, ReportType } from "../domain/report";

const VALID_TYPES = new Set<string>([
  "critical",
  "supplies",
  "shelter",
  "nopower",
  "missing",
  "building",
  "starlink",
]);

function assertString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`report-mapper: expected string for "${field}", got ${typeof value}`);
  }
  return value;
}

function assertNumber(value: unknown, field: string): number {
  if (typeof value !== "number") {
    throw new Error(`report-mapper: expected number for "${field}", got ${typeof value}`);
  }
  return value;
}

function assertReportType(value: unknown): ReportType {
  if (typeof value !== "string" || !VALID_TYPES.has(value)) {
    throw new Error(`report-mapper: unknown ReportType "${String(value)}"`);
  }
  return value as ReportType;
}

/**
 * Maps a raw DTO object to a Report domain model.
 * Throws if required fields are missing or have the wrong type.
 * Extra fields are silently ignored.
 */
export function toReport(dto: unknown): Report {
  if (typeof dto !== "object" || dto === null) {
    throw new Error("report-mapper: dto must be a non-null object");
  }

  const raw = dto as Record<string, unknown>;

  const photoUrlRaw = raw["photoUrl"];
  const photoUrl: string | null =
    photoUrlRaw === null || photoUrlRaw === undefined
      ? null
      : assertString(photoUrlRaw, "photoUrl");

  return {
    id: assertString(raw["id"], "id"),
    type: assertReportType(raw["type"]),
    lat: assertNumber(raw["lat"], "lat"),
    lng: assertNumber(raw["lng"], "lng"),
    place: assertString(raw["place"], "place"),
    affected: assertNumber(raw["affected"], "affected"),
    needs: assertString(raw["needs"], "needs"),
    photoUrl,
    confirmations: assertNumber(raw["confirmations"], "confirmations"),
    createdAt: assertNumber(raw["createdAt"], "createdAt"),
  };
}
