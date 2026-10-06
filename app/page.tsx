import episodesData from "@/content/episodes.json";
import site from "@/content/site.json";
import { config } from "@/lib/config";
import type { Episode } from "@/lib/types";
import { Buy } from "@/components/Buy";
import { Dashboard } from "@/components/Dashboard";
import { Episodes } from "@/components/Episodes";
import { Footer } from "@/components/Footer";
import { FullFilm } from "@/components/FullFilm";
import { Hero } from "@/components/Hero";
import { Lore } from "@/components/Lore";
import { Nav } from "@/components/Nav";
import { StatsProvider } from "@/components/StatsProvider";
import { Tech } from "@/components/Tech";

const episodes = episodesData as Episode[];

export default function Home() {
  const ticker = config.tokenSymbol;
  const sorted = [...episodes].sort((a, b) => a.number - b.number);
  const nextLocked = sorted.find((e) => e.locked);

  return (
    <StatsProvider>
      <Nav ticker={ticker} buyUrl={site.links.buy} />
      <main>
        <Hero incoming={nextLocked?.number ?? null} />
        <Lore tweetUrl={site.lore_tweet} />
        <Dashboard indexUrl={site.links.index} />
        <Tech contract={config.tokenAddress} indexUrl={site.links.index} />
        <Episodes episodes={episodes} />
        <FullFilm
          poster={site.film.poster}
          videoUrl={site.film.video_url}
          playlist={sorted.filter((e) => !e.locked && e.video_url).map((e) => e.video_url)}
          runtime={site.film.runtime}
        />
        <Buy address={config.tokenAddress} ticker={ticker} links={site.links} />
      </main>
      <Footer />
    </StatsProvider>
  );
}
