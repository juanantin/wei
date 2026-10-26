"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { boothMessage, utcDay } from "@/lib/booth-message";

type Eth = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };
declare global {
  interface Window {
    ethereum?: Eth;
  }
}

type Signed = { address: string; signature: string; day: string };

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

const toHex = (s: string) =>
  "0x" + Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, "0")).join("");

export function Booth({ buyUrl }: { buyUrl: string }) {
  const [signed, setSigned] = useState<Signed | null>(null);
  const [hasWallet, setHasWallet] = useState(true);
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<"" | "sign" | "make">("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ image: string; left: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const [here, setHere] = useState("");

  useEffect(() => {
    setHasWallet(!!window.ethereum);
    setHere(window.location.href);
  }, []);

  const connect = async () => {
    setError("");
    if (!window.ethereum) return setHasWallet(false);
    setBusy("sign");
    try {
      const [address] = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const day = utcDay();
      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [toHex(boothMessage(address, day)), address],
      })) as string;
      setSigned({ address, signature, day });
    } catch (e) {
      setError((e as { code?: number }).code === 4001 ? "Signature cancelled." : "Couldn't connect the wallet.");
    } finally {
      setBusy("");
    }
  };

  const pick = (f?: File) => {
    if (!f) return;
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto({ file: f, url: URL.createObjectURL(f) });
    setResult(null);
    setError("");
  };

  const make = async () => {
    if (!signed || !photo) return;
    setBusy("make");
    setError("");
    try {
      const form = new FormData();
      form.append("address", signed.address);
      form.append("signature", signed.signature);
      form.append("day", signed.day);
      form.append("photo", await shrink(photo.file), "photo.jpg");
      const res = await fetch("/api/booth", { method: "POST", body: form });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Something went wrong.");
      setResult(j);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const shareText = encodeURIComponent("Reporting from Mars with Wei. 🐕🚀\n\n$WEI on Base. Hold, get ETH sent home.\n@Weithedog");

  return (
    <div className="mx-auto w-full max-w-[880px]">
      {/* Step 1: wallet */}
      <div className="rounded-[3px] border border-line bg-panel p-6 md:p-8">
        <p className="label text-[0.7rem] text-accent">Step 1 · Prove you hold $WEI</p>
        {signed ? (
          <p className="mt-3 font-mono text-[0.85rem] text-ink/85">
            Connected: {signed.address.slice(0, 6)}…{signed.address.slice(-4)}
          </p>
        ) : (
          <>
            <p className="mt-3 text-ink/80">
              Connect your wallet and sign a message. It&apos;s free: no transaction, no gas. Holders of 10,000+ $WEI get
              in.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={connect} disabled={busy === "sign"} className={btn}>
                {busy === "sign" ? "Check your wallet…" : "Connect & sign"}
              </button>
              <a href={buyUrl} target="_blank" rel="noopener noreferrer" className={ghost}>
                Buy $WEI
              </a>
            </div>
            {!hasWallet && here && (
              <p className="mt-4 text-[0.9rem] text-ink/75">
                No wallet found in this browser. On your phone, open this page inside your wallet app:{" "}
                <a className="text-accent underline" href={`https://metamask.app.link/dapp/${here.replace(/^https?:\/\//, "")}`}>
                  MetaMask
                </a>{" "}
                ·{" "}
                <a className="text-accent underline" href={`https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(here)}`}>
                  Coinbase Wallet
                </a>
              </p>
            )}
          </>
        )}
      </div>

      {/* Step 2: photo */}
      <div className={`mt-4 rounded-[3px] border border-line bg-panel p-6 md:p-8 ${signed ? "" : "pointer-events-none opacity-40"}`}>
        <p className="label text-[0.7rem] text-accent">Step 2 · Your selfie</p>
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
        <button type="button" onClick={make} disabled={!photo || !consent || busy === "make"} className={`${btn} mt-6`}>
          {busy === "make" ? "Sending to Mars… (up to 30s)" : "Make my portrait"}
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
            <button type="button" onClick={make} disabled={busy === "make" || result.left < 1} className={ghost}>
              Try again ({result.left} left today)
            </button>
          </div>
          <p className="mt-3 text-[0.85rem] text-muted">To post it, download the image first, then attach it to your post.</p>
        </div>
      )}

      {!result && (
        <div className="relative mt-6 aspect-[1340/618] w-full overflow-hidden rounded-[3px] border border-line">
          <Image src="/wei-assets/hero.jpg" alt="The astronaut and Wei on Mars" fill sizes="880px" className="object-cover" />
          <span className="label absolute bottom-3 left-3 rounded-[3px] bg-bg/70 px-3 py-1.5 text-[0.65rem] backdrop-blur-sm">
            Your face goes here
          </span>
        </div>
      )}
    </div>
  );
}
