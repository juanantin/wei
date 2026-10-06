import { FooterPartners } from "./Partners";

export function Footer({ links }: { links: { launch: string; index: string } }) {
  return (
    <footer className="border-t border-line">
      <div className="container-x border-b border-line">
        <FooterPartners links={links} />
      </div>
      <div className="py-8">
      <div className="container-x flex flex-col gap-2 font-mono text-[0.7rem] text-muted sm:flex-row sm:justify-between">
        <p>WEI THE DOG · a DOZO Studios production</p>
        <p>Fan-made, not affiliated with Cobie. Not financial advice.</p>
      </div>
      </div>
    </footer>
  );
}
