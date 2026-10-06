"use client";

import { useEffect, useRef } from "react";

/** Looping, muted background video. Shows only the poster frame under reduced motion. */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      v.removeAttribute("autoplay");
      return;
    }
    // Some mobile browsers ignore the autoplay attribute until play() is called.
    v.play().catch(() => {});
  }, []);

  return (
    <video
      ref={ref}
      className="absolute inset-0 size-full object-cover object-[72%_center] md:object-center"
      src="/wei-assets/hero.mp4"
      poster="/wei-assets/hero-poster.jpg"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden
      tabIndex={-1}
      disablePictureInPicture
    />
  );
}
