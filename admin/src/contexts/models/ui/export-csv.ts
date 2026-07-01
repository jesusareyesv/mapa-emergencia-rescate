/** Descarga un CSV en el navegador vía Blob + objectURL (sin dependencias). */
export function downloadCsv(filename: string, csv: string): void {
  if (typeof document === "undefined") return;
  // BOM para que Excel reconozca UTF-8 (acentos).
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
