"use client";

import Image from "next/image";
import { useState } from "react";

type Links = { buy: string; chart: string; x: string; telegram: string; index?: string };

export function Buy({ address, ticker, links }: { address: string; ticker: string; links: Links }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // Fallback for non-secure contexts / older browsers
      const ta = document.createElement("textarea");
      ta.value = address;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const ghost =
    "inline-flex items-center justify-center rounded-[3px] border border-ink/25 bg-bg/40 px-5 py-3.5 text-[0.95rem] font-semibold backdrop-blur-sm transition hover:border-ink/60";

  return (
    <section id="buy" className="relative isolate overflow-hidden py-28 md:py-40">
      <Image src="/wei-assets/hero-wide.jpg" alt="" fill sizes="100vw" className="-z-20 object-cover object-[center_40%]" />
      <div className="absolute inset-0 -z-10 bg-bg/35" />

      <div className="container-x flex flex-col items-center text-center">
        <h2 className="title text-[clamp(3.5rem,9vw,6.5rem)]">Keep Wei alive</h2>
        <p className="mt-4 text-lg text-ink/90">Every holder is one more light on the node racks.</p>

        <div className="mt-9 flex w-full max-w-[560px] items-stretch overflow-hidden rounded-[3px] border border-ink/25 bg-bg/85">
          <code className="min-w-0 flex-1 truncate px-4 py-3.5 text-left font-mono text-[0.8rem] text-ink/90 sm:text-center sm:text-[0.85rem]">
            {address || "[CONTRACT ADDRESS]"}
          </code>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy contract address"
            className="border-l border-ink/25 px-5 text-[0.85rem] font-semibold text-accent transition hover:bg-accent hover:text-bg"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <span className="sr-only" aria-live="polite">
          {copied ? "Contract address copied" : ""}
        </span>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a
            href={links.buy}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-[3px] bg-accent px-6 py-3.5 text-[0.95rem] font-semibold text-bg transition hover:brightness-110"
          >
            Buy ${ticker}
          </a>
          {[
            { href: links.chart, label: "Chart" },
            { href: links.index, label: "Index" },
            { href: links.x, label: "X" },
            { href: links.telegram, label: "Telegram" },
          ]
            .filter((l) => l.href)
            .map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={ghost}>
                {l.label}
              </a>
            ))}
        </div>
      </div>
    </section>
  );
}
