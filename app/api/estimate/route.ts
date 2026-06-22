import { NextResponse } from "next/server";
import OpenAI from "openai";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { EstimateResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cheap, vision-capable default. Override with OPENAI_MODEL if you want another
// (e.g. a newer or larger model). Must support image input + JSON output.
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const ALLOWED_MEDIA = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const clampInt = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));

export async function POST(req: Request) {
  // Rate limit per IP. The app is open (no sign-in), so this is the main guard
  // stopping a stray URL from running up an OpenAI bill.
  const limit = rateLimit(`estimate:${clientIp(req)}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server not configured (OPENAI_API_KEY)" }, { status: 500 });
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

  // Reuse the artifact's prompt. (Mentions "JSON", which json_object mode requires.)
  const prompt =
    "You estimate calories and macronutrients of food from a short description and/or a photo. " +
    "Respond with ONLY a compact JSON object, no markdown, no backticks, no commentary. " +
    'Shape: {"label": string (short meal name, max 6 words), "kcal": number, "protein_g": number, ' +
    '"carbs_g": number, "fat_g": number, "items": [{"name": string, "kcal": number}], ' +
    '"assumptions": string (one short sentence on portion assumptions)}. ' +
    "All macros in grams, integers. If portion size is unclear, assume one typical serving and say so. " +
    `Description: ${text && text.trim() ? text.trim() : "(none, use the photo)"}`;

  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [{ type: "text", text: prompt }];
  if (imageBase64) {
    content.push({
      type: "image_url",
      image_url: { url: `data:${mediaType};base64,${imageBase64}` },
    });
  }

  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_completion_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content }],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
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
