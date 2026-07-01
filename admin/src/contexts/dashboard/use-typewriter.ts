"use client";

import { useEffect, useState } from "react";

/**
 * Efecto máquina de escribir: revela `text` carácter a carácter.
 * El setState ocurre dentro del callback de setInterval (asíncrono), no en el
 * cuerpo del efecto, así que cumple `react-hooks/set-state-in-effect`.
 */
export function useTypewriter(text: string, speed = 38): { text: string; done: boolean } {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return { text: text.slice(0, count), done: count >= text.length };
}
