"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const btn =
  "label btn-sheen inline-flex items-center justify-center rounded-[3px] bg-accent px-6 py-3.5 text-[0.75rem] font-semibold text-bg transition hover:brightness-110 disabled:opacity-50";
const ghost =
  "label inline-flex items-center justify-center rounded-[3px] border border-ink/25 px-6 py-3.5 text-[0.75rem] font-semibold transition hover:border-ink/60";

// Shrinks the photo to fit 1024px and re-encodes it as JPEG, so uploads stay small.
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error("resize failed"))), "image/jpeg", 0.9));
}

export function Booth() {
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ image: string; left: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const pick = (f?: File) => {
    if (!f) return;
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto({ file: f, url: URL.createObjectURL(f) });
    setResult(null);
    setError("");
  };

  const make = async () => {
    if (!photo) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("photo", await shrink(photo.file), "photo.jpg");
      const res = await fetch("/api/booth", { method: "POST", body: form });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Something went wrong.");
      setResult(j);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const shareText = encodeURIComponent("Reporting from Mars with Wei. 🐕🚀\n\n$WEI on Base. Hold, get ETH sent home.\n@Weithedog");

  return (
    <div className="mx-auto w-full max-w-[880px]">
      {/* Photo */}
      <div className="rounded-[3px] border border-line bg-panel p-6 md:p-8">
        <p className="label text-[0.7rem] text-accent">Your selfie</p>
        <p className="mt-3 text-ink/80">A clear, front-facing photo works best. It&apos;s used once to make your image and never stored.</p>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => input.current?.click()} className={ghost}>
            {photo ? "Change photo" : "Choose photo"}
          </button>
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.url} alt="Your photo" className="size-16 rounded-full border border-ink/25 object-cover" />
          )}
        </div>
        <label className="mt-5 flex items-start gap-3 text-[0.9rem] text-ink/80">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-[#e8642c]" />
          <span>This is a photo of me, or of someone who said yes to this.</span>
        </label>
        <button type="button" onClick={make} disabled={!photo || !consent || busy} className={`${btn} mt-6`}>
          {busy ? "Sending to Mars… (up to 30s)" : "Make my portrait"}
        </button>
      </div>

      {error && <p className="mt-4 rounded-[3px] border border-accent/40 bg-accent/10 px-4 py-3 text-[0.95rem]">{error}</p>}

      {/* Result */}
      {result && (
        <div className="mt-6 rounded-[3px] border border-line bg-panel p-4 md:p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.image} alt="You and Wei on Mars" className="w-full rounded-[3px]" />
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={result.image} download="wei-mars-portrait.png" className={btn}>
              Download
            </a>
            <a href={`https://x.com/intent/tweet?text=${shareText}`} target="_blank" rel="noopener noreferrer" className={ghost}>
              Post on X
            </a>
            <button type="button" onClick={make} disabled={busy || result.left < 1} className={ghost}>
              Try again ({result.left} left today)
            </button>
          </div>
          <p className="mt-3 text-[0.85rem] text-muted">To post it, download the image first, then attach it to your post.</p>
        </div>
      )}

      {!result && (
        <div className="relative mt-6 aspect-[1050/962] w-full max-w-[560px] mx-auto overflow-hidden rounded-[3px] border border-line">
          <Image src="/wei-assets/booth-scene.jpg" alt="The astronaut walking Wei on Mars" fill sizes="560px" className="object-cover" />
          <span className="label absolute bottom-3 left-3 rounded-[3px] bg-bg/70 px-3 py-1.5 text-[0.65rem] backdrop-blur-sm">
            Your face goes here
          </span>
        </div>
      )}
    </div>
  );
}
