import { Reveal } from "./Reveal";
import { Decode } from "./Decode";
import { TweetEmbed } from "./TweetEmbed";

export function Lore({ tweetUrl }: { tweetUrl: string }) {
  return (
    <section id="lore" className="py-24 md:py-36">
      <div className="container-x grid items-center gap-14 lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-20">
        <div className="max-w-[580px]">
          <p className="label text-accent">
              <Decode text="Mission log · 12.01.2021" />
            </p>
          <Reveal>
          <h2 className="title mt-5 text-[clamp(3rem,6.5vw,5.25rem)]">
            It started
            <br />
            with one post.
          </h2>
          </Reveal>
          <Reveal delay={120} className="mt-9 space-y-6 text-lg leading-relaxed text-ink/85">
            <p>
              In January 2021, Cobie imagined himself on Mars, paying his family back on Earth with Ethereum while his
              immortal dog Wei protected him from a now-hostile Curiosity rover.
            </p>
            <p>
              We took it seriously. WEI THE DOG turns that post into a series, one transmission at a time, with every
              episode a new piece of the bigger story.
            </p>
          </Reveal>
          <p className="mt-9 font-mono text-[0.72rem] text-muted">
            Fan-made project. Not affiliated with or endorsed by Cobie.
          </p>
        </div>

        <Reveal delay={200}>
          <TweetEmbed url={tweetUrl} fallback="/wei-assets/tweet-fallback.jpg" />
        </Reveal>
      </div>
    </section>
  );
}
