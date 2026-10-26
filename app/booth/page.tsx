import type { Metadata } from "next";
import site from "@/content/site.json";
import { config } from "@/lib/config";
import { Booth } from "@/components/Booth";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Mars Booth · WEI THE DOG",
  description: "Holders of $WEI can put their face on the astronaut, next to Wei on Mars.",
};

export default function BoothPage() {
  return (
    <>
      <Nav ticker={config.tokenSymbol} buyUrl={site.links.buy} xUrl={site.links.x} chartUrl={site.links.chart} tgUrl={site.links.telegram} />
      <main className="container-x py-16 md:py-24">
        <div className="mb-10 text-center">
          <p className="label text-[0.7rem] text-accent">Holders only</p>
          <h1 className="title mt-3 text-[clamp(3rem,8vw,5.5rem)]">Mars Booth</h1>
          <p className="mx-auto mt-4 max-w-[560px] text-lg text-ink/85">
            Put your face in the helmet. You, Wei, and a Mars dust storm, in one frame.
          </p>
        </div>
        <Booth buyUrl={site.links.buy} />
      </main>
      <Footer links={site.links} />
    </>
  );
}
