/**
 * Panel de integraciones externas — solo presentacional.
 * Muestra el roadmap de canales de mensajería sin botones de conexión real.
 */

const INTEGRATIONS = [
  { icon: "💬", label: "WhatsApp Business" },
  { icon: "✈️",  label: "Telegram" },
  { icon: "📱", label: "SMS" },
  { icon: "📧", label: "Email entrante" },
];

export function IntegrationsPanel() {
  return (
    <aside className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-etext-soft">
          Próximamente
        </p>
        <h2 className="mt-1 text-sm font-bold text-etext">Integraciones</h2>
        <p className="mt-1 text-xs leading-5 text-etext-muted">
          Los canales de mensajería se conectarán aquí para recibir reportes y
          coordinar operaciones desde WhatsApp, Telegram y SMS.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {INTEGRATIONS.map(({ icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
          >
            <span className="text-xl" aria-hidden>
              {icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-etext">{label}</p>
              <p className="text-xs text-etext-soft">Próximamente</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-[11px] leading-4 text-etext-soft">
        Sin acciones disponibles aún. Esta área mostrará el estado de conexión
        cuando los canales estén activos.
      </p>
    </aside>
  );
}
