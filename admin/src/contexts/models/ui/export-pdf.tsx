"use client";

import {
  pdf,
  Document,
  Page,
  View,
  Text,
  Image,
  Svg,
  Path,
  Line,
  StyleSheet,
} from "@react-pdf/renderer";
import { exportColumns, formatCellForExport } from "./table-state";
import { buildMapImage } from "./pdf-map";
import type { ModelColumn } from "../model-registry";
import type { ModelRow } from "../application/models-gateway";

export interface PdfMeta {
  title: string;
  subtitle?: string;
  kpis?: { label: string; value: string | number }[];
}

const NAVY = "#1e1e2e";
const CRISIS = "#c41a1a";
const MUTED = "#64748b";
const SOFT = "#94a3b8";
const BORDER = "#e5e9f0";
const ROW_ALT = "#f7f8fb";
const WHITE = "#ffffff";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: NAVY,
    backgroundColor: WHITE,
    paddingBottom: 34,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NAVY,
    padding: "14 18",
  },
  headerIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: CRISIS,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, marginLeft: 10 },
  headerApp: { fontSize: 12, fontFamily: "Helvetica-Bold", color: WHITE, letterSpacing: 0.6 },
  headerTitle: {
    fontSize: 8,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  headerDateBox: { alignItems: "flex-end" },
  headerDateLabel: {
    fontSize: 6.5,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerDate: { fontSize: 8.5, color: "rgba(255,255,255,0.85)", marginTop: 1 },

  filters: { fontSize: 7.5, color: MUTED, padding: "6 18 0 18" },

  kpis: { flexDirection: "row", gap: 10, padding: "10 18 4 18" },
  kpiCard: {
    flex: 1,
    borderRadius: 6,
    border: `1 solid ${BORDER}`,
    backgroundColor: "#fbfcfe",
    padding: "8 10",
  },
  kpiLabel: { fontSize: 6.5, color: SOFT, textTransform: "uppercase", letterSpacing: 0.8 },
  kpiValue: { fontSize: 17, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 3 },

  mapWrap: { padding: "8 18 0 18" },
  mapImg: { width: "100%", height: 300, borderRadius: 8, border: `1 solid ${BORDER}` },

  tableWrap: { padding: "10 18 0 18" },
  thead: { flexDirection: "row", backgroundColor: NAVY, borderRadius: 4 },
  th: {
    flex: 1,
    padding: "5 6",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tr: { flexDirection: "row", borderBottom: `1 solid ${BORDER}` },
  trAlt: { backgroundColor: ROW_ALT },
  td: { flex: 1, padding: "5 6", fontSize: 8, color: "#334155" },

  footer: {
    position: "absolute",
    bottom: 14,
    left: 18,
    right: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: `1 solid ${BORDER}`,
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: SOFT },
});

function ReportPdf({
  meta,
  rows,
  cols,
  mapImage,
}: {
  meta: PdfMeta;
  rows: ModelRow[];
  cols: ModelColumn[];
  mapImage: string | null;
}) {
  const now = new Date().toLocaleString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        {/* Header */}
        <View style={s.header} fixed>
          <View style={s.headerIconBox}>
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Path
                d="M21.73 18L13.73 4a2 2 0 00-3.46 0L2.27 18A2 2 0 004 21h16a2 2 0 001.73-3z"
                stroke={WHITE}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Line
                x1="12"
                y1="9"
                x2="12"
                y2="13"
                stroke={WHITE}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              <Line
                x1="12"
                y1="17"
                x2="12.01"
                y2="17"
                stroke={WHITE}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <View style={s.headerText}>
            <Text style={s.headerApp}>TERREMOTOVENEZUELA.APP</Text>
            <Text style={s.headerTitle}>{meta.title}</Text>
          </View>
          <View style={s.headerDateBox}>
            <Text style={s.headerDateLabel}>Generado</Text>
            <Text style={s.headerDate}>{now}</Text>
          </View>
        </View>

        {/* Filtros activos */}
        {meta.subtitle && <Text style={s.filters}>Filtros: {meta.subtitle}</Text>}

        {/* KPIs */}
        {meta.kpis && meta.kpis.length > 0 && (
          <View style={s.kpis}>
            {meta.kpis.map((k) => (
              <View key={k.label} style={s.kpiCard}>
                <Text style={s.kpiLabel}>{k.label}</Text>
                <Text style={s.kpiValue}>{String(k.value)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Mapa con todos los puntos */}
        {mapImage && (
          <View style={s.mapWrap}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image no soporta alt */}
            <Image src={mapImage} style={s.mapImg} />
          </View>
        )}

        {/* Tabla */}
        <View style={s.tableWrap}>
          <View style={s.thead}>
            {cols.map((c) => (
              <Text key={c.key} style={s.th}>
                {c.label}
              </Text>
            ))}
          </View>
          {rows.map((row, i) => (
            <View key={i} style={[s.tr, i % 2 === 1 ? s.trAlt : {}]} wrap={false}>
              {cols.map((c) => (
                <Text key={c.key} style={s.td}>
                  {formatCellForExport(c, row[c.key])}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>TERREMOTOVENEZUELA.APP · Documento operativo</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

export async function downloadPdf(
  filename: string,
  meta: PdfMeta,
  rows: ModelRow[],
  columns: ModelColumn[],
): Promise<void> {
  if (typeof window === "undefined") return;

  const cols = exportColumns(columns);
  const mapImage = await buildMapImage(rows);
  const blob = await pdf(
    <ReportPdf meta={meta} rows={rows} cols={cols} mapImage={mapImage} />,
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
