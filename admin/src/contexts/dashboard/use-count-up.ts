"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Anima un número desde su valor actual hasta `target` con requestAnimationFrame.
 * El setState ocurre dentro del callback del frame (asíncrono), por lo que no
 * viola la regla `react-hooks/set-state-in-effect`.
 */
export function useCountUp(target: number, duration = 900): number {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);

  useEffect(() => {
    const from = displayRef.current;
    const delta = target - from;
    if (delta === 0) return;

    let raf = 0;
    let start: number | null = null;

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(from + delta * eased);
      displayRef.current = value;
      setDisplay(value);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return display;
}
