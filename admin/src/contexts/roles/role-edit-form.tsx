"use client";

import { useState, type FormEvent } from "react";
import { Input, Button, Modal } from "@/src/ui";
import { useUpdateRole, type Role } from "./use-roles";
import { CapabilityPicker } from "./capability-picker";

/** Editor de un rol existente (nombre, descripción, capacidades) vía Modal Wizard. */
export function RoleEditForm({ role, onDone }: { role: Role; onDone: () => void }) {
  const updateRole = useUpdateRole();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description || "");
  const [selected, setSelected] = useState<Set<string>>(new Set(role.capabilities));
  const [done, setDone] = useState<string | null>(null);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (step === 1) {
      if (!name) return;
      setStep(2);
      return;
    }

    setDone(null);
    await updateRole.mutateAsync({
      id: role.id,
      input: { name, description: description || undefined, capabilities: [...selected] },
    });
    setDone(name);
    // Cerrar automáticamente después de 1.5s
    setTimeout(() => {
      onDone();
    }, 1500);
  }

  return (
    <Modal isOpen={true} onClose={onDone} title="Editar Rol" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {done ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in duration-300">
            <div className="mb-4 rounded-full bg-green-100 p-3 text-green-600">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-etext">¡Cambios guardados!</h4>
            <p className="text-sm text-etext-muted">El rol “{done}” ha sido actualizado correctamente.</p>
          </div>
        ) : (
          <>
            {/* Stepper Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex flex-1 items-center gap-2 border-b-2 pb-2 ${step === 1 ? "border-navy text-navy" : "border-border text-etext-muted"}`}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold border-2 border-current">1</span>
                <span className="text-sm font-semibold">Datos básicos</span>
              </div>
              <div className={`flex flex-1 items-center gap-2 border-b-2 pb-2 ${step === 2 ? "border-navy text-navy" : "border-border text-etext-muted"}`}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold border-2 border-current">2</span>
                <span className="text-sm font-semibold">Permisos</span>
              </div>
            </div>

            {step === 1 && (
              <div className="flex flex-col gap-4 animate-in slide-in-from-left-4 fade-in duration-300">
                <Input label="Nombre del rol" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
                <Input
                  label="Descripción (opcional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="rounded-xl border border-border bg-surface-muted p-4 shadow-inner">
                  <p className="mb-4 text-sm font-semibold text-etext">
                    Selecciona las capacidades para <span className="text-navy">{name}</span> ({selected.size} seleccionadas)
                  </p>
                  <CapabilityPicker selected={selected} onToggle={toggle} />
                </div>
              </div>
            )}

            {updateRole.isError && (
              <p role="alert" className="text-sm text-crisis font-medium bg-crisis/10 p-3 rounded-lg">
                {updateRole.error instanceof Error ? updateRole.error.message : "Error al guardar."}
              </p>
            )}

            {/* Actions Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
              {step === 2 ? (
                <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={updateRole.isPending}>
                  Atrás
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={onDone} disabled={updateRole.isPending}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={updateRole.isPending || !name}>
                {step === 1 ? "Siguiente" : updateRole.isPending ? "Guardando…" : "Guardar cambios"}
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
