"use client";

import Image from "next/image";
import { useState } from "react";

const LINKS = [
  { href: "#lore", label: "Lore" },
  { href: "#dashboard", label: "Dashboard" },
  { href: "#tech", label: "The tech" },
  { href: "#episodes", label: "Episodes" },
  { href: "#film", label: "Full film" },
];

export function Nav({ ticker, buyUrl }: { ticker: string; buyUrl: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="container-x flex h-[72px] items-center justify-between">
        <a href="#top" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/wei-assets/wei-logo.png"
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-full"
          />
          <span className="title text-[1.6rem] font-bold">Wei the Dog</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="label text-[0.7rem] text-ink/80 transition hover:text-accent">
              {l.label}
            </a>
          ))}
          <a
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="label rounded-[3px] bg-accent px-5 py-3 text-[0.7rem] font-semibold text-bg transition hover:brightness-110"
          >
            Buy ${ticker} · Earn $ETH
          </a>
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex size-10 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span className={`h-0.5 w-6 bg-ink transition ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-6 bg-ink transition ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 bg-ink transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-bg md:hidden">
          <div className="container-x flex flex-col py-4">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="label py-3 text-ink/85">
                {l.label}
              </a>
            ))}
            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="label mt-3 rounded-[3px] bg-accent px-5 py-3 text-center font-semibold text-bg"
            >
              Buy ${ticker} · Earn $ETH
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
