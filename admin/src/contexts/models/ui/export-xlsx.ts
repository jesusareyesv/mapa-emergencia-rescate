import { exportColumns, formatCellForExport } from "./table-state";
import type { ModelColumn } from "../model-registry";
import type { ModelRow } from "../application/models-gateway";

export interface XlsxMeta {
  title: string;
  subtitle?: string;
  kpis?: { label: string; value: string | number }[];
}

const NAVY   = "FF1E1E2E";
const WHITE  = "FFFFFFFF";
const CRISIS = "FFC41A1A";
const SOFT   = "FF94A3B8";
const DATA   = "FF334155";
const ALT    = "FFF7F8FB";
const BORDER = "FFE5E9F0";

export async function downloadXlsx(
  filename: string,
  meta: XlsxMeta,
  rows: ModelRow[],
  columns: ModelColumn[],
): Promise<void> {
  if (typeof document === "undefined") return;

  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "TERREMOTOVENEZUELA.APP";
  const ws = wb.addWorksheet("Reportes");

  const cols = exportColumns(columns);

  ws.columns = cols.map((col) => {
    const maxLen = Math.max(
      col.label.length,
      ...rows.slice(0, 200).map((row) => String(formatCellForExport(col, row[col.key])).length),
    );
    return { width: Math.min(maxLen + 2, 40) };
  });

  let r = 1;

  // ── Título ──
  if (cols.length > 1) ws.mergeCells(r, 1, r, cols.length);
  const titleCell = ws.getCell(r, 1);
  titleCell.value = `TERREMOTOVENEZUELA.APP — ${meta.title}`;
  titleCell.font = { bold: true, size: 13, color: { argb: NAVY } };
  r++;

  // ── Fecha de generación ──
  const now = new Date().toLocaleString("es", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  if (cols.length > 1) ws.mergeCells(r, 1, r, cols.length);
  const dateCell = ws.getCell(r, 1);
  dateCell.value = `Generado: ${now}`;
  dateCell.font = { size: 8, italic: true, color: { argb: SOFT } };
  r++;

  // ── Filtros activos ──
  if (meta.subtitle) {
    if (cols.length > 1) ws.mergeCells(r, 1, r, cols.length);
    const filterCell = ws.getCell(r, 1);
    filterCell.value = `Filtros: ${meta.subtitle}`;
    filterCell.font = { size: 8, italic: true, color: { argb: SOFT } };
    r++;
  }

  r++; // separador

  // ── KPIs ──
  if (meta.kpis && meta.kpis.length > 0) {
    meta.kpis.forEach((k, ci) => {
      const c = ws.getCell(r, ci + 1);
      c.value = k.label.toUpperCase();
      c.font = { bold: true, size: 7, color: { argb: SOFT } };
    });
    r++;
    meta.kpis.forEach((k, ci) => {
      const c = ws.getCell(r, ci + 1);
      c.value = typeof k.value === "number" ? k.value : String(k.value);
      c.font = { bold: true, size: 14, color: { argb: NAVY } };
    });
    ws.getRow(r).height = 28;
    r++;
    r++; // separador
  }

  // ── Encabezados de tabla ──
  const headerRowNum = r;
  cols.forEach((col, ci) => {
    const c = ws.getCell(r, ci + 1);
    c.value = col.label.toUpperCase();
    c.font = { bold: true, size: 9, color: { argb: WHITE } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    c.alignment = { horizontal: "left", vertical: "middle" };
    c.border = { bottom: { style: "thin", color: { argb: BORDER } } };
  });
  ws.getRow(r).height = 22;
  r++;

  // ── Filas de datos ──
  rows.forEach((row, ri) => {
    const isCritical = String(row.type ?? "").toLowerCase() === "critical";
    const alt = ri % 2 === 1;
    const bgColor   = alt ? ALT : WHITE;
    const textColor = isCritical ? CRISIS : DATA;

    cols.forEach((col, ci) => {
      const c = ws.getCell(r, ci + 1);
      const formatted = formatCellForExport(col, row[col.key]);
      if (col.numeric && col.variant !== "date") {
        const n = Number(row[col.key] ?? "");
        c.value = isNaN(n) ? formatted : n;
      } else {
        c.value = formatted;
      }
      c.font      = { size: 9, color: { argb: textColor }, bold: isCritical };
      c.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      c.alignment = { horizontal: "left", vertical: "top", wrapText: true };
      c.border    = { bottom: { style: "hair", color: { argb: BORDER } } };
    });
    ws.getRow(r).height = 18;
    r++;
  });

  // ── Freeze de encabezados ──
  ws.views = [{ state: "frozen", xSplit: 0, ySplit: headerRowNum }];

  // ── Filtros automáticos ──
  ws.autoFilter = {
    from: { row: headerRowNum, column: 1 },
    to:   { row: headerRowNum, column: cols.length },
  };

  // ── Descarga ──
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
