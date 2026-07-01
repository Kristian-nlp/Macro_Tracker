"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { MacroShape } from "@/components/MacroMarker";
import { useLang } from "@/components/LangProvider";
import { api } from "@/lib/api";
import { getPlanInputs, savePlanInputs } from "@/lib/prefs";
import type { ActivityKey, GoalKey, Gender, Plan, PlanInput } from "@/lib/plan";
import type { TKey } from "@/lib/i18n";

const ACTS: { key: ActivityKey; label: TKey; sub: TKey }[] = [
  { key: "sedentary", label: "actSedentary", sub: "actSedentarySub" },
  { key: "light", label: "actLight", sub: "actLightSub" },
  { key: "moderate", label: "actModerate", sub: "actModerateSub" },
  { key: "active", label: "actActive", sub: "actActiveSub" },
  { key: "very", label: "actVery", sub: "actVerySub" },
];
const GOALS: { key: GoalKey; label: TKey; sub: TKey }[] = [
  { key: "lose_fat", label: "goalLoseFat", sub: "goalLoseFatSub" },
  { key: "lose_keep", label: "goalLoseKeep", sub: "goalLoseKeepSub" },
  { key: "recomp", label: "goalRecomp", sub: "goalRecompSub" },
  { key: "gain_muscle", label: "goalGainMuscle", sub: "goalGainMuscleSub" },
  { key: "gain_mass", label: "goalGainMass", sub: "goalGainMassSub" },
];

const numStr = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? String(v) : "");

export function TargetWizard({ onApply, applyLabel }: { onApply: (p: Plan) => void; applyLabel?: string }) {
  const { t } = useLang();
  const saved = getPlanInputs() || {};

  const [gender, setGender] = useState<Gender>(saved.gender === "female" ? "female" : "male");
  const [age, setAge] = useState(numStr(saved.age));
  const [heightCm, setHeightCm] = useState(numStr(saved.heightCm));
  const [weightKg, setWeightKg] = useState(numStr(saved.weightKg));
  const [activity, setActivity] = useState<ActivityKey>((saved.activity as ActivityKey) || "moderate");
  const [goal, setGoal] = useState<GoalKey | null>((saved.goal as GoalKey) || null);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const ageN = Number(age);
  const hN = Number(heightCm);
  const wN = Number(weightKg);
  const ready =
    ageN >= 15 && ageN <= 80 && hN >= 80 && hN <= 260 && wN >= 30 && wN <= 300 && !!goal;

  async function calculate() {
    if (!ready || busy || !goal) return;
    setBusy(true);
    setErr("");
    const input: PlanInput = { age: ageN, gender, heightCm: hN, weightKg: wN, activity, goal };
    savePlanInputs(input);
    try {
      const p = await api.plan(input);
      setPlan(p);
    } catch {
      setErr(t("planError"));
    } finally {
      setBusy(false);
    }
  }

  // ---------- result ----------
  if (plan) {
    const DayCard = ({ title, kcal, p, c, f }: { title: string; kcal: number; p: number; c: number; f: number }) => (
      <div style={{ background: "#FCFAF4", border: "1px solid #E8E4D6", borderRadius: 18, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span className="g-fg" style={{ fontWeight: 600, fontSize: 15, color: "#1B1D17" }}>{title}</span>
          <span><span className="g-fm" style={{ fontSize: 20, color: "#1B1D17" }}>{kcal.toLocaleString()}</span> <span style={{ fontSize: 12, color: "#9A9C8F" }}>kcal</span></span>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          {([["protein", p], ["carbs", c], ["fat", f]] as const).map(([m, v]) => (
            <span key={m} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MacroShape macro={m} size={9} />
              <span className="g-fm" style={{ fontSize: 13.5, color: "#1B1D17" }}>{v}<span style={{ color: "#9A9C8F", fontSize: 11 }}>g</span></span>
            </span>
          ))}
        </div>
      </div>
    );
    return (
      <div>
        <div className="g-overline" style={{ marginBottom: 12 }}>{t("planResultTitle")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <DayCard title={t("trainingDayRow")} kcal={plan.trainingKcal} p={plan.trainingProtein} c={plan.trainingCarbs} f={plan.trainingFat} />
          <DayCard title={t("restDayRow")} kcal={plan.restKcal} p={plan.restProtein} c={plan.restCarbs} f={plan.restFat} />
        </div>
        {plan.rationale && (
          <p style={{ fontSize: 13, color: "#6B6E60", lineHeight: 1.5, margin: "14px 2px 0" }}>{plan.rationale}</p>
        )}
        <button className="g-btn g-btn-pri" onClick={() => onApply(plan)} style={{ marginTop: 20 }}>
          {applyLabel || t("planUseThese")}
        </button>
        <button className="g-btn g-btn-ghost" onClick={() => setPlan(null)} style={{ marginTop: 4 }}>
          {t("planEdit")}
        </button>
      </div>
    );
  }

  // ---------- form ----------
  const fieldStyle: React.CSSProperties = {
    background: "#FCFAF4", border: "1px solid #E0DCCE", borderRadius: 12, padding: "11px 12px",
    fontSize: 16, color: "#1B1D17", width: "100%", fontFamily: "var(--fm)",
  };
  const numField = (value: string, set: (v: string) => void, unit: string, ph: string, label: string) => (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => set(e.target.value.replace(/\D/g, "").slice(0, 3))}
        placeholder={ph}
        aria-label={label}
        style={fieldStyle}
      />
      <span style={{ position: "absolute", right: 12, color: "#9A9C8F", fontSize: 12, pointerEvents: "none" }}>{unit}</span>
    </div>
  );

  return (
    <div>
      <p style={{ fontSize: 14, color: "#6B6E60", lineHeight: 1.5, margin: "0 2px 16px" }}>{t("planIntro")}</p>

      <div className="g-overline" style={{ marginBottom: 8 }}>{t("planGender")}</div>
      <div className="g-daytype" style={{ width: "100%" }}>
        <button className={gender === "male" ? "is-on" : ""} style={{ flex: 1 }} onClick={() => setGender("male")}>{t("planMale")}</button>
        <button className={gender === "female" ? "is-on" : ""} style={{ flex: 1 }} onClick={() => setGender("female")}>{t("planFemale")}</button>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <div style={{ flex: 1 }}>
          <div className="g-overline" style={{ marginBottom: 8 }}>{t("planAge")}</div>
          {numField(age, setAge, "", "25", t("planAge"))}
        </div>
        <div style={{ flex: 1 }}>
          <div className="g-overline" style={{ marginBottom: 8 }}>{t("planHeight")}</div>
          {numField(heightCm, setHeightCm, "cm", "180", t("planHeight"))}
        </div>
        <div style={{ flex: 1 }}>
          <div className="g-overline" style={{ marginBottom: 8 }}>{t("planWeight")}</div>
          {numField(weightKg, setWeightKg, "kg", "75", t("planWeight"))}
        </div>
      </div>

      <div className="g-overline" style={{ margin: "18px 0 8px" }}>{t("planActivity")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ACTS.map((a) => (
          <button key={a.key} className={`g-opt ${activity === a.key ? "is-on" : ""}`} onClick={() => setActivity(a.key)}>
            <span>
              <span className="g-fg" style={{ fontWeight: 600, fontSize: 14, color: "#1B1D17" }}>{t(a.label)}</span>
              <span style={{ display: "block", fontSize: 12, color: "#9A9C8F", marginTop: 1 }}>{t(a.sub)}</span>
            </span>
            <span className={`g-opt-dot ${activity === a.key ? "on" : ""}`} />
          </button>
        ))}
      </div>

      <div className="g-overline" style={{ margin: "18px 0 8px" }}>{t("planGoal")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {GOALS.map((g) => (
          <button key={g.key} className={`g-opt ${goal === g.key ? "is-on" : ""}`} onClick={() => setGoal(g.key)}>
            <span>
              <span className="g-fg" style={{ fontWeight: 600, fontSize: 14, color: "#1B1D17" }}>{t(g.label)}</span>
              <span style={{ display: "block", fontSize: 12, color: "#9A9C8F", marginTop: 1 }}>{t(g.sub)}</span>
            </span>
            <span className={`g-opt-dot ${goal === g.key ? "on" : ""}`} />
          </button>
        ))}
      </div>

      {err && <div className="g-err">{err}</div>}

      <button className="g-btn g-btn-pri" onClick={calculate} disabled={!ready || busy} style={{ marginTop: 20 }}>
        {busy ? (<><Loader2 size={16} className="g-spin" /> {t("planCalculating")}</>) : t("planCalculate")}
      </button>
    </div>
  );
}
