#!/usr/bin/env node
/**
 * Inserta los pacientes trasladados desde La Guaira al Hospital Pérez Carreño
 * (Distrito Capital, external_id MANUAL-HOSP-057).
 *
 * Idempotente: comprueba por (hospital_id, name) antes de insertar, así se
 * puede correr varias veces sin duplicar.
 *
 * Uso:
 *   node scripts/import-perez-carreno-patients.mjs
 *   node scripts/import-perez-carreno-patients.mjs --dry-run
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const args = parseArgs(process.argv.slice(2));
await loadEnvLocal();

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
if (!DATABASE_URL) {
  console.error("DATABASE_URL no configurada (verifica .env.local).");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const HOSPITAL_EXTERNAL_ID = "MANUAL-HOSP-057";

/** @type {Array<{name:string,age?:number|null,status?:string,condition?:string,notes?:string,contact?:string}>} */
const PATIENTS = [
  // ── PEDIATRÍA ───────────────────────────────────────────
  { name: "Brito Antonella", age: 11, notes: "Procedente: Catia La Mar." },
  {
    name: "Emili Ramos",
    age: 10,
    notes: "Procedente: Catia La Mar.",
    contact: "Padre: José Ramos",
  },
  {
    name: "Gonzalez Velasquez Fabian Mauricio",
    age: 0,
    notes: "9 meses. Procedente: Catia La Mar.",
  },
  {
    name: "Medina Parra Fernando Jose",
    age: 5,
    status: "deceased",
    condition: "critical",
    notes: "Procedente: El Junquito. Falleció.",
  },
  {
    name: "Mia Acevedo",
    age: 0,
    notes: "7 meses. Procedente: Catia La Mar.",
  },
  {
    name: "Orozco Pelaez Diego",
    age: 8,
    status: "deceased",
    condition: "critical",
    notes: "Entre 8 y 9 años. Falleció.",
  },
  {
    name: "Parica Parica Liyan Yape",
    age: 1,
    notes: "Procedente: Chuao.",
  },
  {
    name: "Polanco Yauripoma Leon Santiago",
    age: 5,
    notes: "Procedente: Av. Baralt.",
  },
  {
    name: "Rodriguez Oliva Joelvinger Jesus",
    age: 9,
    notes: "Procedente: La Guaira.",
  },
  {
    name: "Vergara Blanco Aranza Seungmi",
    age: 11,
    notes: "Procedente: Tanaguarena.",
  },
  {
    name: "Yordano Flores",
    age: 10,
    notes: "Procedente: Caraballeda.",
  },
  {
    name: "Zamara Valentina del Monte",
    age: 10,
    condition: "serious",
    notes: "Rescatada bajo escombros. Procedente: La Guaira.",
    contact: "Abuelo: Mauricio Alfonzo",
  },
  {
    name: "Zduanyeli Valentina Perez",
    age: 1,
    notes: "Procedente: La Guaira.",
  },

  // ── ADULTOS (triaje) ────────────────────────────────────
  { name: "Adriana Vastidas", notes: "Cédula: 17.856.045" },
  { name: "Alejandra Soja", notes: "Cédula: 6.904.629" },
  { name: "Alexandra Cardenas", notes: "Cédula: 28.143.770" },
  { name: "Alvaro Ortiz", notes: "Cédula: 4.163.469" },
  { name: "Ana Aguilera", notes: "Cédula: 20.003.134" },
  { name: "Ana Dias", notes: "Cédula: 10.576.803" },
  { name: "Ana Fernandez", notes: "Cédula: 25.699.054" },
  { name: "Ana Olivero", notes: "Cédula: 4.281.217" },
  { name: "Anabela Morillo", notes: "Cédula: 34.588.981" },
  { name: "Angel Fernandez", notes: "Cédula: 16.310.014" },
  { name: "Ayari Castillo", notes: "Cédula: 26.327.913" },
  { name: "Barbara Quintero", notes: "Cédula: 13.422.890" },
  { name: "Barbara Ramirez", notes: "Cédula: 18.461.886" },
  { name: "Candelario Novis", notes: "Cédula: 9.416.493" },
  { name: "Carmen Angarita", notes: "Cédula: 12.060.080" },
  { name: "Celiana Mijares", notes: "Cédula: 19.734.177" },
  { name: "Cenaida Paredez", notes: "Cédula: 6.405.488" },
  { name: "César Pacheco", notes: "Cédula: 26.327.366" },
  { name: "Crisbel Granado", notes: "Cédula: 23.926.261" },
  { name: "Crisdeilis Quintero", notes: "Cédula: 32.865.296" },
  { name: "Cruz Hernandez", notes: "Cédula: 4.636.722" },
  { name: "David Brito", notes: "Cédula: 30.678.485" },
  { name: "Dayana Rondón", age: 18, notes: "Sin cédula registrada." },
  { name: "Dufiar Lopez", notes: "Cédula: 12.115.323" },
  { name: "Eiban Yegue", notes: "Cédula: 24.058.780" },
  { name: "Elisabeth Chacón", notes: "Cédula: 27.374.286" },
  { name: "Emili Mosquera", notes: "Cédula: 28.285.779" },
  { name: "Eric Godoy", notes: "Cédula: 18.749.225" },
  { name: "Fernanda Figuera", notes: "Cédula: 81.659.048" },
  { name: "Fleici Valero", notes: "Cédula: 13.574.764" },
  { name: "Fran Rondon", notes: "Cédula: 19.659.867" },
  { name: "Francis Medina", notes: "Cédula: 285.659" },
  { name: "Fredy Rodriguez", notes: "Cédula: 14.424.783" },
  { name: "Genesis Bracamonte", notes: "Cédula: 31.428.533" },
  { name: "Gonzalo León", notes: "Cédula: 22.916.224" },
  { name: "Ibsen Iglesias", notes: "Cédula: 32.359.883" },
  { name: "Isabel Torres", notes: "Cédula: 4.718.019" },
  { name: "Juan Garcia", notes: "Cédula: 17.755.829" },
  { name: "Juana de Santiago", notes: "Cédula: 11.688.834" },
  { name: "Judid Paredes", notes: "Cédula: 3.883.421" },
  { name: "Juver Garcia", notes: "Cédula: 27.377.514" },
  { name: "Karleidi Rivero", notes: "Cédula: 36.091.784" },
  { name: "Leonardo Becerra", notes: "Cédula: 34.800.366" },
  { name: "Lesvia Morales", notes: "Cédula: 5.965.096" },
  { name: "Lourdes Oropeza", notes: "Cédula: 14.312.752" },
  { name: "Mailin Lopez", notes: "Cédula: 15.541.666" },
  { name: "Manuel Gomez", notes: "Cédula: 18.814.839" },
  { name: "Manuela De Anzola", notes: "Cédula: 296.723" },
  { name: "Marcela Bernal", notes: "Cédula: 6.049.995" },
  { name: "Maria Araque", notes: "Cédula: 28.100.561" },
  { name: "Maria Montolla", notes: "Cédula: 25.025.734" },
  { name: "Maria Moreno", notes: "Cédula: 5.613.119" },
  { name: "Maria Quillen", notes: "Cédula: 6.059.288" },
  { name: "Maria Zamora", notes: "Cédula: 27.044.236" },
  { name: "Marlin Martinez", notes: "Cédula: 10.576.899" },
  { name: "Marlene Davila", notes: "Cédula: 19.102.824" },
  { name: "Maryuri Sedeño", notes: "Cédula: 14.194.021" },
  { name: "Meri Chavez", notes: "Cédula: 81.462.470" },
  { name: "Merido Bueno", notes: "Cédula: 17.158.021" },
  { name: "Milagro Palma", notes: "Sin cédula registrada." },
  { name: "Nathacha Medina", notes: "Cédula: 29.565.365" },
  { name: "Nayibi Molina", notes: "Cédula: 29.768.360" },
  { name: "Oriana Ramirez", notes: "Cédula: 27.606.264" },
  { name: "Petra Sucre", notes: "Cédula: 2.945.823" },
  { name: "Rodrigo Fernandez", notes: "Sin cédula registrada." },
  { name: "Rosalinda Viera", notes: "Cédula: 13.717.087" },
  { name: "Samuel Peroza", notes: "Cédula: 33.020.891" },
  { name: "Sandra Dias", notes: "Cédula: 11.638.321" },
  { name: "Thais Lopez", notes: "Cédula: 13.641.870" },
  { name: "Valeria Azocar", notes: "Cédula: 28.544.619" },
  { name: "Victor Dias", notes: "Cédula: 11.517.536" },
  { name: "Wilian Alvarez", notes: "Cédula: 16.125.101" },
  { name: "Wuilliams Martinez", notes: "Cédula: 19.367.804" },
  { name: "Yadira Cordero", notes: "Cédula: 12.763.837" },
  { name: "Yaneli Acosta", notes: "Cédula: 31.760.907" },
  { name: "Yenni Marcano", notes: "Cédula: 18.384.289" },
  { name: "Yermin Vaptista", notes: "Cédula: 31.948.173" },
  { name: "Yoandri Colina", notes: "Cédula: 25.872.328" },
  { name: "Yoni Ortuño", notes: "Cédula: 5.199.693" },
  { name: "Yonny Ortuño", notes: "Cédula: 5.199.652" },
  { name: "Yose Palma", notes: "Cédula: 6.448.839" },
  { name: "Yuniar Tirado", notes: "Cédula: 26.372.024" },
];

const SOURCE_NOTE =
  "Ingreso 25/06/2026 — trasladado desde La Guaira.";

console.log(
  `🔍 Buscando hospital con external_id = ${HOSPITAL_EXTERNAL_ID}…`,
);
const hospitalRows = await sql`
  SELECT id, name FROM hospitals WHERE external_id = ${HOSPITAL_EXTERNAL_ID}
`;
if (hospitalRows.length === 0) {
  console.error("❌ Hospital no encontrado. ¿La tabla está sembrada?");
  process.exit(1);
}
const hospital = hospitalRows[0];
console.log(`✓ ${hospital.name} (${hospital.id})`);

await ensureTriageTable();

const existing = await sql`
  SELECT name FROM hospital_patients WHERE hospital_id = ${hospital.id}
`;
const existingNames = new Set(existing.map((r) => normName(r.name)));
console.log(`📋 ${existing.length} pacientes ya registrados en el hospital`);

let inserted = 0;
let skipped = 0;
let errors = 0;

for (const p of PATIENTS) {
  if (existingNames.has(normName(p.name))) {
    skipped++;
    continue;
  }
  if (args.dryRun) {
    console.log(`  + ${p.name} (${p.age ?? "?"}) — ${p.notes ?? ""}`);
    inserted++;
    continue;
  }

  const now = Date.now();
  const notes = [p.notes, SOURCE_NOTE].filter(Boolean).join(" ").slice(0, 600);
  try {
    await sql`
      INSERT INTO hospital_patients (
        id, hospital_id, name, age, condition, status, notes, contact,
        admitted_at, updated_at
      ) VALUES (
        ${randomUUID()}, ${hospital.id}, ${p.name},
        ${p.age ?? null},
        ${p.condition ?? "unknown"},
        ${p.status ?? "hospitalized"},
        ${notes},
        ${(p.contact ?? "").slice(0, 120)},
        ${now}, ${now}
      )
    `;
    inserted++;
  } catch (err) {
    errors++;
    console.error(`  ❌ ${p.name}:`, err?.message ?? err);
  }
}

console.log("\n✅ Listo");
console.log(`   Insertados: ${inserted}`);
console.log(`   Saltados (ya existían): ${skipped}`);
console.log(`   Errores: ${errors}`);

if (!args.dryRun) {
  const totals = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'hospitalized') AS hospitalized,
      COUNT(*) FILTER (WHERE status = 'deceased') AS deceased,
      COUNT(*) AS total
    FROM hospital_patients WHERE hospital_id = ${hospital.id}
  `;
  const t = totals[0];
  console.log(
    `\n📊 ${hospital.name}: total=${t.total} · hospitalizados=${t.hospitalized} · fallecidos=${t.deceased}`,
  );
}

process.exit(0);

// ─── helpers ─────────────────────────────────────────────
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") out.dryRun = true;
  }
  return out;
}

async function loadEnvLocal() {
  try {
    const text = await readFile(resolve(".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (!process.env[m[1]]) process.env[m[1]] = val;
    }
  } catch {
    /* sin .env.local */
  }
}

function normName(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function ensureTriageTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS hospital_patients (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      age INTEGER,
      condition TEXT NOT NULL DEFAULT 'unknown',
      status TEXT NOT NULL DEFAULT 'hospitalized',
      notes TEXT NOT NULL DEFAULT '',
      contact TEXT NOT NULL DEFAULT '',
      admitted_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `;
}
