import { Reveal } from "./Reveal";
import { Decode } from "./Decode";
const STEPS = [
  {
    n: "01",
    title: "Every trade lights the relay",
    story:
      "Out here nothing moves for free. Every time someone buys or sells $WEI, a toll is paid in ETH and beamed straight to the habitat treasury.",
    hood: "Each swap on the WEI/WETH pool on Base pays a fee in WETH, collected into the index treasury.",
  },
  {
    n: "02",
    title: "The treasury fills",
    story:
      "Stockify keeps a tenth to keep the relay powered. The colonist keeps nothing. Everything else is earmarked for home.",
    hood: "90% to holders · 10% protocol · 0% creator. On chain, the protocol has received exactly 10% of fees.",
  },
  {
    n: "03",
    title: "The transfer home",
    story:
      "When the link is clear, a payout round fires. Every family on Earth gets its share, straight to the wallet. No forms, no waiting at the dock.",
    hood: "Rounds run every 15 min at the earliest. Paid pro-rata on your WEI balance when the round runs, in WETH (wrapped ETH, 1:1) on Base. Nothing to claim, nothing to stake.",
  },
  {
    n: "04",
    title: "Keep your light on",
    story:
      "Hold at least 10,000 $WEI and you're on the manifest. Fainter signals are skipped so gas doesn't eat the transfer, and their slice goes to everyone above the line.",
    hood: "Wallets under 10,000 WEI are skipped; their share stays with the rest of the holders.",
  },
];

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function Tech({ contract, indexUrl }: { contract: string; indexUrl: string }) {
  const treasury = indexUrl.split("/").pop() ?? "";
  const link = "underline decoration-ink/30 underline-offset-2 transition hover:text-accent";

  return (
    <section id="tech" className="border-b border-line py-24 md:py-32">
      <div className="container-x">
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,520px)] lg:items-end">
          <div>
            <p className="label text-accent">
              <Decode text="Life support" />
            </p>
            <Reveal>
              <h2 className="title mt-5 text-[clamp(3rem,6.5vw,5.25rem)]">The tech</h2>
            </Reveal>
          </div>
          <Reveal delay={120}>
          <p className="text-lg leading-relaxed text-ink/85">
            Wei&apos;s colonist sends ETH home to his family. Hold $WEI and you&apos;re the family. Here&apos;s how the
            money makes it across 225 million kilometres.
          </p>
          </Reveal>
        </div>

        {/* Mars → Earth beam */}
        <Reveal delay={100} className="mt-12 flex items-center gap-4 font-mono text-[0.66rem] uppercase tracking-[0.18em]">
          <span className="text-accent">Mars</span>
          <div className="relative h-px flex-1 bg-gradient-to-r from-accent/60 via-ink/15 to-glow/60">
            <span className="beam-pulse" />
            <span className="beam-pulse" style={{ "--d": "1600ms" } as React.CSSProperties} />
          </div>
          <span className="text-glow">Earth</span>
        </Reveal>

        <ol className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 110} className="card-glow flex flex-col rounded-[4px] border border-line bg-card p-6">
              <span className="font-mono text-[0.75rem] text-accent">{s.n}</span>
              <h3 className="title mt-4 text-[1.9rem] leading-[0.95]">{s.title}</h3>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-ink/85">{s.story}</p>
              <p className="mt-auto border-t border-line pt-4 font-mono text-[0.7rem] leading-relaxed text-muted">
                <span className="text-glow">Under the hood · </span>
                {s.hood}
              </p>
            </Reveal>
          ))}
        </ol>

        <p className="mt-8 font-mono text-[0.72rem] leading-relaxed text-muted">
          Nothing here is off-chain. Check every transfer yourself: treasury{" "}
          <a href={`https://basescan.org/address/${treasury}`} target="_blank" rel="noopener noreferrer" className={link}>
            {short(treasury)}
          </a>{" "}
          · coin{" "}
          <a href={`https://basescan.org/token/${contract}`} target="_blank" rel="noopener noreferrer" className={link}>
            {short(contract)}
          </a>{" "}
          ·{" "}
          <a href={indexUrl} target="_blank" rel="noopener noreferrer" className={link}>
            Stockify index
          </a>
          . Rewards depend on trading volume and are never guaranteed.
        </p>
      </div>
    </section>
  );
}
