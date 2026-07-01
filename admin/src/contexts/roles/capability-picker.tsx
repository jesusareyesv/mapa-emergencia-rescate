"use client";

import { useMemo, useState } from "react";
import { useCapabilities, type Capability } from "./use-roles";

function groupByCategory(caps: Capability[]): Map<string, Capability[]> {
  const m = new Map<string, Capability[]>();
  for (const c of caps) {
    const list = m.get(c.category) ?? [];
    list.push(c);
    m.set(c.category, list);
  }
  return m;
}

/**
 * Toggle Switch estilo iOS
 */
function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 ${
        checked ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function CategoryAccordion({
  category,
  list,
  selected,
  onToggle,
  defaultOpen = false,
}: {
  category: string;
  list: Capability[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const selectedCount = list.filter((c) => selected.has(c.key)).length;
  const isAllSelected = selectedCount === list.length;

  return (
    <div className="border-b border-border last:border-b-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between bg-surface px-4 py-3 hover:bg-surface-muted transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-etext">{category}</span>
          {selectedCount > 0 && (
            <span className="flex h-5 items-center justify-center rounded-full bg-navy/10 px-2 text-[11px] font-medium text-navy">
              {selectedCount} / {list.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <svg
            className={`h-4 w-4 text-etext-muted transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-1 bg-surface-muted/30 px-4 py-3">
            {list.map((c, i) => {
              const isChecked = selected.has(c.key);
              return (
                <div
                  key={c.key}
                  className={`flex items-center justify-between rounded-xl p-3 transition-colors ${
                    isChecked ? "bg-surface shadow-sm" : "hover:bg-surface"
                  }`}
                >
                  <div className="flex flex-col pr-4">
                    <span className="font-mono text-xs font-semibold text-etext mb-0.5">
                      {c.key}
                    </span>
                    <span className="text-xs text-etext-muted leading-tight">
                      {c.description}
                    </span>
                  </div>
                  <Switch checked={isChecked} onChange={() => onToggle(c.key)} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Selector de capacidades estilo Apple (Acordeón + Switch)
 */
export function CapabilityPicker({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  const { data: caps, isLoading } = useCapabilities();
  const groups = useMemo(() => groupByCategory(caps ?? []), [caps]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border shadow-sm">
      {[...groups.entries()].map(([category, list], index) => (
        <CategoryAccordion
          key={category}
          category={category}
          list={list}
          selected={selected}
          onToggle={onToggle}
          defaultOpen={false}
        />
      ))}
    </div>
  );
}
