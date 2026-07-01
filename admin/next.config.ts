import type { NextConfig } from "next";

// Cabeceras de seguridad para TODA respuesta. Un panel admin importa más que el
// sitio público: bloqueamos embebido en iframe (clickjacking sobre acciones de
// admin), sniffing de MIME, y lo marcamos noindex globalmente (el login no debe
// indexarse — el robots:false por página no cubre /robots.txt ni esta cabecera).
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle. Required for container deployments.
  // App plana (sin monorepo): server.js + .next/static quedan en la raíz del
  // build, sin necesidad de transpilePackages ni outputFileTracingRoot.
  output: "standalone",

  // Anti version-skew para el roll multi-pod (mismo problema que resolvió el
  // frontend): `next build` estampa un build-id aleatorio, así que 2 pods del
  // mismo deploy servirían /_next/static/<id>/… distintos → ChunkLoadError sin
  // sticky sessions en el LB. Derivar el id del commit SHA hace que coincidan;
  // deploymentId fuerza recarga limpia cuando una pestaña vieja pega a un pod
  // nuevo. APP_BUILD_SHA llega en BUILD time (build-arg → ENV); "dev" en local.
  generateBuildId: async () => process.env.APP_BUILD_SHA || "dev",
  deploymentId: process.env.APP_BUILD_SHA || undefined,

  // `next dev` bloquea con 403 las peticiones a `/_next/*` (HMR incluido) si el
  // Origin no está en esta allowlist (por defecto solo localhost/*.localhost).
  // Sin esto, entrar al dev server por 127.0.0.1 (común en Windows) deja el
  // socket de HMR bloqueado: la página queda recargándose en loop y los cambios
  // de código nunca llegan en vivo. No-op fuera de `next dev`.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // File-watching por POLLING para Docker Desktop en Windows. Next 16 usa
  // Turbopack en `next dev`, cuyo watcher (crate `notify`) NO ve eventos
  // inotify en binds desde el filesystem de Windows → el hot reload no dispara.
  // `WATCHPACK_POLLING`/`CHOKIDAR_USEPOLLING` NO los lee Turbopack; el knob real
  // es `watchOptions.pollIntervalMs`, que Next pasa al watcher nativo de
  // Turbopack (y a webpack con `--webpack`). Lo activamos SOLO cuando la env var
  // WATCHPACK_POLLING está seteada (docker-compose.dev.yml), así en Mac/local el
  // watching nativo (fsevents) sigue sin el costo de CPU del polling.
  watchOptions: process.env.WATCHPACK_POLLING ? { pollIntervalMs: 500 } : undefined,

  // Sirve /_next/static desde el CDN (R2) si está configurado, para que un chunk
  // nunca dependa de pegar al pod correcto mid-deploy. Sin setear (local) → la
  // app sirve los assets como siempre.
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX
    ? process.env.NEXT_PUBLIC_ASSET_PREFIX.replace(/\/$/, "")
    : undefined,

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
