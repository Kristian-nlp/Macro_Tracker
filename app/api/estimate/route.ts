import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { isAuthed } from "@/lib/auth-server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { EstimateResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The spec pins this model. Confirmed against the Anthropic docs/skill: it is a
// current vision-capable model and the base64 image-block shape below matches
// the documented request format. (Explicit user choice over the default Opus.)
const MODEL = "claude-sonnet-4-6";

const ALLOWED_MEDIA = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const clampInt = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));

export async function POST(req: Request) {
  // 1) Auth (defense in depth — middleware already gates this route).
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2) Rate limit per IP so a leaked URL cannot run up a large bill.
  const limit = rateLimit(`estimate:${clientIp(req)}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server not configured (ANTHROPIC_API_KEY)" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const text: string = typeof body?.text === "string" ? body.text : "";
  const imageBase64: string | undefined =
    typeof body?.imageBase64 === "string" ? body.imageBase64 : undefined;
  const mediaType: string =
    typeof body?.mediaType === "string" && ALLOWED_MEDIA.has(body.mediaType)
      ? body.mediaType
      : "image/jpeg";

  if (!text.trim() && !imageBase64) {
    return NextResponse.json({ error: "Provide a description or a photo." }, { status: 400 });
  }

  // 3) Reuse the artifact's prompt, moved server-side.
  const prompt =
    "You estimate calories and macronutrients of food from a short description and/or a photo. " +
    "Respond with ONLY a compact JSON object, no markdown, no backticks, no commentary. " +
    'Shape: {"label": string (short meal name, max 6 words), "kcal": number, "protein_g": number, ' +
    '"carbs_g": number, "fat_g": number, "items": [{"name": string, "kcal": number}], ' +
    '"assumptions": string (one short sentence on portion assumptions)}. ' +
    "All macros in grams, integers. If portion size is unclear, assume one typical serving and say so. " +
    `Description: ${text && text.trim() ? text.trim() : "(none, use the photo)"}`;

  const content: Array<Anthropic.ImageBlockParam | Anthropic.TextBlockParam> = [];
  if (imageBase64) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: mediaType as "image/jpeg", data: imageBase64 },
    });
  }
  content.push({ type: "text", text: prompt });

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content }],
    });

    const raw = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const obj = JSON.parse(clean);

    const result: EstimateResult = {
      label: String(obj.label || "Meal"),
      kcal: clampInt(obj.kcal),
      protein: clampInt(obj.protein_g),
      carbs: clampInt(obj.carbs_g),
      fat: clampInt(obj.fat_g),
      note: String(obj.assumptions || ""),
    };
    return NextResponse.json(result);
  } catch (err) {
    // Clear failure so the client can fall back to manual entry.
    console.error("estimate failed:", err);
    return NextResponse.json({ error: "Could not estimate that one." }, { status: 502 });
  }
}
