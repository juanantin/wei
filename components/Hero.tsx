import { Dust } from "./Dust";
import { HeroVideo } from "./HeroVideo";
import { HeroBase, HeroPartners } from "./Partners";

export function Hero({ links }: { links: { launch: string; index: string } }) {
  return (
    <section id="top" className="relative isolate flex min-h-[640px] items-start overflow-hidden md:min-h-[760px]">
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <HeroVideo />
      </div>
      <Dust />
      {/* readability gradients */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/80 via-bg/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-bg to-transparent" />

      <div className="container-x absolute inset-x-0 top-6 md:top-8">
        <HeroBase />
      </div>
      <div className="container-x pb-20 pt-16 md:pt-12">
        <div className="max-w-[620px]">
          <h1 className="title inline-flex flex-col items-center tracking-[-0.02em]">
            <span className="anim-rise block text-[clamp(7.5rem,24vw,17rem)] leading-[0.8]" style={{ "--d": "250ms" } as React.CSSProperties}>
              Wei
            </span>
            <span className="anim-rise relative left-[0.1em] mt-3 block text-[clamp(3.6rem,10.5vw,7.6rem)] leading-[0.9] tracking-[0.01em]" style={{ "--d": "420ms" } as React.CSSProperties}>
              The Dog
            </span>
          </h1>

          <p style={{ "--d": "700ms" } as React.CSSProperties} className="anim-rise mt-14 max-w-[560px] md:mt-24 text-lg leading-relaxed text-ink/90 md:text-xl">
            In a near future, a colonist alone on Mars, sending ETH to his family back on Earth. A rover that turned
            hostile. And an immortal dog that cannot die, as long as the blockchain lives.
          </p>

        </div>

        {/* Buttons left, Stonks Exchange + Stockify right — bottoms aligned */}
        <div className="mt-9 flex flex-wrap items-end justify-between gap-x-6 gap-y-8">
          <div className="anim-rise flex flex-wrap gap-3" style={{ "--d": "880ms" } as React.CSSProperties}>
            <a
              href="#episodes"
              className="btn-sheen inline-flex items-center gap-2.5 rounded-[3px] bg-accent px-6 py-3.5 text-[0.95rem] font-semibold text-bg transition hover:brightness-110"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M2.5 1.5v9l8-4.5-8-4.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
              Watch the series
            </a>
            <a
              href="#lore"
              className="inline-flex items-center rounded-[3px] border border-ink/30 bg-bg/40 px-6 py-3.5 text-[0.95rem] font-semibold transition hover:border-ink/60"
            >
              Read the lore
            </a>
          </div>
          <div className="ml-auto">
            <HeroPartners links={links} />
          </div>
        </div>
      </div>
    </section>
  );
}
