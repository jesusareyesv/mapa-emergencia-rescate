"use client";

import { memo } from "react";

export function pageWindow(page: number, totalPages: number): number[] {
  const span = 2;
  const start = Math.max(1, Math.min(page - span, totalPages - span * 2));
  const end = Math.min(totalPages, Math.max(page + span, span * 2 + 1));
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  ariaLabel?: string;
  size?: "default" | "small";
}

function PaginationImpl({
  page,
  totalPages,
  onPageChange,
  ariaLabel = "Paginación",
  size = "default",
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(page, totalPages);
  const first = pages[0] ?? 1;
  const last = pages[pages.length - 1] ?? totalPages;

  const isSmall = size === "small";
  const containerClass = isSmall ? "flex flex-col items-center gap-1 my-4" : "flex flex-col items-center gap-2 mt-8 mb-4";
  const btnBase = isSmall ? "rounded-md px-2 py-1 text-xs" : "rounded-lg px-3 py-1.5 text-sm";
  const defaultBtn = `border border-border bg-surface font-medium text-etext-muted transition hover:bg-surface-muted hover:text-etext ${btnBase}`;
  const activeBtn = `bg-navy font-semibold text-on-dark shadow-sm ${btnBase}`;
  const disabledBtn = `border border-border bg-surface font-medium text-etext-muted transition hover:bg-surface-muted hover:text-etext disabled:opacity-40 ${btnBase}`;

  return (
    <div className={containerClass}>
      <nav
        className="flex flex-wrap items-center justify-center gap-1.5"
        aria-label={ariaLabel}
      >
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className={disabledBtn}
        >
          &larr; {isSmall ? "Ant" : "Anterior"}
        </button>
        {first > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className={defaultBtn}
            >
              1
            </button>
            {first > 2 && <span className="px-1 text-etext-soft">&hellip;</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={p === page ? activeBtn : defaultBtn}
          >
            {p}
          </button>
        ))}
        {last < totalPages && (
          <>
            {last < totalPages - 1 && (
              <span className="px-1 text-etext-soft">&hellip;</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className={defaultBtn}
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className={disabledBtn}
        >
          {isSmall ? "Sig" : "Siguiente"} &rarr;
        </button>
      </nav>
      {!isSmall && (
        <div className="text-xs text-etext-soft font-medium">
          P&aacute;gina {page} de {new Intl.NumberFormat('es-VE').format(totalPages)}
        </div>
      )}
    </div>
  );
}

export const Pagination = memo(PaginationImpl);
