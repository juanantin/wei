"use client";

import { useEffect, useRef, useState } from "react";
import { DASH } from "@/lib/format";

/** Animates a number from its previous value (or 0) to the new one, then formats it. */
export function CountUp({
  value,
  format,
  duration = 1400,
}: {
  value: number | null | undefined;
  format: (n: number) => string;
  duration?: number;
}) {
  const [shown, setShown] = useState<number | null>(null);
  const from = useRef(0);

  useEffect(() => {
    if (value == null || !Number.isFinite(value)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setShown(a + (value - a) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  if (value == null || !Number.isFinite(value)) return <>{DASH}</>;
  return <>{format(shown ?? 0)}</>;
}
