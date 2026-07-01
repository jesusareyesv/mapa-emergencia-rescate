"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  SearchIcon,
  PinIcon,
  UploadIcon,
  HospitalIcon,
  StreetIcon,
} from "./form-icons";
import {
  NATIONALITY_OPTIONS,
  fileToResizedDataUrl,
  formatLastSeen,
  buildDescription,
} from "./missing-form-helpers";
import type {
  MissingReportType,
  FoundPlace,
  PersonStatus,
  MissingPersonPayload,
} from "./types";

export type {
  MissingReportType,
  FoundPlace,
  MissingPersonPayload,
} from "./types";


interface Props {
  onCancel: () => void;
  onSubmit: (payload: MissingPersonPayload) => Promise<void>;
  initialReportType?: MissingReportType;
  initialFoundPlace?: FoundPlace | null;
}

export default function MissingPersonForm({
  onCancel,
  onSubmit,
  initialReportType = "missing",
  initialFoundPlace = null,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [reportType, setReportType] =
    useState<MissingReportType>(initialReportType);
  const [foundPlace, setFoundPlace] = useState<FoundPlace | null>(
    initialFoundPlace,
  );
  const [personStatus, setPersonStatus] = useState<PersonStatus | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [nationality, setNationality] = useState("");
  const [location, setLocation] = useState("");
  const [lastContactAt, setLastContactAt] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMissing = reportType === "missing";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  const handleFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Selecciona un archivo JPG o PNG.");
        return;
      }
      setError(null);
      setProcessing(true);
      try {
        setPhoto(await fileToResizedDataUrl(file));
      } catch {
        setError("No se pudo procesar la imagen. Intenta con otra foto.");
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
      if (!name.trim()) {
        setError("Indica el nombre de la persona.");
        return;
      }
      if (isMissing && !location.trim()) {
        setError("Indica la última ubicación vista.");
        return;
      }
      if (!isMissing) {
        if (!foundPlace) {
          setError("Indica dónde fue encontrada.");
          return;
        }
        if (!location.trim()) {
          setError("Indica el hospital o la zona donde la viste.");
          return;
        }
        if (!personStatus) {
          setError("Indica cuál es su estado actual.");
          return;
        }
      }
      if (!consent) {
        setError(
          "Debes confirmar que un familiar autoriza publicar estos datos.",
        );
        return;
      }
      setSubmitting(true);
      try {
        await onSubmit({
          name: name.trim(),
          age: age.trim(),
          nationality: nationality.trim(),
          lastSeen: formatLastSeen(
            location,
            lastContactAt,
            reportType,
            foundPlace ?? undefined,
          ),
          description: buildDescription(
            description,
            reportType,
            personStatus ?? undefined,
          ),
          contact: contact.trim(),
          photo,
          reportType,
          turnstileToken: "dummy",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar.");
        setSubmitting(false);
      }
    },
    [
      name,
      age,
      nationality,
      location,
      lastContactAt,
      description,
      contact,
      photo,
      consent,
      reportType,
      isMissing,
      foundPlace,
      personStatus,
      onSubmit,
    ],
  );

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/55 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-[560px] max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 pb-4 pt-5">
          <div>
            <h2
              id="report-modal-title"
              className="text-lg font-extrabold text-slate-900"
            >
              Reportar persona desaparecida o encontrada
            </h2>
            <p className="mt-1.5 text-[13px] leading-snug text-slate-500">
              Comparte los datos para que alguien pueda ayudar a ubicarla o
              reunirla con su familia.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            data-track="missing_form_close"
            aria-label="Cerrar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 px-6 py-5"
        >
          <fieldset className="border-0 p-0">
            <legend className="mb-1.5 block text-[13px] font-bold text-slate-900">
              ¿Qué quieres reportar? <span className="text-red-600">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setReportType("missing")}
                aria-pressed={isMissing}
                className={`flex flex-col items-start gap-3 rounded-xl border-[1.5px] p-3 text-left transition ${
                  isMissing
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <SearchIcon className="mt-[1px] h-[18px] w-[18px] shrink-0" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[14px] font-extrabold leading-[1.2]">
                    Persona desaparecida
                  </span>
                  <span className={`text-[12px] leading-[1.3] ${isMissing ? 'text-red-100' : 'text-slate-500'}`}>
                    No sé dónde está
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setReportType("found")}
                aria-pressed={!isMissing}
                className={`flex flex-col items-start gap-3 rounded-xl border-[1.5px] p-3 text-left transition ${
                  !isMissing
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <PinIcon className="mt-[1px] h-[18px] w-[18px] shrink-0" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[14px] font-extrabold leading-[1.2]">
                    Persona encontrada
                  </span>
                  <span className={`text-[12px] leading-[1.3] ${!isMissing ? 'text-indigo-100' : 'text-slate-500'}`}>
                    Sé dónde está o la vi
                  </span>
                </span>
              </button>
            </div>
          </fieldset>

          <div>
            <span className="mb-1.5 block text-[13px] font-bold text-slate-900">
              Foto de la persona
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFile}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              className="flex w-full items-center gap-3.5 rounded-xl border-[1.5px] border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 p-4 text-left transition disabled:opacity-60"
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt="Vista previa"
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-[#c41a1a]">
                  <UploadIcon className="h-5 w-5" />
                </span>
              )}
              <span className="flex flex-col gap-0.5">
                <strong className="text-sm font-bold text-slate-900">
                  {processing
                    ? "Procesando…"
                    : photo
                      ? "Cambiar foto"
                      : "Cargar una foto"}
                </strong>
                <span className="text-xs text-slate-500">
                  JPG o PNG · opcional pero muy útil
                </span>
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="report-name" className="mb-1.5 block text-[13px] font-bold text-slate-900">
                Nombre y apellido <span className="text-red-600">*</span>
              </label>
              <input
                id="report-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                required
                placeholder="Ej. María Fernanda Rangel"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
            <div>
              <label htmlFor="report-age" className="mb-1.5 block text-[13px] font-bold text-slate-900">
                Edad
              </label>
              <input
                id="report-age"
                type="number"
                inputMode="numeric"
                min={0}
                max={130}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Años"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="report-nationality" className="mb-1.5 block text-[13px] font-bold text-slate-900">
                Nacionalidad
              </label>
              <input
                id="report-nationality"
                type="text"
                list="report-nationality-options"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                maxLength={80}
                placeholder="Ej. Venezolana"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              <datalist id="report-nationality-options">
                {NATIONALITY_OPTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
          </div>

          {isMissing ? (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="report-location" className="mb-1.5 block text-[13px] font-bold text-slate-900">
                  Última ubicación vista{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id="report-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={200}
                  required
                  placeholder="Ej. Catia La Mar, La Guaira"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
              <div>
                <label htmlFor="report-when" className="mb-1.5 block text-[13px] font-bold text-slate-900">
                  Desde cuándo sin contacto
                </label>
                <input
                  id="report-when"
                  type="datetime-local"
                  value={lastContactAt}
                  onChange={(e) => setLastContactAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>
          ) : (
            <>
              <fieldset className="border-0 p-0">
                <legend className="mb-1.5 block text-[13px] font-bold text-slate-900">
                  ¿Dónde fue encontrada?{" "}
                  <span className="text-red-600">*</span>
                </legend>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFoundPlace("hospital")}
                    aria-pressed={foundPlace === "hospital"}
                    className={`flex items-center gap-2 rounded-xl border-[1.5px] px-3 py-2.5 text-left text-sm font-semibold transition ${
                      foundPlace === "hospital"
                        ? "border-[#2b51f0] bg-[#eef3ff] text-[#2b51f0]"
                        : "border-[var(--eborder)] bg-white text-slate-900"
                    }`}
                  >
                    <HospitalIcon className="h-4 w-4 shrink-0" />
                    En un hospital
                  </button>
                  <button
                    type="button"
                    onClick={() => setFoundPlace("street")}
                    aria-pressed={foundPlace === "street"}
                    className={`flex items-center gap-2 rounded-xl border-[1.5px] px-3 py-2.5 text-left text-sm font-semibold transition ${
                      foundPlace === "street"
                        ? "border-[#2b51f0] bg-[#eef3ff] text-[#2b51f0]"
                        : "border-[var(--eborder)] bg-white text-slate-900"
                    }`}
                  >
                    <StreetIcon className="h-4 w-4 shrink-0" />
                    En la calle
                  </button>
                </div>
              </fieldset>

              <div>
                <label htmlFor="report-found-location" className="mb-1.5 block text-[13px] font-bold text-slate-900">
                  {foundPlace === "hospital"
                    ? "Nombre del hospital o clínica"
                    : "Zona o referencia"}{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id="report-found-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={200}
                  placeholder={
                    foundPlace === "hospital"
                      ? "Ej. Hospital JM de los Ríos"
                      : "Ej. Catia La Mar, cerca de…"
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <div>
                <label htmlFor="report-found-when" className="mb-1.5 block text-[13px] font-bold text-slate-900">
                  Cuándo fue encontrada
                </label>
                <input
                  id="report-found-when"
                  type="datetime-local"
                  value={lastContactAt}
                  onChange={(e) => setLastContactAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <fieldset className="border-0 p-0">
                <legend className="mb-1.5 block text-[13px] font-bold text-slate-900">
                  ¿Cuál es su estado actual?{" "}
                  <span className="text-red-600">*</span>
                </legend>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPersonStatus("safe")}
                    aria-pressed={personStatus === "safe"}
                    className={`flex items-center gap-2 rounded-xl border-[1.5px] px-3 py-2.5 text-left text-sm font-semibold transition ${
                      personStatus === "safe"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-[var(--eborder)] bg-white text-slate-900"
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    A salvo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersonStatus("deceased")}
                    aria-pressed={personStatus === "deceased"}
                    className={`flex items-center gap-2 rounded-xl border-[1.5px] px-3 py-2.5 text-left text-sm font-semibold transition ${
                      personStatus === "deceased"
                        ? "border-red-300 bg-red-50 text-red-800"
                        : "border-[var(--eborder)] bg-white text-slate-900"
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    Fallecida
                  </button>
                </div>
              </fieldset>
            </>
          )}

          <div>
            <label htmlFor="report-desc" className="mb-1.5 block text-[13px] font-bold text-slate-900">
              Descripción y señas particulares
            </label>
            <textarea
              id="report-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={600}
              rows={4}
              placeholder="Estatura, contextura, ropa que vestía, cicatrices, lentes, condición médica…"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 resize-none"
            />
          </div>

          <div className="rounded-xl bg-slate-100 p-4">
            <label htmlFor="report-contact" className="mb-1.5 block text-[13px] font-bold text-slate-900">
              ¿Cómo te contactan si alguien la reconoce?
            </label>
            <input
              id="report-contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={120}
              placeholder="Tu nombre y un teléfono o correo"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="mb-2 text-[13px] font-bold text-red-800">
              <span aria-hidden>⚠</span> Antes de publicar
            </p>
            <p className="mb-2">
              Esta información será <strong>visible públicamente</strong> y
              puede ser indexada por buscadores y replicada por plataformas
              aliadas con fines humanitarios.
            </p>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 accent-red-600"
              />
              <span>
                Confirmo que un familiar o allegado autoriza publicar estos
                datos para ayudar a localizar a la persona, y acepto los{" "}
                <a
                  href="/terminos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-amber-900 underline hover:text-amber-950"
                >
                  Términos
                </a>{" "}
                y la{" "}
                <a
                  href="/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-amber-900 underline hover:text-amber-950"
                >
                  Política de Privacidad
                </a>
                .
              </span>
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <footer className="mt-2 flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              className="flex min-w-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[14px] font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || processing || !consent}
              className="flex min-w-[140px] items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? "Publicando…" : "Publicar reporte"}
              {!submitting && <span aria-hidden>→</span>}
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  );
}
