/* Helpers de presentación compartidos por los documentos de /metodologia.
   Son server components puros (sin estado ni hooks). */

export function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 pt-12 first:pt-0">
      <p className="qi-eyebrow">{eyebrow}</p>
      <h2 className="qi-h2 mt-1">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-[var(--etext2)]">
        {children}
      </div>
    </section>
  );
}

export function StatCard({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="e-card p-4">
      <p className="font-[family-name:var(--qi-font-display)] text-2xl font-extrabold leading-none text-[var(--etext)]">
        {value}
      </p>
      <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--etext3)]">
        {label}
      </p>
      {hint ? (
        <p className="mt-1 text-xs leading-snug text-[var(--etext2)]">{hint}</p>
      ) : null}
    </div>
  );
}

export type CalloutVariant = "todos" | "tecnico" | "warn" | "info" | "ok";

const CALLOUT_STYLES: Record<
  CalloutVariant,
  { wrap: string; head: string; icon: string; tag: string }
> = {
  todos: {
    wrap: "border-emerald-200 bg-emerald-50",
    head: "text-emerald-900",
    icon: "🟢",
    tag: "Síntesis",
  },
  tecnico: {
    wrap: "border-sky-300 bg-sky-50",
    head: "text-sky-900",
    icon: "🔵",
    tag: "Detalle técnico",
  },
  warn: {
    wrap: "border-amber-300 bg-amber-50",
    head: "text-amber-900",
    icon: "⚠️",
    tag: "Atención",
  },
  info: {
    wrap: "border-sky-300 bg-sky-50",
    head: "text-sky-900",
    icon: "🔵",
    tag: "Nota",
  },
  ok: {
    wrap: "border-emerald-200 bg-emerald-50",
    head: "text-emerald-900",
    icon: "🟢",
    tag: "Buenas prácticas",
  },
};

export function Callout({
  variant,
  title,
  children,
}: {
  variant: CalloutVariant;
  title?: string;
  children: React.ReactNode;
}) {
  const s = CALLOUT_STYLES[variant];
  return (
    <div className={`e-card p-4 ${s.wrap}`}>
      <p
        className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${s.head}`}
      >
        <span aria-hidden>{s.icon}</span>
        {title ?? s.tag}
      </p>
      <div className={`mt-2 space-y-2 text-sm leading-relaxed ${s.head}`}>
        {children}
      </div>
    </div>
  );
}

export const TH =
  "border-b border-[var(--eborder)] px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-[var(--etext3)]";
export const TD =
  "border-b border-[var(--eborder)] px-3 py-2 align-top text-[var(--etext)]";
export const TDNUM = `${TD} text-right tabular-nums font-semibold`;

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="e-card overflow-x-auto p-0">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function C({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-[var(--einput)] px-1 py-0.5 font-mono text-[0.85em] text-[var(--etext)]">
      {children}
    </code>
  );
}

export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <div className="overflow-hidden rounded-xl bg-[#0d1b2a] ring-1 ring-white/10">
      {lang ? (
        <div className="border-b border-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/45">
          {lang}
        </div>
      ) : null}
      <pre className="overflow-x-auto p-4 text-[12.5px] leading-relaxed text-[#e6edf3]">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

export function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle"
      style={{ background: color }}
    />
  );
}

export function GlossaryItem({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div className="e-card p-3">
      <dt className="text-sm font-bold text-[var(--etext)]">{term}</dt>
      <dd className="mt-0.5 text-sm leading-relaxed text-[var(--etext2)]">
        {children}
      </dd>
    </div>
  );
}

/* Layout compartido: hero + (TOC lateral pegajoso + contenido). */

export function DocLayout({
  hero,
  toc,
  children,
}: {
  hero: React.ReactNode;
  toc: ReadonlyArray<{ id: string; label: string }>;
  children: React.ReactNode;
}) {
  return (
    <>
      {hero}
      <div className="mx-auto w-full max-w-[1120px] px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <nav
              aria-label="Índice del documento"
              className="sticky top-20 space-y-1"
            >
              <p className="qi-eyebrow mb-2 text-[var(--etext3)]">Contenido</p>
              {toc.map((item, i) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block rounded-lg px-3 py-1.5 text-sm text-[var(--etext2)] transition hover:bg-[var(--einput)] hover:text-[var(--etext)]"
                >
                  <span className="tabular-nums text-[var(--etext3)]">
                    {String(i + 1).padStart(2, "0")}.
                  </span>{" "}
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>
          <article className="min-w-0">{children}</article>
        </div>
      </div>
    </>
  );
}

export function DocHero({
  pill,
  title,
  children,
}: {
  pill: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b border-[var(--eborder)]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #092334 0%, #1e3140 55%, #11304a 100%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-[1120px] px-4 py-12 sm:px-6 sm:py-16">
        <span className="e-pill bg-white/10 text-[11px] uppercase tracking-wide text-white ring-1 ring-white/20">
          <span
            className="inline-block h-2 w-2 rounded-full bg-emerald-400"
            aria-hidden
          />
          {pill}
        </span>
        <h1 className="qi-display mt-4 max-w-3xl" style={{ color: "#ffffff" }}>
          {title}
        </h1>
        {children}
      </div>
    </header>
  );
}
