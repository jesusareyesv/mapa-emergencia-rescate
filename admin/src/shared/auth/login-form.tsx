"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Input, Button } from "@/src/ui";

export interface LoginFormProps {
  /** Llamado con email+password al enviar. Puede lanzar en error de auth. */
  onSubmit: (email: string, password: string) => Promise<void>;
}

/**
 * Formulario de login (email + password) construido con los atoms de @/src/ui.
 * Posee email, password, pending y error; delega la lógica de auth a onSubmit.
 * Renderiza el layout completo de pantalla dividida.
 */
export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Aplicar modo oscuro si está configurado en localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = window.localStorage.getItem("admin_dark_mode") === "1";
      document.documentElement.classList.toggle("dark", isDark);
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await onSubmit(email, password);
    } catch {
      setError("Credenciales inválidas. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-canvas transition-colors duration-300">
      {/* Panel Izquierdo (Branding / Info) */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center bg-canvas p-12 relative overflow-hidden border-r border-border transition-colors duration-300">
        {/* Mapa Estilo Google de Fondo */}
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125322.9515949219!2d-66.97343719003504!3d10.468641199654157!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c2a58adcd824807%3A0x93dd2eae0a998483!2sCaracas%2C%20Capital%20District%2C%20Venezuela!5e0!3m2!1sen!2sus!4v1717616142981!5m2!1sen!2sus"
          className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-40 dark:opacity-10 grayscale-[0.5] dark:grayscale dark:invert mix-blend-multiply dark:mix-blend-screen transition-all duration-300"
          loading="lazy"
          title="Fondo Mapa"
        />

        <div className="z-10 flex flex-col items-center text-center max-w-md bg-surface/95 backdrop-blur-xl p-10 rounded-[32px] shadow-2xl border border-border transition-colors duration-300">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-crisis text-white shadow-lg border border-crisis-h transition-colors duration-300">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black mb-6 tracking-tight leading-tight text-navy dark:text-etext break-words w-full transition-colors duration-300">
            PANEL ADMINISTRATIVO<br />
            <span className="text-crisis font-style-italic drop-shadow-sm text-[28px] xl:text-[34px]">TERREMOTOVENEZUELA.APP</span>
          </h1>
          <div className="w-16 h-1.5 bg-crisis rounded-full mb-8 shadow-sm" />
          <p className="text-navy dark:text-etext font-bold text-[15px] leading-relaxed max-w-[90%] mx-auto transition-colors duration-300">
            "Plataforma de control y distribución de recursos a todo el país con los más altos estándares de respuesta."
          </p>
          <p className="text-etext-muted font-semibold text-[12px] leading-relaxed mt-6 max-w-xs mx-auto transition-colors duration-300">
            Control administrativo y asignación continua para operaciones de emergencia y rescate.
          </p>
        </div>
      </div>

      {/* Panel Derecho (Login) */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 bg-surface-muted relative overflow-hidden transition-colors duration-300">

        {/* Fondo sutil tipo mapa (puntos) para dar textura extra en el panel derecho */}
        <div
          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1]"
          style={{ backgroundImage: "radial-gradient(currentColor 2px, transparent 2px)", backgroundSize: "32px 32px" }}
          aria-hidden="true"
        />

        {/* Múltiples Cruces Rojas Flotantes */}
        <div className="absolute top-[10%] right-[15%] opacity-30 dark:opacity-20 animate-float text-crisis drop-shadow-sm">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 10h-5V5a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v5H5a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h5v5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5h5a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z" />
          </svg>
        </div>
        <div className="absolute top-[25%] left-[8%] opacity-20 dark:opacity-10 animate-float-reverse text-crisis drop-shadow-sm" style={{ animationDelay: "1s" }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 10h-5V5a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v5H5a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h5v5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5h5a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z" />
          </svg>
        </div>
        <div className="absolute bottom-[15%] left-[12%] opacity-[0.15] dark:opacity-[0.08] animate-float text-crisis drop-shadow-sm" style={{ animationDelay: "2s" }}>
          <svg width="140" height="140" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 10h-5V5a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v5H5a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h5v5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5h5a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z" />
          </svg>
        </div>
        <div className="absolute bottom-[30%] right-[8%] opacity-25 dark:opacity-[0.12] animate-float-reverse text-crisis drop-shadow-sm" style={{ animationDelay: "0.5s" }}>
          <svg width="70" height="70" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 10h-5V5a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v5H5a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h5v5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5h5a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z" />
          </svg>
        </div>
        <div className="absolute top-[45%] left-[80%] opacity-10 dark:opacity-[0.05] animate-float text-crisis drop-shadow-sm" style={{ animationDelay: "1.5s" }}>
          <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 10h-5V5a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v5H5a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h5v5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5h5a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z" />
          </svg>
        </div>

        <div className="z-10 w-full max-w-[420px] rounded-[24px] bg-surface p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] border border-border-strong relative transition-colors duration-300">
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-black text-etext mb-3 tracking-tight transition-colors duration-300">Bienvenido</h2>
            <p className="text-sm font-semibold text-etext-muted leading-relaxed px-2 transition-colors duration-300">
              Ingresa tus credenciales de acceso para gestionar el panel administrativo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-etext ml-1 transition-colors duration-300">
                Correo
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-etext-muted group-focus-within:text-action transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <Input
                  type="text"
                  autoComplete="username"
                  placeholder="correo@dominio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: "3.25rem", borderRadius: "12px", height: "3.5rem" }}
                  className="bg-surface border-2 border-border-strong text-etext font-black focus:bg-surface focus:border-action focus:ring-0 transition-all placeholder:font-bold placeholder:text-etext-soft shadow-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-etext ml-1 transition-colors duration-300">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-etext-muted group-focus-within:text-action transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: "3.25rem", borderRadius: "12px", height: "3.5rem" }}
                  className="bg-surface border-2 border-border-strong text-etext font-black focus:bg-surface focus:border-action focus:ring-0 transition-all placeholder:font-bold placeholder:text-etext-soft shadow-sm"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm font-bold text-crisis mt-1 ml-1 text-center bg-red-50 dark:bg-red-950/30 py-2 rounded-lg border border-red-200 dark:border-red-900/50 transition-colors duration-300">
                {error}
              </p>
            )}

            <Button 
              type="submit" 
              disabled={pending} 
              className="mt-4 text-[14px] bg-navy text-white font-black tracking-[0.15em] uppercase transition-all hover:scale-[1.02] hover:bg-navy/90 active:scale-[0.98] shadow-lg shadow-navy/20 dark:shadow-none"
              style={{ borderRadius: "12px", height: "3.75rem" }}
            >
              {pending ? "Entrando..." : "Entrar al sistema"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
