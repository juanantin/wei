import "server-only";
import { createPublicClient, erc20Abi, fallback, getAddress, http, parseUnits, type Address, type Hex } from "viem";
import { base } from "viem/chains";
import { boothMessage, utcDay } from "@/lib/booth-message";
import { config } from "@/lib/config";

// Mars Booth: holders of MIN_HOLDING $WEI can put their face on the astronaut.
export const MIN_HOLDING = 10_000;
export const DAILY_LIMIT = Number(process.env.BOOTH_DAILY_LIMIT) || 3;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

const client = createPublicClient({
  chain: base,
  transport: fallback([
    ...(process.env.RPC_URL ? [http(process.env.RPC_URL)] : []),
    http("https://mainnet.base.org"),
    http("https://base-rpc.publicnode.com"),
  ]),
});


export async function verifyHolder(address: string, signature: string, day: string) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new BoothError("Invalid wallet address.", 400);
  // Accept today or yesterday (UTC) so a signature made just before midnight still works.
  const yesterday = utcDay(new Date(Date.now() - 864e5));
  if (day !== utcDay() && day !== yesterday) throw new BoothError("Signature expired. Sign again.", 401);
  const addr = getAddress(address) as Address;
  // verifyMessage also covers smart wallets (ERC-1271 / ERC-6492), e.g. Coinbase Smart Wallet.
  const ok = await client
    .verifyMessage({ address: addr, message: boothMessage(addr, day), signature: signature as Hex })
    .catch(() => false);
  if (!ok) throw new BoothError("Signature check failed. Sign again.", 401);
  const balance = await client.readContract({
    address: config.tokenAddress as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [addr],
  });
  if (balance < parseUnits(String(MIN_HOLDING), 18)) {
    throw new BoothError(`The Mars Booth is for holders of ${MIN_HOLDING.toLocaleString("en-US")}+ $WEI.`, 403);
  }
  return addr;
}

// ---------- Daily limit per wallet ----------
// Uses Upstash Redis when its env vars are set (shared across all serverless instances).
// Without it, falls back to per-instance memory, which is best-effort only.
const memory = new Map<string, number>();
const upstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? { url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN }
  : null;

async function redis(cmd: (string | number)[]) {
  const res = await fetch(upstash!.url, {
    method: "POST",
    headers: { authorization: `Bearer ${upstash!.token}` },
    body: JSON.stringify(cmd),
  });
  const j = await res.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

export async function usedToday(addr: string) {
  const key = `booth:${utcDay()}:${addr.toLowerCase()}`;
  if (upstash) return Number(await redis(["GET", key])) || 0;
  return memory.get(key) || 0;
}

export async function countUse(addr: string) {
  const key = `booth:${utcDay()}:${addr.toLowerCase()}`;
  if (upstash) {
    await redis(["INCR", key]);
    await redis(["EXPIRE", key, 172800]);
  } else memory.set(key, (memory.get(key) || 0) + 1);
}

// ---------- Image generation ----------
const PROMPT = `Edit the first image (a cinematic still from the animated series "WEI THE DOG").
The bottom third of the first image is a flat brown placeholder. Replace it by continuing the scene downward as one seamless photo:
- Wei, the pale cream dog with the red collar, standing on the Mars ground with his FULL body visible: chest, all four legs and paws resting on the red dirt, nothing cropped.
- The astronaut's spacesuit continuing down to the knees, kneeling or standing beside Wei.
- Red Mars ground with small rocks and soft shadows, matching the existing light.
Put the subject from the second image (a person, or a character) INSIDE the helmet as the astronaut:
- Their head is life-size for this suit: it fills most of the helmet opening, as a real person wearing this helmet would. Chin just above the neck ring, top of the head near the top of the helmet. Never small, floating or shrunken.
- Remove the gold visor completely (raised fully out of view) so the face is seen through clear glass, with only a faint, subtle reflection. No orange or gold tint and no landscape reflection over the face.
- Head, neck and shoulders sit naturally in the suit, facing the camera, lit by the same warm Mars light from the scene.
- Keep their facial features, expression, skin or fur tone and hair recognisable.
Apart from the helmet, keep the top part as it is: the cream spacesuit, Wei's head and collar, the Mars dust storm, the warm orange light and the film look.
Keep the 3:2 frame. Match the face's lighting to the scene. Photorealistic, cinematic. No text, no watermark, no visible seam.`;

export async function generatePortrait(scene: { data: string; mime: string }, face: { data: string; mime: string }) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new BoothError("The Mars Booth isn't switched on yet.", 503);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: scene.mime, data: scene.data } },
          { inline_data: { mime_type: face.mime, data: face.data } },
        ],
      }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("gemini error", res.status, JSON.stringify(j).slice(0, 500));
    const g = (j as { error?: { status?: string; message?: string } }).error || {};
    const detail = `[${res.status} ${g.status || ""}] ${(g.message || "").slice(0, 200)}`.trim();
    if (res.status === 429) {
      throw new BoothError(`Image quota reached. If this keeps happening, billing isn't enabled on the Gemini key. ${detail}`, 503);
    }
    if (res.status === 404) throw new BoothError(`Image model not available for this key. ${detail}`, 503);
    if (res.status >= 500) throw new BoothError(`The image service is busy. Try again in a minute. ${detail}`, 502);
    throw new BoothError(`The image service refused the request. ${detail}`, 502);
  }
  const parts = j.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p: { inlineData?: { data: string } }) => p.inlineData?.data)?.inlineData;
  if (!img) {
    console.error("gemini no image", JSON.stringify(j).slice(0, 500));
    throw new BoothError("Couldn't make an image from that photo. Try a clear, front-facing selfie.", 422);
  }
  return { data: img.data as string, mime: (img.mimeType as string) || "image/png" };
}

export class BoothError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}
