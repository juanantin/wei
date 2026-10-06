import Image from "next/image";

export function Hero({ incoming }: { incoming: number | null }) {
  return (
    <section id="top" className="relative isolate flex min-h-[640px] items-center overflow-hidden md:min-h-[760px]">
      <Image src="/wei-assets/hero.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover object-[60%_center] md:object-center" />
      {/* readability gradients */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/80 via-bg/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-bg to-transparent" />

      <div className="container-x py-24">
        <div className="max-w-[620px]">
          <div className="label inline-flex items-center gap-2.5 rounded-[3px] border border-ink/15 bg-bg/70 px-3.5 py-2 text-[0.68rem] text-ink/90 backdrop-blur-sm">
            <span className="pulse-dot size-1.5 rounded-full bg-[#ff4d3d]" />
            Transmission live
            {incoming !== null && <> · Episode {String(incoming).padStart(2, "0")} incoming</>}
          </div>

          <h1 className="title mt-6 text-[clamp(5.5rem,15vw,11.5rem)] leading-[0.82] tracking-[-0.02em]">
            Wei
            <br />
            The Dog
          </h1>

          <p className="mt-8 max-w-[540px] text-lg leading-relaxed text-ink/90 md:text-xl">
            A colonist alone on Mars, sending ETH home to his family. A rover that turned hostile. And a dog that
            cannot die, as long as the chain lives.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#episodes"
              className="inline-flex items-center gap-2.5 rounded-[3px] bg-accent px-6 py-3.5 text-[0.95rem] font-semibold text-bg transition hover:brightness-110"
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
        </div>
      </div>
    </section>
  );
}
