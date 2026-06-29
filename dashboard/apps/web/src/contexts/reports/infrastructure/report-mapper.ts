/**
 * Mapper: raw DTO (unknown) → Result<Report>.
 *
 * Returns err({kind:"parse",...}) on invalid input instead of throwing.
 * Decouples the domain from the upstream API shape — only this file
 * needs updating if the API changes.
 */

import { REPORT_TYPES } from "../domain/report";
import type { Report, ReportType } from "../domain/report";
import type { Result } from "../../../shared/result";
import { ok, err } from "../../../shared/result";

const VALID_TYPES = new Set<string>(REPORT_TYPES);

function parseString(value: unknown, field: string): Result<string> {
  if (typeof value !== "string") {
    return err({
      kind: "parse",
      message: `report-mapper: expected string for "${field}", got ${typeof value}`,
    });
  }
  return ok(value);
}

function parseNumber(value: unknown, field: string): Result<number> {
  if (typeof value !== "number") {
    return err({
      kind: "parse",
      message: `report-mapper: expected number for "${field}", got ${typeof value}`,
    });
  }
  return ok(value);
}

function parseReportType(value: unknown): Result<ReportType> {
  if (typeof value !== "string" || !VALID_TYPES.has(value)) {
    return err({ kind: "parse", message: `report-mapper: unknown ReportType "${String(value)}"` });
  }
  return ok(value as ReportType);
}

/**
 * Maps a raw DTO object to a Result<Report>.
 * Returns err on missing/wrong-type fields; extra fields are silently ignored.
 */
export function toReport(dto: unknown): Result<Report> {
  if (typeof dto !== "object" || dto === null) {
    return err({ kind: "parse", message: "report-mapper: dto must be a non-null object" });
  }

  const raw = dto as Record<string, unknown>;

  const idResult = parseString(raw["id"], "id");
  if (!idResult.ok) return idResult;

  const typeResult = parseReportType(raw["type"]);
  if (!typeResult.ok) return typeResult;

  const latResult = parseNumber(raw["lat"], "lat");
  if (!latResult.ok) return latResult;

  const lngResult = parseNumber(raw["lng"], "lng");
  if (!lngResult.ok) return lngResult;

  const placeResult = parseString(raw["place"], "place");
  if (!placeResult.ok) return placeResult;

  const affectedResult = parseNumber(raw["affected"], "affected");
  if (!affectedResult.ok) return affectedResult;

  const needsResult = parseString(raw["needs"], "needs");
  if (!needsResult.ok) return needsResult;

  const confirmationsResult = parseNumber(raw["confirmations"], "confirmations");
  if (!confirmationsResult.ok) return confirmationsResult;

  const createdAtResult = parseNumber(raw["createdAt"], "createdAt");
  if (!createdAtResult.ok) return createdAtResult;

  const photoUrlRaw = raw["photoUrl"];
  let photoUrl: string | null;
  if (photoUrlRaw === null || photoUrlRaw === undefined) {
    photoUrl = null;
  } else {
    const photoUrlResult = parseString(photoUrlRaw, "photoUrl");
    if (!photoUrlResult.ok) return photoUrlResult;
    photoUrl = photoUrlResult.value;
  }

  return ok({
    id: idResult.value,
    type: typeResult.value,
    lat: latResult.value,
    lng: lngResult.value,
    place: placeResult.value,
    affected: affectedResult.value,
    needs: needsResult.value,
    photoUrl,
    confirmations: confirmationsResult.value,
    createdAt: createdAtResult.value,
  });
}
