"use client";

import { useMemo, useState, useEffect } from "react";

import { Modal } from "@/src/ui/atoms/modal";
import { Badge } from "@/src/ui/atoms/badge";
import { Pagination } from "@/src/ui/atoms/pagination";
import { useMissingPaginated } from "./use-missing-paginated";
import { MissingFoundModal, type MissingFoundPayload } from "./missing-found-modal";
import type { MissingPersonPayload } from "./create/types";
import { useQueryClient } from "@tanstack/react-query";
import MissingPersonForm from "./create/MissingPersonForm";

export interface MissingDTO {
  id: string;
  name: string;
  age: number | null;
  nationality: string;
  description: string;
  lastSeen: string;
  contact: string;
  photoUrl: string | null;
  status: "active" | "found";
  resolutionNote: string | null;
  resolutionPhotoUrl: string | null;
  resolvedAt: number | null;
  createdAt: number;
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

function formatDate(epochMs: number): string {
  const d = new Date(epochMs);
  return d.toLocaleDateString("es-VE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function MissingCard({ person, onClick, size }: { person: MissingDTO; onClick: () => void; size: "small" | "medium" | "large" }) {
  const initials = getInitials(person.name);
  const isFound = person.status === "found";

  const pClass = size === "small" ? "p-2.5 gap-0.5" : "p-4 gap-1";
  const titleClass = size === "small" ? "text-sm" : size === "large" ? "text-xl" : "text-lg";
  const subtitleClass = size === "small" ? "text-[10px]" : "text-sm";
  const descClass = size === "small" ? "text-[10px] mt-1" : "text-xs mt-2";
  const badgeClass = size === "small" ? "px-1.5 py-0.5 text-[9px] top-1.5 right-1.5" : "px-2.5 py-1 text-xs top-3 right-3";

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer flex flex-col"
      onClick={onClick}
    >
      {/* Badge Flotante */}
      <div className={`absolute z-10 shadow-sm rounded-full ${badgeClass}`}>
        <span className={`inline-flex items-center rounded-full font-semibold backdrop-blur-md border ${isFound
            ? "bg-green-100/90 text-green-800 border-green-200"
            : "bg-red-100/90 text-red-800 border-red-200"
          } ${size === "small" ? "px-1.5 py-0.5" : "px-2.5 py-1"}`}>
          {isFound ? "Localizado" : "Desaparecido"}
        </span>
      </div>

      {/* Imagen o Fallback */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
        {person.photoUrl ? (
          <img
            src={person.photoUrl}
            alt={`Foto de ${person.name}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500">
            <span className={`${size === "small" ? "text-3xl" : "text-5xl"} font-bold tracking-wider opacity-50`}>{initials}</span>
          </div>
        )}
      </div>

      {/* Info Inferior */}
      <div className={`${pClass} flex flex-col grow`}>
        <h3 className={`font-semibold text-etext line-clamp-1 ${titleClass}`}>{person.name}</h3>
        <p className={`text-etext-muted line-clamp-1 ${subtitleClass}`}>
          {person.age ? `${person.age} años` : "Edad desconocida"} • {person.nationality || "N/D"}
        </p>
        <p className={`${descClass} text-etext-soft line-clamp-2 leading-relaxed`}>
          <span className="font-medium text-etext-muted">Visto:</span> {person.lastSeen || "Lugar desconocido"}
        </p>
      </div>
    </div>
  );
}

function MissingDetailsModal({ person, isOpen, onClose, onDelete, onMarkFound }: { person: MissingDTO | null, isOpen: boolean, onClose: () => void, onDelete: (id: string) => void, onMarkFound: (id: string) => void }) {
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  if (!person) return null;
  const isFound = person.status === "found";
  const initials = getInitials(person.name);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl">
        <div className="flex flex-col md:flex-row w-full rounded-xl overflow-hidden bg-surface">
          {/* Lado Izquierdo: Foto Principal y Localización */}
          <div className="md:w-5/12 flex flex-col bg-gray-100 dark:bg-gray-800 border-r border-border shrink-0">
            <div className="flex-1 relative min-h-[200px]">
              {person.photoUrl ? (
                <img
                  src={person.photoUrl}
                  alt={person.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700/50 text-gray-400">
                  <span className="text-6xl font-bold opacity-50">{initials}</span>
                </div>
              )}
            </div>
            {isFound && (
              <div className="p-4 bg-green-50 dark:bg-green-900/10 border-t border-green-200 dark:border-green-900/30 flex flex-col gap-2 shrink-0">
                <h4 className="text-sm font-semibold text-green-800 dark:text-green-500">Información de Localización</h4>
                {person.resolutionNote && (
                  <p className="text-xs text-green-700 dark:text-green-400 leading-snug">
                    {person.resolutionNote}
                  </p>
                )}
                {person.resolvedAt && (
                  <p className="text-[10px] text-green-600/70 dark:text-green-500/70">
                    Resuelto el {formatDate(person.resolvedAt)}
                  </p>
                )}
                {person.resolutionPhotoUrl && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setExpandedPhoto(person.resolutionPhotoUrl!)}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors bg-green-100/80 dark:bg-green-900/40 px-3 py-2 rounded-md border border-green-200 dark:border-green-800/60 shadow-sm"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Ver pruebas de localización
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lado Derecho: Detalles */}
          <div className="md:w-7/12 py-2 px-4 md:px-6 flex flex-col gap-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-etext leading-tight">{person.name}</h2>
                <span className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${isFound
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                  }`}>
                  {isFound ? "Localizado" : "Desaparecido"}
                </span>
              </div>
              <p className="mt-1 text-sm text-etext-muted font-medium">
                {person.age ? `${person.age} años` : "Edad desconocida"} • {person.nationality || "Nacionalidad N/D"}
              </p>
            </div>

            <div className="h-px w-full bg-border" />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-etext-soft">Última vez visto</span>
                <span className="text-sm text-etext">{person.lastSeen || "Lugar desconocido"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-etext-soft">Contacto</span>
                <span className="text-sm text-etext">{person.contact || "Sin contacto proporcionado"}</span>
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-etext-soft">Reportado el</span>
                <span className="text-sm text-etext">{formatDate(person.createdAt)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-etext-soft">Descripción de la persona</span>
              <p className="text-sm text-etext leading-relaxed whitespace-pre-wrap">
                {person.description || "No hay descripción adicional."}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border mt-auto">
              {!isFound && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("¿Seguro que deseas eliminar el reporte de esta persona desaparecida? Esta acción no se puede deshacer.")) {
                      onDelete(person.id);
                    }
                  }}
                  className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                >
                  Eliminar
                </button>
              )}
              <div className="flex-1" />
              {!isFound && (
                <button
                  type="button"
                  onClick={() => onMarkFound(person.id)}
                  className="rounded-full bg-navy px-6 py-2 text-sm font-semibold text-on-dark hover:bg-navy/90 transition-colors shadow-sm"
                >
                  Marcar como localizado
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Fullscreen Photo Overlay */}
      {expandedPhoto && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setExpandedPhoto(null)}
        >
          <img
            src={expandedPhoto}
            alt="Foto ampliada"
            className="max-w-full max-h-full object-contain rounded-md"
          />
        </div>
      )}
    </>
  );
}

function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function MissingGrid() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<MissingDTO | null>(null);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "found">("all");
  const [ageFilter, setAgeFilter] = useState<"all" | "minor" | "adult" | "custom">("all");
  const [customAgeMin, setCustomAgeMin] = useState<string>("");
  const [customAgeMax, setCustomAgeMax] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [nationalityFilter, setNationalityFilter] = useState<string>("");

  // Vista / Densidad
  const [gridSize, setGridSize] = useState<"small" | "medium" | "large">("medium");

  // Paginación
  const [page, setPage] = useState(1);
  const itemsPerPage = gridSize === "small" ? 24 : gridSize === "large" ? 12 : 20;

  const [isFoundModalOpen, setIsFoundModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  const handleCreateSubmit = async (payload: MissingPersonPayload) => {
    const res = await fetch("/api/missing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Error al crear el reporte");
    }
    queryClient.invalidateQueries({ queryKey: ["missing"] });
    setIsCreateModalOpen(false);
  };
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleBulkDelete = async () => {
    if (!window.confirm(`¿Seguro que deseas eliminar los ${selectedIds.size} reportes seleccionados?`)) return;
    setIsBulkDeleting(true);
    try {
      for (const id of Array.from(selectedIds)) {
        await fetch(`/api/missing/${id}`, { method: "DELETE" });
      }
      queryClient.setQueryData(["missing", "paginated", listParams], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          total: Math.max(0, oldData.total - selectedIds.size),
          people: oldData.people.filter((p: any) => !selectedIds.has(p.id)),
        };
      });
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } catch (err) {
      alert("Error al eliminar algunos reportes");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Debounce de búsqueda
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  // Reset a página 1 al cambiar filtros o tamaño
  useEffect(() => {
    setPage(1);
  }, [statusFilter, gridSize]);

  const search = debouncedQuery.trim();
  const listParams = {
    status: statusFilter,
    page,
    pageSize: itemsPerPage,
    q: search.length >= 3 ? search : undefined,
  };

  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useMissingPaginated(listParams);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/missing/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      setSelectedPerson(null);

      // Optimistic update: remove from cache immediately
      queryClient.setQueryData(["missing", "paginated", listParams], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          total: Math.max(0, oldData.total - 1),
          people: oldData.people.filter((p: any) => p.id !== id),
        };
      });
      // Removing invalidateQueries so we don't fetch the stale backend cache instantly.
    } catch (err) {
      alert("No se pudo eliminar el reporte");
    }
  };

  const handleMarkFoundSubmit = async (payload: MissingFoundPayload) => {
    if (!selectedPerson) return;
    const res = await fetch(`/api/missing/${selectedPerson.id}/found`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Error al actualizar");
    }

    // Optimistic update
    queryClient.setQueryData(["missing", "paginated", listParams], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        total: listParams.status === "active" ? Math.max(0, oldData.total - 1) : oldData.total,
        people: oldData.people.map((p: any) =>
          p.id === selectedPerson.id ? { ...p, status: "found" } : p
        ).filter((p: any) => listParams.status === "active" ? p.status !== "found" : true),
      };
    });

    // Removing invalidateQueries so we don't fetch the stale backend cache instantly.
    setSelectedPerson(null);
    setIsFoundModalOpen(false);
  };

  const serverPeople = (data?.people as unknown as MissingDTO[]) ?? [];
  const totalRecords = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  function normalizeText(text: string | null | undefined): string {
    if (!text) return "";
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  // Client-side filtering on the current page returned by the server
  const paginated = useMemo(() => {
    const loc = normalizeText(locationFilter);
    const nat = normalizeText(nationalityFilter);

    return serverPeople.filter(p => {
      if (loc && !normalizeText(p.lastSeen).includes(loc)) return false;
      if (nat && !normalizeText(p.nationality).includes(nat)) return false;

      if (ageFilter !== "all") {
        if (p.age === null || p.age === undefined) return false;

        if (ageFilter === "minor" && p.age > 17) return false;
        if (ageFilter === "adult" && p.age < 18) return false;

        if (ageFilter === "custom") {
          const min = parseInt(customAgeMin);
          const max = parseInt(customAgeMax);
          if (!isNaN(min) && p.age < min) return false;
          if (!isNaN(max) && p.age > max) return false;
        }
      }

      return true;
    });
  }, [serverPeople, ageFilter, customAgeMin, customAgeMax, locationFilter, nationalityFilter]);

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        No se pudieron cargar las fichas de personas desaparecidas.
      </div>
    );
  }

  // Clases dinámicas para la cuadrícula según el tamaño seleccionado
  let gridColsClass = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6"; // medium
  if (gridSize === "small") {
    gridColsClass = "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4";
  } else if (gridSize === "large") {
    gridColsClass = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8";
  }

  const toggleSelection = (person: MissingDTO) => {
    if (person.status === "found") {
      alert("No puedes seleccionar reportes de personas localizadas.");
      return;
    }
    const next = new Set(selectedIds);
    if (next.has(person.id)) {
      next.delete(person.id);
    } else {
      if (next.size >= 10) {
        alert("Puedes seleccionar un máximo de 10 reportes a la vez.");
        return;
      }
      next.add(person.id);
    }
    setSelectedIds(next);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Controles: Buscador y Filtros integrados */}
      <div className="flex flex-col items-center justify-center gap-3 bg-surface p-4 rounded-2xl border border-border shadow-sm relative">

        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          {/* Barra de Búsqueda */}
          <div className="relative w-full sm:w-[260px] shrink-0">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-etext-soft">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Buscar persona, descripción..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border border-border bg-gray-50/50 dark:bg-gray-800/50 py-1.5 pl-9 pr-3 text-xs text-etext placeholder:text-etext-soft focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy transition-colors"
            />
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Status Filter */}
          <div className="flex items-center justify-center gap-1 p-0.5 rounded-full bg-gray-50 dark:bg-gray-800/50 border border-border shrink-0">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${statusFilter === "all" ? "bg-navy text-on-dark shadow-sm" : "text-etext-muted hover:text-etext"}`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${statusFilter === "active" ? "bg-red-100 text-red-800 shadow-sm border border-red-200" : "text-etext-muted hover:text-etext"}`}
            >
              Desaparecidos
            </button>
            <button
              onClick={() => setStatusFilter("found")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${statusFilter === "found" ? "bg-green-100 text-green-800 shadow-sm border border-green-200" : "text-etext-muted hover:text-etext"}`}
            >
              Localizados
            </button>
          </div>

          <div className="h-4 w-px bg-border hidden sm:block mx-1" />

          {/* Filtro de Lugar */}
          <div className="relative shrink-0">
            <input
              type="text"
              placeholder="Lugar (ej. Caracas)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-[120px] rounded-full border border-border bg-gray-50/50 dark:bg-gray-800/50 px-3 py-1.5 text-xs text-etext placeholder:text-etext-soft focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy transition-all"
            />
          </div>

          {/* Filtro de Nacionalidad */}
          <div className="relative shrink-0">
            <input
              type="text"
              placeholder="Nacionalidad..."
              value={nationalityFilter}
              onChange={(e) => setNationalityFilter(e.target.value)}
              className="w-[110px] rounded-full border border-border bg-gray-50/50 dark:bg-gray-800/50 px-3 py-1.5 text-xs text-etext placeholder:text-etext-soft focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy transition-all"
            />
          </div>

          {/* Age Filter */}
          <div className="flex items-center justify-center gap-1 p-0.5 rounded-full bg-gray-50 dark:bg-gray-800/50 border border-border shrink-0">
            <button
              onClick={() => setAgeFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${ageFilter === "all" ? "bg-navy text-on-dark shadow-sm" : "text-etext-muted hover:text-etext"}`}
            >
              Edad: Todas
            </button>
            <button
              onClick={() => setAgeFilter("minor")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${ageFilter === "minor" ? "bg-navy text-on-dark shadow-sm" : "text-etext-muted hover:text-etext"}`}
            >
              0-17
            </button>
            <button
              onClick={() => setAgeFilter("adult")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${ageFilter === "adult" ? "bg-navy text-on-dark shadow-sm" : "text-etext-muted hover:text-etext"}`}
            >
              18+
            </button>
            <button
              onClick={() => setAgeFilter("custom")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${ageFilter === "custom" ? "bg-navy text-on-dark shadow-sm" : "text-etext-muted hover:text-etext"}`}
            >
              Rango
            </button>
          </div>

          {/* Custom Age Inputs */}
          {ageFilter === "custom" && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-etext-muted animate-in fade-in slide-in-from-left-2 duration-200 shrink-0">
              <input
                type="number"
                placeholder="Min"
                value={customAgeMin}
                onChange={(e) => setCustomAgeMin(e.target.value)}
                className="w-14 rounded-full border border-border bg-gray-50/50 dark:bg-gray-800/50 px-2 py-1 text-center focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={customAgeMax}
                onChange={(e) => setCustomAgeMax(e.target.value)}
                className="w-14 rounded-full border border-border bg-gray-50/50 dark:bg-gray-800/50 px-2 py-1 text-center focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              />
            </div>
          )}

          <div className="h-4 w-px bg-border hidden sm:block mx-1" />

          {/* Grid Size Selector */}
          <div className="flex items-center justify-center gap-1 p-0.5 rounded-full bg-gray-50 dark:bg-gray-800/50 border border-border shrink-0" title="Tamaño de las tarjetas">
            <button
              onClick={() => setGridSize("small")}
              className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all ${gridSize === "small" ? "bg-navy text-on-dark shadow-sm" : "text-etext-muted hover:text-etext"}`}
            >
              S
            </button>
            <button
              onClick={() => setGridSize("medium")}
              className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all ${gridSize === "medium" ? "bg-navy text-on-dark shadow-sm" : "text-etext-muted hover:text-etext"}`}
            >
              M
            </button>
            <button
              onClick={() => setGridSize("large")}
              className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all ${gridSize === "large" ? "bg-navy text-on-dark shadow-sm" : "text-etext-muted hover:text-etext"}`}
            >
              L
            </button>
          </div>

          <div className="text-xs font-medium text-etext-soft whitespace-nowrap px-2 shrink-0">
            {new Intl.NumberFormat('es-VE').format(totalRecords)} reg.
          </div>

          <div className="h-4 w-px bg-border hidden xl:block mx-1" />

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-full bg-navy px-4 py-1.5 text-xs font-semibold text-on-dark hover:bg-navy/90 transition-colors"
            >
              Crear Reporte
            </button>
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedIds(new Set());
              }}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${isSelectionMode ? "bg-brand-blue/10 border-brand-blue text-brand-blue" : "bg-surface border-border text-etext hover:bg-gray-50"}`}
            >
              {isSelectionMode ? "Cancelar" : "Selección Múltiple"}
            </button>
            {isSelectionMode && selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isBulkDeleting ? "Eliminando..." : `Eliminar (${selectedIds.size})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-border rounded-2xl bg-surface/50">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300 mb-4">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <p className="text-etext-muted font-medium text-lg">No se encontraron personas</p>
          <p className="text-etext-soft text-sm mt-1">Intenta con otros filtros o términos de búsqueda.</p>
        </div>
      ) : (
        <>
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              size="small"
            />
          )}
          <div className={`grid ${gridColsClass}`}>
            {paginated.map(person => (
              <div key={person.id} className="relative group">
                <MissingCard
                  person={person}
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleSelection(person);
                    } else {
                      setSelectedPerson(person);
                    }
                  }}
                  size={gridSize}
                />
                {isSelectionMode && (
                  <div className="absolute top-2 left-2 z-10 pointer-events-none">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedIds.has(person.id) ? "bg-navy border-navy text-white" : "bg-white/90 border-gray-300"}`}>
                      {selectedIds.has(person.id) && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      )}
                    </div>
                  </div>
                )}
                {isSelectionMode && selectedIds.has(person.id) && (
                  <div className="absolute inset-0 border-2 border-navy rounded-[inherit] pointer-events-none" style={{ borderRadius: '24px' }} />
                )}
                {isSelectionMode && (
                  <div className="absolute inset-0 bg-transparent cursor-pointer" onClick={() => {
                    toggleSelection(person);
                  }} />
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <MissingDetailsModal
        person={selectedPerson}
        isOpen={!!selectedPerson && !isFoundModalOpen}
        onClose={() => setSelectedPerson(null)}
        onDelete={handleDelete}
        onMarkFound={(id) => setIsFoundModalOpen(true)}
      />

      {selectedPerson && (
        <MissingFoundModal
          isOpen={isFoundModalOpen}
          personName={selectedPerson.name}
          onCancel={() => setIsFoundModalOpen(false)}
          onSubmit={handleMarkFoundSubmit}
        />
      )}

      {isCreateModalOpen && (
        <MissingPersonForm
          onCancel={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}
    </div>
  );
}
