/**
 * Construye una imagen de mapa (PNG dataURL) con los puntos de las filas,
 * descargando tiles de OpenStreetMap y componiéndolos en un canvas. Sin API key
 * ni servicios estáticos externos: usa los mismos tiles que Leaflet
 * (tile.openstreetmap.org responde con CORS `*`).
 *
 * Solo browser. Si algo falla (sin coords, tiles inaccesibles) devuelve null y
 * el PDF se genera sin mapa.
 */
import type { ModelRow } from "../application/models-gateway";

const TILE = 256;
const WIDTH = 1200;
const HEIGHT = 500;
const PADDING = 0.18;
const MAX_MARKERS = 200;

// Tiles monocromáticos CARTO Light (sin API key, licencia ODbL).
const TILE_URL = (z: number, x: number, y: number) =>
  `https://a.basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`;

interface Point {
  lat: number;
  lng: number;
}

function lngToX(lng: number, z: number): number {
  return ((lng + 180) / 360) * Math.pow(2, z);
}

function latToY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, z)
  );
}

function extractPoints(rows: ModelRow[]): Point[] {
  return rows
    .map((r) => ({ lat: Number(r.lat), lng: Number(r.lng) }))
    .filter(
      (p) =>
        Number.isFinite(p.lat) &&
        Number.isFinite(p.lng) &&
        (p.lat !== 0 || p.lng !== 0),
    );
}

/** Elige el mayor zoom (0–18) en el que el bbox cabe en el lienzo con padding. */
function pickZoom(points: Point[]): number {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  for (let z = 18; z >= 0; z--) {
    const dx = (lngToX(maxLng, z) - lngToX(minLng, z)) * TILE;
    const dy = (latToY(minLat, z) - latToY(maxLat, z)) * TILE;
    if (dx <= WIDTH * (1 - PADDING) && dy <= HEIGHT * (1 - PADDING)) {
      return z;
    }
  }
  return 0;
}

function loadTile(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`tile failed: ${url}`));
    img.src = url;
  });
}

export async function buildMapImage(rows: ModelRow[]): Promise<string | null> {
  if (typeof document === "undefined") return null;

  const points = extractPoints(rows);
  if (points.length === 0) return null;

  try {
    const z = pickZoom(points);
    const scale = Math.pow(2, z);

    // Centro del bbox en coordenadas de "mundo" (px globales a este zoom).
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerPxX = lngToX(centerLng, z) * TILE;
    const centerPxY = latToY(centerLat, z) * TILE;

    // Esquina superior-izquierda del lienzo en px globales.
    const originX = centerPxX - WIDTH / 2;
    const originY = centerPxY - HEIGHT / 2;

    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#e8edf2";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Rango de tiles que cubren el lienzo.
    const minTileX = Math.floor(originX / TILE);
    const maxTileX = Math.floor((originX + WIDTH) / TILE);
    const minTileY = Math.floor(originY / TILE);
    const maxTileY = Math.floor((originY + HEIGHT) / TILE);

    const jobs: Promise<void>[] = [];
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      for (let ty = minTileY; ty <= maxTileY; ty++) {
        const wx = ((tx % scale) + scale) % scale; // wrap horizontal
        if (ty < 0 || ty >= scale) continue; // fuera de rango vertical
        const url = TILE_URL(z, wx, ty);
        const dx = tx * TILE - originX;
        const dy = ty * TILE - originY;
        jobs.push(
          loadTile(url).then((img) => {
            ctx.drawImage(img, dx, dy, TILE, TILE);
          }),
        );
      }
    }

    await Promise.all(jobs);

    // Convertir a escala de grises con leve aumento de contraste.
    const imgData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    const d = imgData.data;
    const contrast = 1.18;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
      const adj = Math.min(255, Math.max(0, (gray - 128) * contrast + 128));
      d[i] = d[i + 1] = d[i + 2] = adj;
    }
    ctx.putImageData(imgData, 0, 0);

    // Marcadores: círculo rojo con borde blanco y sombra suave.
    for (const p of points.slice(0, MAX_MARKERS)) {
      const px = lngToX(p.lng, z) * TILE - originX;
      const py = latToY(p.lat, z) * TILE - originY;

      // Sombra
      ctx.beginPath();
      ctx.arc(px, py + 1, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fill();

      // Relleno rojo
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#c41a1a";
      ctx.fill();

      // Borde blanco
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // Punto central blanco
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}
