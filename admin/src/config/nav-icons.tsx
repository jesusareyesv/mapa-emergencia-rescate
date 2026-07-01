import type { ReactNode } from "react";

/**
 * Íconos de navegación — SVG inline (stroke 1.5, 20×20, currentColor).
 * Keyed por el id del ítem de nav. Sin dependencias externas.
 */
const PATHS: Record<string, ReactNode> = {
  home: <path d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3v-5H7v5H4a1 1 0 0 1-1-1V9.5Z" />,
  reports: (
    <>
      <path d="M5 3h7l4 4v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M12 3v4h4M7 11h6M7 14h6" />
    </>
  ),
  missing: (
    <>
      <circle cx="10" cy="6.5" r="2.5" />
      <path d="M4.5 16.5a5.5 5.5 0 0 1 11 0" />
    </>
  ),
  chat: <path d="M4 5h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H8l-4 3v-3a1 1 0 0 1 0-.001V6a1 1 0 0 1 1-1Z" />,
  donations: (
    <>
      <path d="M10 16.5S3.5 12.5 3.5 8.2A3.2 3.2 0 0 1 10 6a3.2 3.2 0 0 1 6.5 2.2c0 4.3-6.5 8.3-6.5 8.3Z" />
    </>
  ),
  hospitals: (
    <>
      <rect x="4" y="4" width="12" height="13" rx="1" />
      <path d="M10 7.5v5M7.5 10h5" />
    </>
  ),
  contact: (
    <>
      <rect x="3.5" y="5" width="13" height="10" rx="1" />
      <path d="m4 6 6 4.5L16 6" />
    </>
  ),
  integraciones: (
    <>
      <path d="M7 3v4M13 3v4M5.5 7h9v3a4.5 4.5 0 0 1-9 0V7ZM10 14.5V17" />
    </>
  ),
  users: (
    <>
      <circle cx="8" cy="7" r="2.5" />
      <path d="M3.5 16a4.5 4.5 0 0 1 9 0M13 5.5a2.5 2.5 0 0 1 0 5M14 16a4.5 4.5 0 0 0-2.5-4" />
    </>
  ),
  roles: (
    <>
      <path d="M10 3.5 4.5 6v4c0 3.3 2.4 5.6 5.5 6.5 3.1-.9 5.5-3.2 5.5-6.5V6L10 3.5Z" />
      <path d="m7.8 10 1.6 1.6 3-3.2" />
    </>
  ),
  audit: (
    <>
      <path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z" />
      <circle cx="10" cy="10" r="2.5" />
    </>
  ),
  patients: (
    <>
      <path d="M3 10.5h3l1.5-3 2.5 6 1.5-3H17" />
    </>
  ),
};

export function NavIcon({ id, className }: { id: string; className?: string }) {
  const inner = PATHS[id];
  if (!inner) return null;
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {inner}
    </svg>
  );
}
