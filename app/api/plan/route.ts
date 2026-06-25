import { NextResponse } from "next/server";
import OpenAI from "openai";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { currentUser } from "@/lib/auth-server";
import { bmrMifflin, computeBaseline, isValidInput, sanePlan, tdee, type PlanInput } from "@/lib/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Suggest training- and rest-day calorie + macro targets from a short profile.
// Deterministic baseline (Mifflin–St Jeor → TDEE → goal), optionally refined by
// the LLM and validated. Always returns a usable plan, even without an API key.
export async function POST(req: Request) {
  if (!currentUser()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const limit = rateLimit(`plan:${clientIp(req)}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const body = await req.json().catch(() => null);
  const input: Partial<PlanInput> = {
    age: Math.round(Number(body?.age)),
    gender: body?.gender,
    heightCm: Math.round(Number(body?.heightCm)),
    weightKg: Math.round(Number(body?.weightKg)),
    activity: body?.activity,
    goal: body?.goal,
  };
  if (!isValidInput(input)) {
    return NextResponse.json({ error: "Please fill in age, height, weight, activity and goal." }, { status: 400 });
  }

  const baseline = computeBaseline(input);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json(baseline);

  const bmr = bmrMifflin(input);
  const maint = tdee(input);
  const prompt =
    "You are a sports-nutrition assistant. Suggest daily calorie and macro targets for a person, " +
    "with a slightly higher TRAINING day and a lower REST day (carbs carry most of the difference; " +
    "keep protein and fat similar across days). Respond with ONLY a compact JSON object, no markdown.\n" +
    `Profile: age ${input.age}, ${input.gender}, ${input.heightCm} cm, ${input.weightKg} kg, ` +
    `activity ${input.activity}, goal ${input.goal}.\n` +
    `Computed BMR ${bmr} kcal, maintenance (TDEE) ${maint} kcal.\n` +
    "Guidance: protein ~1.6-2.4 g/kg (higher for fat loss / muscle retention), fat ~0.6-1.0 g/kg, " +
    "carbs fill the rest. Deficit ~15-25% for fat loss, surplus ~8-18% for muscle/mass, ~maintenance for recomp.\n" +
    'Shape: {"trainingKcal":number,"trainingProtein":number,"trainingCarbs":number,"trainingFat":number,' +
    '"restKcal":number,"restProtein":number,"restCarbs":number,"restFat":number,' +
    '"rationale":string (one or two short sentences explaining the plan)}. All grams are integers.';

  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_completion_tokens: 600,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const obj = JSON.parse(raw.replace(/```json/gi, "").replace(/```/g, "").trim());
    const safe = sanePlan(obj, input);
    return NextResponse.json(safe ?? baseline);
  } catch (err) {
    console.error("plan failed:", err);
    return NextResponse.json(baseline); // graceful fallback to the formula
  }
}
