import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Look up a scanned barcode in Open Food Facts (free, no API key). Returns
// normalized per-100g macros plus the product name and serving size (if known).
export async function GET(_req: Request, { params }: { params: { barcode: string } }) {
  if (!currentUser()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const code = (params.barcode || "").replace(/[^0-9]/g, "");
  if (!code) return NextResponse.json({ found: false }, { status: 400 });

  try {
    const url =
      `https://world.openfoodfacts.org/api/v2/product/${code}.json` +
      `?fields=product_name,brands,nutriments,serving_quantity`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MacroTracker/1.0 (personal calorie tracker)" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ found: false });

    const data = await res.json();
    if (!data || data.status !== 1 || !data.product) {
      return NextResponse.json({ found: false });
    }

    const p = data.product;
    const n = p.nutriments || {};

    // kcal per 100g — prefer the kcal field, else convert kJ (energy_100g).
    const energyKj = num(n["energy_100g"]);
    const kcal100 =
      num(n["energy-kcal_100g"]) ?? (energyKj != null ? Math.round(energyKj / 4.184) : null);

    const per100g = {
      kcal: Math.max(0, Math.round(kcal100 ?? 0)),
      protein: Math.max(0, Math.round(num(n["proteins_100g"]) ?? 0)),
      carbs: Math.max(0, Math.round(num(n["carbohydrates_100g"]) ?? 0)),
      fat: Math.max(0, Math.round(num(n["fat_100g"]) ?? 0)),
    };

    const name =
      [p.product_name, p.brands].filter(Boolean).join(" · ").slice(0, 80) || "Scanned product";
    const serving = num(p.serving_quantity);

    return NextResponse.json({
      found: true,
      name,
      per100g,
      servingGrams: serving && serving > 0 ? Math.round(serving) : null,
    });
  } catch {
    return NextResponse.json({ found: false }, { status: 502 });
  }
}
