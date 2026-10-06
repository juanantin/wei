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

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[15px]" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 3v18h18" strokeLinecap="round" />
      <path d="m7 15 4-4 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const iconBtn =
  "flex size-10 items-center justify-center rounded-[3px] border border-ink/20 text-ink/85 transition hover:border-accent hover:text-accent";

function Socials({ xUrl, chartUrl }: { xUrl: string; chartUrl: string }) {
  return (
    <>
      {chartUrl && (
        <a href={chartUrl} target="_blank" rel="noopener noreferrer" aria-label="Chart on DexScreener" title="Chart" className={iconBtn}>
          <ChartIcon />
        </a>
      )}
      {xUrl && (
        <a href={xUrl} target="_blank" rel="noopener noreferrer" aria-label="WEI on X" title="X" className={iconBtn}>
          <XIcon />
        </a>
      )}
    </>
  );
}

export function Nav({
  ticker,
  buyUrl,
  xUrl,
  chartUrl,
}: {
  ticker: string;
  buyUrl: string;
  xUrl: string;
  chartUrl: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/55 backdrop-blur-md">
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

        <nav className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="label text-[0.7rem] text-ink/80 transition hover:text-accent">
              {l.label}
            </a>
          ))}
          <div className="-mr-1 flex items-center gap-2">
            <Socials xUrl={xUrl} chartUrl={chartUrl} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="label btn-sheen rounded-[3px] bg-accent px-5 py-2.5 text-[0.7rem] font-semibold text-bg transition hover:brightness-110"
            >
              Buy ${ticker}
            </a>
            <span className="font-mono text-[0.66rem] leading-none font-semibold tracking-[0.12em] text-accent uppercase">Earn $ETH</span>
          </div>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <Socials xUrl={xUrl} chartUrl={chartUrl} />
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex size-10 flex-col items-center justify-center gap-1.5 lg:hidden"
        >
          <span className={`h-0.5 w-6 bg-ink transition ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-6 bg-ink transition ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 bg-ink transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-bg lg:hidden">
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
              className="label mt-3 btn-sheen rounded-[3px] bg-accent px-5 py-3 text-center font-semibold text-bg"
            >
              Buy ${ticker}
            </a>
            <span className="mt-2 text-center font-mono text-[0.75rem] font-semibold tracking-[0.12em] text-accent uppercase">Earn $ETH</span>
          </div>
        </nav>
      )}
    </header>
  );
}
