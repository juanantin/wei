import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { BoothError, checkLimits, countUse, DAILY_LIMIT, generatePortrait, GLOBAL_LIMIT, PROMPT_VERSION } from "@/lib/booth";

export const runtime = "nodejs";
export const maxDuration = 60;

// Read from the deployment's own files (bundled via outputFileTracingIncludes), not over HTTP,
// so a cached copy can never be used.
const SCENE = path.join(process.cwd(), "public/wei-assets/booth-scene.jpg");
const readScene = () => readFile(SCENE);

const MAX_PHOTO = 3 * 1024 * 1024; // the page resizes photos to ~1024px JPEG before upload

// The visitor's IP, as set by Vercel's edge. Used only as a key for the daily limit.
function visitorId(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

// POST multipart: photo. Photos are processed in memory and never stored.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const photo = form.get("photo");
    if (!(photo instanceof Blob) || !photo.size) throw new BoothError("Add a photo first.", 400);
    if (photo.size > MAX_PHOTO) throw new BoothError("That photo is too large.", 413);
    if (!/^image\/(jpeg|png|webp)$/.test(photo.type)) throw new BoothError("Use a JPG, PNG or WebP photo.", 415);

    const visitor = visitorId(req);
    await checkLimits(visitor);

    const scene = { data: (await readScene()).toString("base64"), mime: "image/jpeg" };
    const face = { data: Buffer.from(await photo.arrayBuffer()).toString("base64"), mime: photo.type };

    const out = await generatePortrait(scene, face);
    const left = await countUse(visitor);
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
    globalDailyLimit: GLOBAL_LIMIT,
    sharedLimit: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    similarNames: Object.keys(process.env).filter((k) => /gemini|google|genai/i.test(k)),
    vercelEnv: process.env.VERCEL_ENV || "local",
    scene: await readScene().then((b) => createHash("sha1").update(b).digest("hex").slice(0, 8)).catch(() => "missing"),
    prompt: PROMPT_VERSION,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
  });
}
