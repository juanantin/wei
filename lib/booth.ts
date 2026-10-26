import "server-only";
// Mars Booth: anyone can put their face on the astronaut next to Wei.
// Limits keep the Gemini bill in check: DAILY_LIMIT per visitor (by IP) and GLOBAL_LIMIT for the whole site, per UTC day.
export const DAILY_LIMIT = Number(process.env.BOOTH_DAILY_LIMIT) || 3;
export const GLOBAL_LIMIT = Number(process.env.BOOTH_GLOBAL_DAILY_LIMIT) || 300;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);

// ---------- Daily limits ----------
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

const visitorKey = (id: string) => `booth:${utcDay()}:${id}`;
const globalKey = () => `booth:${utcDay()}:all`;

async function get(key: string) {
  if (upstash) return Number(await redis(["GET", key])) || 0;
  return memory.get(key) || 0;
}

async function incr(key: string) {
  if (upstash) {
    await redis(["INCR", key]);
    await redis(["EXPIRE", key, 172800]);
  } else memory.set(key, (memory.get(key) || 0) + 1);
}

export async function checkLimits(visitor: string) {
  if ((await get(globalKey())) >= GLOBAL_LIMIT) {
    throw new BoothError("The Mars Booth is fully booked today. Come back tomorrow.", 429);
  }
  if ((await get(visitorKey(visitor))) >= DAILY_LIMIT) {
    throw new BoothError(`You've made ${DAILY_LIMIT} portraits today. Come back tomorrow.`, 429);
  }
}

export async function countUse(visitor: string) {
  await incr(visitorKey(visitor));
  await incr(globalKey());
  return Math.max(0, DAILY_LIMIT - (await get(visitorKey(visitor))));
}

// ---------- Image generation ----------
export const PROMPT_VERSION = "walk-1";
const PROMPT = `Edit the first image (a cinematic still from the animated series "WEI THE DOG": an astronaut on Mars walking Wei, the pale cream dog, on a leash).
Put the subject from the second image (a person, or a character) inside the astronaut's helmet:
- Use ONLY their head and face from the second image. Ignore and discard everything else in that photo: its background, scenery, clothes and frame.
- Replace the dark visor with clear glass so their face is visible. Their head is life-size for this suit and fills the helmet opening, chin at the neck ring. Never small, floating or shrunken.
- No tint and no reflection over the face. Head and neck sit naturally in the suit, facing the camera, lit by the same warm Mars light as the scene.
- Keep their facial features, expression, skin or fur tone and hair recognisable.
Keep everything else exactly as it is: the astronaut's suit, pose and boots, the leash, Wei (his whole body, collar and pose), the Mars landscape, the light, the framing and the film look.
Photorealistic, cinematic. No text, no watermark.`;

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
