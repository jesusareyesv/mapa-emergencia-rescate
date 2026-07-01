"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Badge } from "../src/ui";
import { AdminGate } from "../src/shared/auth/admin-gate";
import { useAdminSessionContext } from "../src/shared/auth/admin-session-context";
import { NAV_SECTIONS } from "../src/config/nav";
import { NavIcon } from "../src/config/nav-icons";
import { resolveActiveId, filterNavByCapabilities, type AdminCounts } from "../src/lib/nav-helpers";
import { ChatPanel } from "../src/contexts/chat/chat-panel";

type SidebarMode = "expanded" | "collapsed" | "hover";

const SIDEBAR_KEY = "admin_sidebar_mode";
const THEME_KEY = "admin_theme";

type Theme = "light" | "dark" | "alan";

function readTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const v = window.localStorage.getItem(THEME_KEY);
  if (v === "light" || v === "dark" || v === "alan") return v;
  return "light";
}

function readSidebarMode(): SidebarMode {
  if (typeof window === "undefined") return "expanded";
  const val = window.localStorage.getItem(SIDEBAR_KEY);
  if (val === "expanded" || val === "collapsed" || val === "hover") return val;
  return "expanded";
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <AdminGate>
      <AuthedShell>{children}</AuthedShell>
    </AdminGate>
  );
}

function AuthedShell({ children }: { children: ReactNode }) {
  const { user, can, logout } = useAdminSessionContext();
  const pathname = usePathname();

  const [navOpen, setNavOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(readSidebarMode);
  const [isHovered, setIsHovered] = useState(false);
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [alanBoot, setAlanBoot] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const sidebarMenuRef = useRef<HTMLDivElement>(null);
  const cmdInputRef = useRef<HTMLInputElement>(null);

  const isCollapsed = sidebarMode === "collapsed" || (sidebarMode === "hover" && !isHovered);
  const railWidth = sidebarMode === "expanded" ? "16rem" : "3.5rem";
  const panelWidth = isCollapsed ? "3.5rem" : "16rem";

  const changeSidebarMode = (mode: SidebarMode) => {
    setSidebarMode(mode);
    setIsHovered(false);
    setSidebarMenuOpen(false);
    localStorage.setItem(SIDEBAR_KEY, mode);
  };

  // Cambia el tema; al entrar a "alan" dispara el overlay de arranque una vez.
  const applyTheme = (next: Theme) => {
    if (next === "alan" && theme !== "alan") {
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (!reduce) {
        setAlanBoot(true);
        setTimeout(() => setAlanBoot(false), 1300);
      }
    }
    setTheme(next);
  };

  // Sync theme class to <html> and persist
  useEffect(() => {
    document.documentElement.classList.remove("dark", "alan");
    if (theme !== "light") document.documentElement.classList.add(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Global keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        setChatOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setNavOpen(false);
        setUserMenuOpen(false);
        setSidebarMenuOpen(false);
        setCmdOpen(false);
        setChatOpen(false);
      }
    }
    document.addEventListener("keydown", onKey, { capture: true });
    return () => document.removeEventListener("keydown", onKey, { capture: true });
  }, []);

  // Focus command palette input when it opens
  useEffect(() => {
    if (cmdOpen) {
      setTimeout(() => cmdInputRef.current?.focus(), 0);
    }
  }, [cmdOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (sidebarMenuRef.current && !sidebarMenuRef.current.contains(e.target as Node)) {
        setSidebarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // Block body scroll with mobile drawer open
  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  const visibleSections = useMemo(() => filterNavByCapabilities(NAV_SECTIONS, can), [can]);
  const activeId = resolveActiveId(pathname, NAV_SECTIONS);
  const activeLabel = useMemo(() => {
    const item = NAV_SECTIONS.flatMap((c) => c.items).find((i) => i.id === activeId);
    return item?.label ?? "Panel";
  }, [activeId]);

  const counts: AdminCounts = {};
  const swaggerUrl = `${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/+$/, "")}/api/docs`;
  const userEmail = user?.email ?? "";
  const userInitial = (userEmail || "?").slice(0, 1).toUpperCase();
  const userName = userEmail.split("@")[0] ?? userInitial;

  const sidebarBodyProps = {
    isCollapsed,
    sidebarMode,
    sidebarMenuRef,
    sidebarMenuOpen,
    onSidebarMenuToggle: () => setSidebarMenuOpen((v) => !v),
    onChangeSidebarMode: changeSidebarMode,
    visibleSections,
    activeId,
    counts,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile nav backdrop */}
      {navOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden
        />
      )}

      {/* Command palette backdrop */}
      {cmdOpen && (
        <div
          className="fixed inset-0 z-[105] bg-black/50 backdrop-blur-sm"
          onClick={() => setCmdOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Mobile drawer ──────────────────────────────────────────── */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface",
          "lg:hidden transition-transform duration-300",
          navOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-label="Navegación del panel"
      >
        <SidebarBody
          {...sidebarBodyProps}
          onNavClose={() => setNavOpen(false)}
          showModeSelector={false}
        />
      </aside>

      {/* ── Desktop sidebar rail ────────────────────────────────────── */}
      <div
        className="hidden lg:block relative shrink-0"
        style={{ width: railWidth, transition: "width 280ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        <aside
          className={[
            "flex flex-col border-r border-border bg-surface",
            sidebarMode === "hover" ? "absolute inset-y-0 left-0 z-40 shadow-xl" : "h-full",
          ].join(" ")}
          style={{ width: panelWidth, transition: "width 280ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          onMouseEnter={sidebarMode === "hover" ? () => setIsHovered(true) : undefined}
          onMouseLeave={sidebarMode === "hover" ? () => setIsHovered(false) : undefined}
          aria-label="Navegación del panel"
        >
          <SidebarBody {...sidebarBodyProps} onNavClose={() => {}} showModeSelector />
        </aside>
      </div>

      {/* ── Content column ─────────────────────────────────────────── */}
      <div className="relative flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Dot-grid background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(9,35,52,0.045) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* ── Top nav ─────────────────────────────────────────────── */}
        <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface/80 backdrop-blur-sm px-4">
          {/* Left: hamburger (mobile) + breadcrumb */}
          <div className="flex min-w-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="mr-1 flex h-8 w-8 items-center justify-center rounded-md text-etext-muted hover:bg-surface-muted lg:hidden"
              aria-label="Abrir navegación"
            >
              <HamburgerIcon />
            </button>

            <div className="flex items-center gap-0.5 text-[13px]">
              <span className="px-2 font-medium text-etext/80">{userName}</span>
              <Slash />
              <span className="px-2 font-medium text-etext-muted">{activeLabel}</span>
            </div>
          </div>

          {/* Right: actions + user avatar */}
          <div className="flex items-center gap-1.5">
            {/* Search / ⌘K */}
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 h-8 rounded-full border border-border bg-surface px-3 text-etext-muted hover:bg-surface-muted hover:text-etext transition-colors"
            >
              <SearchIcon />
              <span className="hidden text-xs text-etext-soft sm:block">Buscar</span>
              <kbd className="hidden items-center text-[10px] text-etext-soft font-mono sm:inline-flex">
                ⌘K
              </kbd>
            </button>

            {/* Chat panel toggle */}
            <button
              type="button"
              onClick={() => setChatOpen((v) => !v)}
              aria-label={chatOpen ? "Cerrar chat" : "Abrir chat (⌘I)"}
              title={chatOpen ? "Cerrar chat" : "Chat (⌘I)"}
              className={[
                "flex items-center justify-center h-8 w-8 rounded-full border transition-colors",
                chatOpen
                  ? "border-navy bg-navy/10 text-navy"
                  : "border-border bg-surface text-etext-muted hover:bg-surface-muted hover:text-etext",
              ].join(" ")}
            >
              <ChatBubbleIcon />
            </button>

            {/* API Docs */}
            <a
              href={swaggerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center justify-center h-8 w-8 rounded-full border border-border bg-surface text-etext-muted hover:bg-surface-muted hover:text-etext transition-colors"
              title="API Docs"
            >
              <ExternalLinkIcon />
            </a>

            {/* User avatar + dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-muted text-[14px] font-bold text-etext hover:border-border hover:bg-surface-muted/80 transition-colors"
                aria-label="Menú de usuario"
              >
                {userInitial}
              </button>

              {userMenuOpen && (
                <div className="fixed right-4 top-14 z-[60] min-w-[200px] rounded-xl border border-border bg-surface shadow-xl overflow-hidden">
                  <div className="border-b border-border px-3 py-2.5">
                    <p className="text-[13px] font-semibold text-etext truncate">{userName}</p>
                    <p className="text-[11px] text-etext-muted truncate">{userEmail}</p>
                  </div>
                  <a
                    href={swaggerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-etext-muted hover:bg-surface-muted hover:text-etext transition-colors"
                  >
                    <ExternalLinkIcon />
                    API Docs ↗
                  </a>
                  {(["light", "dark", "alan"] as Theme[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => applyTheme(t)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-etext-muted hover:bg-surface-muted hover:text-etext transition-colors"
                    >
                      {t === "light" && <SunIcon />}
                      {t === "dark" && <MoonIcon />}
                      {t === "alan" && <TerminalIcon />}
                      <span className="flex-1 text-left">
                        {t === "light" ? "Modo claro" : t === "dark" ? "Modo oscuro" : ">_ Allan"}
                      </span>
                      {theme === t && <CheckIcon />}
                    </button>
                  ))}
                  <div className="border-t border-border" />
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      void logout();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-crisis hover:bg-surface-muted transition-colors"
                  >
                    <LogOutIcon />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main
          className={[
            "flex-1 overflow-y-auto p-6 transition-[padding] duration-300",
            chatOpen ? "xl:pr-[516px]" : "",
          ].join(" ")}
        >
          {children}
        </main>
      </div>

      {/* ── Panel de chat ────────────────────────────────────────── */}
      <div
        className={[
          "fixed right-0 top-14 z-[100] flex h-[calc(100vh-3.5rem)] w-full max-w-[500px] flex-col border-l border-border bg-surface shadow-2xl",
          "transition-transform duration-300 ease-out",
          chatOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-label="Panel de chat"
      >
        <ChatPanel onClose={() => setChatOpen(false)} />
      </div>

      {/* ── Command palette ⌘K ──────────────────────────────────── */}
      {cmdOpen && (
        <div className="fixed left-1/2 top-[18%] z-[110] w-full max-w-md -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <SearchIcon className="shrink-0 text-etext-soft" />
            <input
              ref={cmdInputRef}
              type="text"
              placeholder="Ir a..."
              className="flex-1 bg-transparent text-sm text-etext placeholder:text-etext-soft outline-none"
              readOnly
            />
            <kbd className="rounded border border-border px-1.5 py-0.5 text-[11px] font-mono text-etext-soft">
              Esc
            </kbd>
          </div>

          <div className="max-h-72 overflow-y-auto py-2 no-scrollbar">
            {visibleSections.map((cluster) => (
              <div key={cluster.cluster}>
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-etext-soft">
                  {cluster.cluster}
                </p>
                {cluster.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setCmdOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-etext-muted hover:bg-surface-muted hover:text-etext transition-colors"
                  >
                    <NavIcon id={item.id} className="h-4 w-4 shrink-0 text-etext-soft" />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Overlay de arranque del modo alan ───────────────────────── */}
      {alanBoot && (
        <div
          className="alan-boot-overlay pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-black"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(0,255,65,0.10) 0px, rgba(0,255,65,0.10) 1px, transparent 1px, transparent 3px)",
          }}
          aria-hidden
        >
          <div className="alan-scanline absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#00ff41]/25 to-transparent" />
          <p className="dash-cursor font-mono text-base text-[#00ff41]">
            &gt; initializing alan_mode...
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Sidebar body — shared between mobile drawer and desktop rail ── */

const SIDEBAR_MODES: { value: SidebarMode; label: string }[] = [
  { value: "expanded", label: "Expandido" },
  { value: "collapsed", label: "Colapsado" },
  { value: "hover", label: "Expandir al pasar" },
];

function SidebarBody({
  isCollapsed,
  sidebarMode,
  sidebarMenuRef,
  sidebarMenuOpen,
  onSidebarMenuToggle,
  onChangeSidebarMode,
  visibleSections,
  activeId,
  counts,
  onNavClose,
  showModeSelector,
}: {
  isCollapsed: boolean;
  sidebarMode: SidebarMode;
  sidebarMenuRef: RefObject<HTMLDivElement | null>;
  sidebarMenuOpen: boolean;
  onSidebarMenuToggle: () => void;
  onChangeSidebarMode: (m: SidebarMode) => void;
  visibleSections: ReturnType<typeof filterNavByCapabilities>;
  activeId: string | null;
  counts: AdminCounts;
  onNavClose: () => void;
  showModeSelector: boolean;
}) {
  return (
    <>
      {/* overflow-hidden wrapper: clips brand + nav text during width animation */}
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        {/* Brand */}
        <div
          className="flex h-14 shrink-0 items-center border-b border-border overflow-hidden"
          style={{ padding: isCollapsed ? "0 0.75rem" : "0 1rem" }}
        >
          {isCollapsed ? (
            <Link
              href="/"
              className="mx-auto grid h-7 w-7 shrink-0 place-items-center rounded-md bg-crisis text-white shadow-sm"
              title="TERREMOTOVENEZUELA.APP"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </Link>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-crisis text-white shadow-sm">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </span>
              <Link href="/" className="truncate text-sm font-bold text-etext">
                TERREMOTOVENEZUELA.APP
              </Link>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden p-2 no-scrollbar">
          {visibleSections.map((cluster) => (
            <div key={cluster.cluster} className="mb-1">
              <div
                className="overflow-hidden transition-all duration-200"
                style={{
                  height: isCollapsed ? 0 : undefined,
                  opacity: isCollapsed ? 0 : undefined,
                }}
              >
                <p className="mb-0.5 mt-3 px-2 text-[10px] font-semibold uppercase tracking-widest text-etext-soft first:mt-1">
                  {cluster.cluster}
                </p>
              </div>
              {cluster.items.map((item) => {
                const active = activeId === item.id;
                const badgeCount = item.badgeKey ? (counts[item.badgeKey] ?? 0) : 0;
                return (
                  <NavItem
                    key={item.id}
                    item={item}
                    active={active}
                    badgeCount={badgeCount}
                    isCollapsed={isCollapsed}
                    onClick={onNavClose}
                  />
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer — outside overflow-hidden so the dropdown can float above */}
      <div
        className="shrink-0 border-t border-border p-2"
        ref={showModeSelector ? sidebarMenuRef : undefined}
      >
        {showModeSelector && (
          <div className="relative">
            <button
              type="button"
              onClick={onSidebarMenuToggle}
              title="Control del sidebar"
              className={[
                "flex h-7 items-center rounded-md text-etext-muted hover:bg-surface-muted hover:text-etext transition-colors",
                isCollapsed ? "w-8 mx-auto justify-center" : "w-full gap-2 px-2",
              ].join(" ")}
            >
              <SidebarPanelIcon />
              {!isCollapsed && (
                <span className="flex-1 text-left text-xs">Control del sidebar</span>
              )}
            </button>

            {sidebarMenuOpen && (
              <div className="absolute bottom-full left-0 mb-1 z-50 min-w-[200px] rounded-xl border border-border bg-surface shadow-lg overflow-hidden">
                <p className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-etext-soft">
                  Control del sidebar
                </p>
                {SIDEBAR_MODES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onChangeSidebarMode(value)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-etext-muted hover:bg-surface-muted hover:text-etext transition-colors"
                  >
                    <span
                      className={[
                        "grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                        sidebarMode === value ? "border-navy bg-navy" : "border-border",
                      ].join(" ")}
                    >
                      {sidebarMode === value && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Nav item ───────────────────────────────────────────────────── */

function NavItem({
  item,
  active,
  badgeCount,
  isCollapsed,
  onClick,
}: {
  item: { id: string; href: string; label: string; badgeKey?: string };
  active: boolean;
  badgeCount: number;
  isCollapsed: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative group/nav">
      <Link
        href={item.href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={[
          "flex items-center rounded-lg text-sm font-medium transition-colors",
          isCollapsed ? "h-8 w-8 mx-auto justify-center" : "gap-2.5 px-2 py-1.5 w-full",
          active
            ? "bg-navy text-on-dark"
            : "text-etext-muted hover:text-etext hover:bg-surface-muted",
        ].join(" ")}
      >
        <NavIcon
          id={item.id}
          className={[
            "h-[18px] w-[18px] shrink-0 transition-colors",
            active ? "text-on-dark" : "text-etext-soft group-hover/nav:text-etext",
          ].join(" ")}
        />
        {!isCollapsed && item.label}
        {!isCollapsed && badgeCount > 0 && <Badge count={badgeCount} />}
      </Link>

      {/* Tooltip in collapsed mode */}
      {isCollapsed && (
        <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2.5 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1 text-[12px] font-medium text-etext opacity-0 shadow-md transition-opacity duration-150 group-hover/nav:opacity-100">
          {item.label}
          {badgeCount > 0 && (
            <span className="ml-1.5 rounded-full bg-crisis px-1.5 py-0.5 text-[10px] font-bold text-on-dark">
              {badgeCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────────────── */

function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M11 2 4 11h4l-1 7 7-9h-4l1-7Z" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M3 5h14M3 10h14M3 15h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Slash() {
  return <span className="select-none px-0.5 text-sm text-etext-soft/40">/</span>;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M11 3h6m0 0v6m0-6L8 12M5 5H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M13 5l5 5-5 5M18 10H7M7 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M2 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6l-4 3V5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M17.5 11.5A7.5 7.5 0 0 1 8.5 2.5a7.5 7.5 0 1 0 9 9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6 8l3 2.5L6 13M11 13h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4 10l5 5 7-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SidebarPanelIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 3v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
