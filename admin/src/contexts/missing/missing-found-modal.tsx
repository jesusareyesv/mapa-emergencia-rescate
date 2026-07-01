"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "@/src/ui/atoms/modal";

export interface MissingFoundPayload {
  note: string;
  photo: string | null;
}

interface Props {
  isOpen: boolean;
  personName: string;
  onCancel: () => void;
  onSubmit: (payload: MissingFoundPayload) => Promise<void>;
}

const MAX_DIM = 960;
const JPEG_QUALITY = 0.62;

async function fileToResizedDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  if (width >= height && width > MAX_DIM) {
    height = Math.round((height * MAX_DIM) / width);
    width = MAX_DIM;
  } else if (height > MAX_DIM) {
    width = Math.round((width * MAX_DIM) / height);
    height = MAX_DIM;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export function MissingFoundModal({
  isOpen,
  personName,
  onCancel,
  onSubmit,
}: Props) {
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Resetear el estado si se abre o cierra
  useEffect(() => {
    if (isOpen) {
      setNote("");
      setPhoto(null);
      setError(null);
      setSubmitting(false);
      setProcessing(false);
    }
  }, [isOpen]);

  const handleFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("La prueba debe ser una imagen.");
        return;
      }
      setError(null);
      setProcessing(true);
      try {
        setPhoto(await fileToResizedDataUrl(file));
      } catch {
        setError("No se pudo procesar la imagen. Intenta con otra.");
      } finally {
        setProcessing(false);
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);
      if (!note.trim()) {
        setError(
          "Cuéntanos cómo te comunicaste con la persona o quién lo confirmó.",
        );
        return;
      }
      if (!photo) {
        setError("Adjunta una captura o foto como prueba del contacto.");
        return;
      }
      setSubmitting(true);
      try {
        await onSubmit({ note: note.trim(), photo });
        onCancel(); // cierra exitosamente
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar.");
        setSubmitting(false);
      }
    },
    [note, photo, onSubmit, onCancel],
  );

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} maxWidth="md">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 id="found-title" className="text-lg font-bold text-etext">
          ✓ Marcar como localizada
        </h3>
      </div>
      <p className="mt-1 text-sm text-etext-muted">
        Antes de quitar a <strong>{personName}</strong> del listado,
        ayúdanos a confirmar el contacto con una breve explicación. Esto
        previene cierres falsos.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="found-note"
            className="block text-sm font-medium text-etext mb-1"
          >
            ¿Cómo te comunicaste o quién lo confirmó?{" "}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            id="found-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            maxLength={600}
            required
            placeholder="Ej: Hablé por teléfono con su hermana, está en el refugio de Chacao. O: lo vi en persona en el centro médico."
            className="mt-1 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-etext outline-none focus:border-navy"
          />
        </div>

        <div>
          <label htmlFor="found-photo" className="block text-sm font-medium text-etext mb-1">
            Prueba: captura de pantalla o foto{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            id="found-photo"
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
            required={!photo}
          />
          <div className="mt-2 flex items-center gap-3">
            {photo ? (
              <img
                src={photo}
                alt="Vista previa"
                className="h-20 w-20 rounded-lg object-cover border border-border shadow-sm"
              />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-lg bg-surface-muted text-2xl text-etext-soft border border-border border-dashed">
                📎
              </div>
            )}
            <div className="flex flex-col items-start gap-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={processing}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-etext transition-colors hover:bg-surface-muted disabled:opacity-50"
              >
                {processing
                  ? "Procesando…"
                  : photo
                    ? "Cambiar imagen"
                    : "Adjuntar captura"}
              </button>
              {photo && (
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="text-xs text-red-500 hover:text-red-600 font-medium ml-1"
                >
                  Quitar
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-etext-soft mt-2">
            Ej: pantallazo de WhatsApp, foto con la persona, etc.
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-full px-5 py-2 text-sm font-medium text-etext hover:bg-surface-muted transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || processing || !photo}
            className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-on-dark hover:bg-navy/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? "Confirmando..." : "Confirmar Localización"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
