"use client";

import { useModelList } from "../models/ui/use-model-list";

interface ChatPanelProps {
  onClose: () => void;
}

function authorInitial(author: string): string {
  return (author || "?").slice(0, 1).toUpperCase();
}

/**
 * Panel deslizante de chat — muestra los mensajes del endpoint /api/models/chat.
 * Read-only (F1). Se abre con ⌘I desde cualquier sección del panel.
 */
export function ChatPanel({ onClose }: ChatPanelProps) {
  const { data, isLoading, isError } = useModelList("chat");

  return (
    <>
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <ChatIcon />
          <span className="text-sm font-semibold text-etext">Chat</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-etext-soft sm:inline-flex">
            ⌘I
          </kbd>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-etext-muted hover:bg-surface-muted hover:text-etext transition-colors"
            aria-label="Cerrar panel de chat"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {isLoading && (
          <p className="px-4 py-8 text-center text-sm text-etext-soft">
            Cargando mensajes…
          </p>
        )}

        {isError && (
          <p className="px-4 py-8 text-center text-sm text-crisis">
            No se pudieron cargar los mensajes.
          </p>
        )}

        {!isLoading && !isError && (!data || data.length === 0) && (
          <p className="px-4 py-8 text-center text-sm text-etext-soft">
            Sin mensajes aún.
          </p>
        )}

        {data && data.length > 0 && (
          <ul className="divide-y divide-border">
            {data.map((msg, i) => {
              const author = String(msg.author ?? "");
              const message = String(msg.message ?? "");
              return (
                <li key={String(msg.id ?? i)} className="flex gap-3 px-4 py-3 hover:bg-surface-muted transition-colors">
                  {/* Avatar inicial */}
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-muted text-[11px] font-bold text-etext-muted ring-1 ring-border">
                    {authorInitial(author)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-etext truncate">{author || "—"}</p>
                    <p className="mt-0.5 text-sm text-etext-muted leading-snug break-words">{message}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M2 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6l-4 3V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
