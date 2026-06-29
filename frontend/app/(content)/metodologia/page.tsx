import type { Metadata } from "next";
import SubPageShell from "@/components/layout/SubPageShell";
import DocTabs from "./DocTabs";
import MetodologiaDoc from "./MetodologiaDoc";
import ApiDoc from "./ApiDoc";

export const metadata: Metadata = {
  title: "Metodología · Mapa de Emergencia Venezuela",
  alternates: { canonical: "/metodologia" },
  description:
    "Reporte técnico del pipeline de resolución de entidades (record linkage) y verificación biométrica facial que consolida reportes de personas desaparecidas del terremoto de Venezuela en identidades canónicas, con arbitraje humano y trazabilidad completa. Incluye la guía de integración de la API v1.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Metodología · Mapa de Emergencia Venezuela",
    description:
      "Resolución de 227.964 reportes en 79.359 identidades únicas (−62,5 %): matching determinístico y probabilístico + reconocimiento facial por embeddings, con garantías de privacidad y reversibilidad. Más la guía de integración de la API v1.",
    url: "/metodologia",
    type: "article",
    locale: "es_VE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Metodología · Mapa de Emergencia Venezuela",
    description:
      "Reporte técnico: record linkage (matching determinístico/probabilístico) + reconocimiento facial por embeddings, y la guía de integración de la API v1.",
  },
};

export default function MetodologiaPage() {
  return (
    <SubPageShell breadcrumb="Metodología">
      <DocTabs
        tabs={[
          { label: "Metodología", content: <MetodologiaDoc /> },
          { label: "Integración API v1", content: <ApiDoc /> },
        ]}
      />
    </SubPageShell>
  );
}
