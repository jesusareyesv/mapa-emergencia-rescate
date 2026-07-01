export interface BadgeProps {
  count: number;
}

/** Badge numérico para conteos en ítems de navegación. No renderiza si count === 0. */
export function Badge({ count }: BadgeProps) {
  if (count === 0) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-crisis px-1.5 text-[10px] font-bold text-on-dark">
      {count > 99 ? "99+" : count}
    </span>
  );
}
