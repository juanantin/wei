"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    twttr?: { widgets?: { load: (el?: HTMLElement) => Promise<unknown> } };
  }
}

const SCRIPT_SRC = "https://platform.twitter.com/widgets.js";
const TIMEOUT_MS = 8000;

/** Real X embed; falls back to a static image if the widget script is blocked or never renders. */
export function TweetEmbed({ url, fallback }: { url: string; fallback: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const finish = (s: "ready" | "failed") => {
      if (done) return;
      done = true;
      setStatus(s);
    };

    const render = () => {
      window.twttr?.widgets
        ?.load(el)
        .then(() => finish(el.querySelector("iframe") ? "ready" : "failed"))
        .catch(() => finish("failed"));
    };

    if (window.twttr?.widgets) {
      render();
    } else {
      let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        document.body.appendChild(script);
      }
      script.addEventListener("load", render);
      script.addEventListener("error", () => finish("failed"));
    }

    const timer = setTimeout(() => finish(el.querySelector("iframe") ? "ready" : "failed"), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[460px] rotate-[-2deg] transition hover:rotate-0">
      {status !== "failed" && (
        <div ref={ref} className={status === "ready" ? "" : "pointer-events-none absolute inset-0 opacity-0"}>
          <blockquote className="twitter-tweet" data-theme="light" data-dnt="true" data-conversation="none">
            <a href={url.replace("x.com", "twitter.com")}>View post on X</a>
          </blockquote>
        </div>
      )}
      {status !== "ready" && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <Image
            src={fallback}
            alt="Cobie on X: Me on Mars using Ethereum to pay my family back home on Earth while my immortal dog Wei protects me from the now-hostile Mars Rover Curiosity"
            width={951}
            height={1000}
            className={`h-auto w-full rounded-2xl shadow-2xl shadow-black/50 ${status === "loading" ? "opacity-90" : ""}`}
          />
        </a>
      )}
    </div>
  );
}
