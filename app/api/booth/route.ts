import { NextRequest, NextResponse } from "next/server";
import { BoothError, countUse, DAILY_LIMIT, generatePortrait, usedToday, verifyHolder } from "@/lib/booth";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PHOTO = 3 * 1024 * 1024; // the page resizes photos to ~1024px JPEG before upload

// POST multipart: address, signature, day, photo. Photos are processed in memory and never stored.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const address = String(form.get("address") || "");
    const signature = String(form.get("signature") || "");
    const day = String(form.get("day") || "");
    const photo = form.get("photo");
    if (!(photo instanceof Blob) || !photo.size) throw new BoothError("Add a photo first.", 400);
    if (photo.size > MAX_PHOTO) throw new BoothError("That photo is too large.", 413);
    if (!/^image\/(jpeg|png|webp)$/.test(photo.type)) throw new BoothError("Use a JPG, PNG or WebP photo.", 415);

    const addr = await verifyHolder(address, signature, day);
    if ((await usedToday(addr)) >= DAILY_LIMIT) {
      throw new BoothError(`You've made ${DAILY_LIMIT} portraits today. Come back tomorrow.`, 429);
    }

    const sceneRes = await fetch(new URL("/wei-assets/hero.jpg", req.nextUrl.origin));
    if (!sceneRes.ok) throw new BoothError("Scene image missing.", 500);
    const scene = { data: Buffer.from(await sceneRes.arrayBuffer()).toString("base64"), mime: "image/jpeg" };
    const face = { data: Buffer.from(await photo.arrayBuffer()).toString("base64"), mime: photo.type };

    const out = await generatePortrait(scene, face);
    await countUse(addr);
    const left = Math.max(0, DAILY_LIMIT - (await usedToday(addr)));
    return NextResponse.json({ image: `data:${out.mime};base64,${out.data}`, left });
  } catch (e) {
    if (e instanceof BoothError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("booth error", e);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}

// GET /api/booth: which settings this deployment can see (never the values).
export async function GET() {
  return NextResponse.json({
    geminiKey: !!process.env.GEMINI_API_KEY?.trim(),
    model: process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image (default)",
    dailyLimit: DAILY_LIMIT,
    sharedLimit: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    similarNames: Object.keys(process.env).filter((k) => /gemini|google|genai/i.test(k)),
    vercelEnv: process.env.VERCEL_ENV || "local",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
  });
}
