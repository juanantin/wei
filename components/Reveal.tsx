"use client";

import { useEffect, useRef } from "react";

// Safety net: an IntersectionObserver can miss elements skipped by a fast flick
// or an anchor jump. On scroll, reveal anything that is already above the fold.
const pending = new Set<HTMLElement>();
let listening = false;
function sweep() {
  const limit = window.innerHeight * 0.95;
  for (const el of pending) {
    if (el.getBoundingClientRect().top < limit) {
      el.setAttribute("data-shown", "");
      pending.delete(el);
    }
  }
}
function listen() {
  if (listening) return;
  listening = true;
  let raf = 0;
  window.addEventListener(
    "scroll",
    () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sweep);
    },
    { passive: true },
  );
}

/** Fades/slides its children in the first time they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "span";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    pending.add(el);
    listen();
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.setAttribute("data-shown", "");
          pending.delete(el);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      pending.delete(el);
    };
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`reveal ${className}`}
      style={{ "--d": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
