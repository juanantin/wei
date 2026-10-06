import Image from "next/image";

type Links = { launch: string; index: string };

const logoLink = "opacity-80 transition hover:-translate-y-0.5 hover:opacity-100";

function Base({ iconClass = "size-4 sm:size-5", textClass = "text-[0.6rem] sm:text-[0.7rem]" }: { iconClass?: string; textClass?: string }) {
  return (
    <a
      href="https://base.org"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 whitespace-nowrap font-mono uppercase tracking-[0.16em] text-ink sm:gap-2 ${textClass} ${logoLink}`}
    >
      Built on
      <Image src="/brand/base.png" alt="" width={40} height={40} className={iconClass} />
      Base
    </a>
  );
}

function Stonks({ href, className = "h-3 sm:h-[18px]" }: { href: string; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="WEI on Stonks Exchange" className={logoLink}>
      <Image src="/brand/stonks-exchange-light.png" alt="Stonks Exchange" width={526} height={64} className={`w-auto ${className}`} />
    </a>
  );
}

function Stockify({ href, className = "h-5 sm:h-7" }: { href: string; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="WEI holder rewards on Stockify" className={logoLink}>
      <Image src="/brand/stockify-light.png" alt="Stockify" width={289} height={96} className={`w-auto ${className}`} />
    </a>
  );
}

/** Hero, top right: Built on Base. */
export function HeroBase() {
  return (
    <div className="anim-fade flex justify-end" style={{ "--d": "50ms" } as React.CSSProperties}>
      <Base iconClass="size-4 sm:size-5" textClass="text-[0.6rem] sm:text-[0.7rem]" />
    </div>
  );
}

/** Hero, bottom right: Stonks Exchange over Stockify, right-aligned. */
export function HeroPartners({ links }: { links: Links }) {
  return (
    <div className="anim-fade flex flex-col items-end gap-3.5" style={{ "--d": "900ms" } as React.CSSProperties}>
      <Stonks href={links.launch} className="h-3.5 sm:h-[18px]" />
      <Stockify href={links.index} className="h-6 sm:h-7" />
    </div>
  );
}

const chip =
  "inline-flex h-10 items-center gap-2 rounded-[3px] bg-ink px-3.5 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-10px_rgba(232,100,44,0.6)]";

/** Bottom of the page: chain, launchpad, rewards — boxed, in the brands' own colours. */
export function FooterPartners({ links }: { links: Links }) {
  const label = "font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ink/60";
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10 md:flex-row md:gap-10">
      <div className="flex items-center gap-3">
        <span className={label}>Built on</span>
        <a href="https://base.org" target="_blank" rel="noopener noreferrer" className={chip}>
          <Image src="/brand/base.png" alt="" width={40} height={40} className="size-5" />
          <span className="font-mono text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[#0052FF]">Base</span>
        </a>
      </div>
      <div className="flex items-center gap-3">
        <span className={label}>Launched on</span>
        <a href={links.launch} target="_blank" rel="noopener noreferrer" aria-label="WEI on Stonks Exchange" className={chip}>
          <Image src="/brand/stonks-exchange.png" alt="Stonks Exchange" width={526} height={64} className="h-[17px] w-auto" />
        </a>
      </div>
      <div className="flex items-center gap-3">
        <span className={label}>Rewards by</span>
        <a href={links.index} target="_blank" rel="noopener noreferrer" aria-label="WEI holder rewards on Stockify" className={chip}>
          <Image src="/brand/stockify.png" alt="Stockify" width={289} height={96} className="h-[26px] w-auto" />
        </a>
      </div>
    </div>
  );
}
