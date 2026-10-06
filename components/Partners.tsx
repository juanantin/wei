import Image from "next/image";

type Links = { launch: string; index: string };

const chip =
  "inline-flex h-9 items-center rounded-[3px] bg-ink px-3 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-10px_rgba(232,100,44,0.6)]";

/** Hero, top left: Built on Base · Stonks Exchange · Stockify. */
export function HeroBadges({ links }: { links: Links }) {
  return (
    <div className="anim-fade flex flex-wrap items-center gap-2" style={{ "--d": "50ms" } as React.CSSProperties}>
      <a
        href="https://base.org"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 items-center gap-2 rounded-[3px] border border-ink/15 bg-bg/70 px-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink/90 backdrop-blur-sm transition hover:border-ink/40"
      >
        <Image src="/brand/base.png" alt="" width={18} height={18} className="size-[18px]" />
        Built on Base
      </a>
      <a href={links.launch} target="_blank" rel="noopener noreferrer" aria-label="WEI on Stonks Exchange" className={chip}>
        <Image src="/brand/stonks-exchange.png" alt="Stonks Exchange" width={526} height={64} className="h-[17px] w-auto" />
      </a>
      <a href={links.index} target="_blank" rel="noopener noreferrer" aria-label="WEI holder rewards on Stockify" className={chip}>
        <Image src="/brand/stockify.png" alt="Stockify" width={289} height={96} className="h-[25px] w-auto" />
      </a>
    </div>
  );
}

/** Bottom of the page: who launched it and who pays holders. */
export function FooterPartners({ links }: { links: Links }) {
  const row = "flex flex-wrap items-center justify-center gap-3 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-ink/75";
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10 sm:flex-row sm:gap-12">
      <a href={links.launch} target="_blank" rel="noopener noreferrer" className={`${row} group`}>
        Launched on
        <span className={chip}>
          <Image src="/brand/stonks-exchange.png" alt="Stonks Exchange" width={526} height={64} className="h-[17px] w-auto" />
        </span>
      </a>
      <a href={links.index} target="_blank" rel="noopener noreferrer" className={`${row} group`}>
        Holders&apos; rewards powered by
        <span className={chip}>
          <Image src="/brand/stockify.png" alt="Stockify" width={289} height={96} className="h-[25px] w-auto" />
        </span>
      </a>
    </div>
  );
}
