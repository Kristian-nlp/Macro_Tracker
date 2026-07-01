"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { MacroShape } from "@/components/MacroMarker";
import { TargetWizard } from "@/components/TargetWizard";
import { useLang } from "@/components/LangProvider";
import { api } from "@/lib/api";
import type { Settings } from "@/lib/types";
import type { Plan } from "@/lib/plan";

// Sign in — username + 4-digit PIN (the app's existing auth; no email). The
// three macro shapes double as the logo. New usernames are created on first
// sign-in, so "Create an account" is the same flow.
export default function LoginPage() {
  const { t } = useLang();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [pinFocused, setPinFocused] = useState(false);
  const [step, setStep] = useState<"auth" | "targets">("auth");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [onbView, setOnbView] = useState<"choose" | "wizard" | "manual">("choose");
  const [trainingKcal, setTrainingKcal] = useState("");
  const [restKcal, setRestKcal] = useState("");
  const userRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  function enterApp() {
    router.replace("/");
    router.refresh();
  }

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setErr("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!username.trim()) return setErr(t("errEnterUser"));
    if (!/^\d{4}$/.test(pin)) return setErr(t("errPin4"));
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin, mode }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.created) {
          // New account → ask for their daily calorie targets.
          setBusy(false);
          setStep("targets");
        } else {
          enterApp();
        }
      } else {
        setErr(
          res.status === 409
            ? t("errUsernameTaken")
            : res.status === 404
              ? t("errNoAccount")
              : res.status === 401
                ? t("errWrongPin")
                : res.status === 429
                  ? t("errTooMany")
                  : t("errLoginGeneric"),
        );
        setBusy(false);
      }
    } catch {
      setErr(t("errSomething"));
      setBusy(false);
    }
  }

  async function finishTargets(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const num = (s: string) => {
      const n = Math.round(Number(s) || 0);
      return n > 0 ? n : null;
    };
    const next: Settings = {
      target: num(trainingKcal),
      trainingProtein: null,
      trainingCarbs: null,
      trainingFat: null,
      restTarget: num(restKcal),
      restProtein: null,
      restCarbs: null,
      restFat: null,
      trainingDays: [1, 3, 5, 0],
      overrides: {},
    };
    try {
      await api.putSettings(next);
    } catch {
      /* non-fatal — targets can still be set in Settings */
    }
    enterApp();
  }

  // Apply a calculated plan (training/rest kcal + macros) and enter the app.
  async function applyPlanAndEnter(plan: Plan) {
    const next: Settings = {
      target: plan.trainingKcal,
      trainingProtein: plan.trainingProtein,
      trainingCarbs: plan.trainingCarbs,
      trainingFat: plan.trainingFat,
      restTarget: plan.restKcal,
      restProtein: plan.restProtein,
      restCarbs: plan.restCarbs,
      restFat: plan.restFat,
      trainingDays: [1, 3, 5, 0],
      overrides: {},
    };
    try {
      await api.putSettings(next);
    } catch {
      /* non-fatal */
    }
    enterApp();
  }

  const overline: React.CSSProperties = {
    fontSize: 11,
    letterSpacing: ".12em",
    textTransform: "uppercase",
    color: "#8A8D7E",
    fontWeight: 600,
    marginBottom: 8,
  };
  const field: React.CSSProperties = {
    background: "#FCFAF4",
    border: "1px solid #E0DCCE",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: "#1B1D17",
    width: "100%",
  };

  // ---- first-time onboarding: ask for training / rest calorie targets ----
  if (step === "targets") {
    const kcalField = (
      value: string,
      onChange: (v: string) => void,
      label: string,
      placeholder: string,
      autoFocus = false,
    ) => (
      <div style={{ ...field, display: "flex", alignItems: "center", gap: 8, padding: "4px 14px" }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 5))}
          inputMode="numeric"
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-label={label}
          className="g-fm"
          style={{ flex: 1, minWidth: 0, border: "none", background: "none", outline: "none", fontSize: 16, color: "#1B1D17", padding: "10px 0" }}
        />
        <span style={{ color: "#9A9C8F", fontSize: 13 }}>{t("xlKcal")}</span>
      </div>
    );

    const logo = (
      <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
        <MacroShape macro="protein" size={16} />
        <MacroShape macro="carbs" size={15} />
        <MacroShape macro="fat" size={15} />
      </div>
    );

    // Calculator questionnaire
    if (onbView === "wizard") {
      return (
        <div style={{ padding: "52px 28px 48px", minHeight: "100dvh" }}>
          {logo}
          <h1 className="g-fg" style={{ fontWeight: 700, fontSize: 26, color: "#1B1D17", letterSpacing: "-.02em", margin: "16px 0 18px" }}>{t("onbTitle")}</h1>
          <TargetWizard onApply={applyPlanAndEnter} applyLabel={t("onbGetStarted")} />
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <button type="button" onClick={() => setOnbView("choose")} style={{ color: "#6B6E60", fontWeight: 600, background: "none", border: "none", padding: 8, font: "inherit", fontSize: 13.5 }}>
              ← {t("cancel")}
            </button>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={finishTargets} style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", padding: "0 32px 40px" }}>
        <div style={{ marginTop: 96 }}>
          {logo}
          <h1 className="g-fg" style={{ fontWeight: 700, fontSize: 30, color: "#1B1D17", letterSpacing: "-.02em", margin: "26px 0 0" }}>
            {t("onbTitle")}
          </h1>
          <p style={{ fontSize: 15, color: "#6B6E60", margin: "12px 0 0", lineHeight: 1.55, maxWidth: 300 }}>{t("onbSubtitle")}</p>
        </div>

        <div style={{ flex: 1 }} />

        {onbView === "manual" ? (
          <div>
            <div style={overline}>{t("trainingDayRow")}</div>
            {kcalField(trainingKcal, setTrainingKcal, t("trainingDayRow"), "2600", true)}
            <div style={{ ...overline, margin: "16px 0 8px" }}>{t("restDayRow")}</div>
            {kcalField(restKcal, setRestKcal, t("restDayRow"), "2200")}
            <button className="g-btn g-btn-pri" type="submit" disabled={busy} style={{ marginTop: 24 }}>
              {busy ? (<><Loader2 size={16} className="g-spin" /> {t("signingIn")}</>) : t("onbGetStarted")}
            </button>
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button type="button" onClick={() => setOnbView("choose")} style={{ color: "#6B6E60", fontWeight: 600, background: "none", border: "none", padding: 8, font: "inherit", fontSize: 13.5 }}>← {t("cancel")}</button>
            </div>
          </div>
        ) : (
          <div>
            <button type="button" className="g-btn g-btn-pri" onClick={() => setOnbView("wizard")}>{t("planCalcMine")}</button>
            <button type="button" className="g-btn g-btn-ghost" onClick={() => setOnbView("manual")} style={{ marginTop: 6 }}>{t("enterManually")}</button>
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <button type="button" onClick={enterApp} style={{ color: "#6B6E60", fontWeight: 600, background: "none", border: "none", padding: 8, font: "inherit", fontSize: 13.5 }}>{t("onbSkip")}</button>
            </div>
          </div>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", padding: "0 32px 40px" }}>
      <div style={{ marginTop: 96 }}>
        <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
          <MacroShape macro="protein" size={18} />
          <MacroShape macro="carbs" size={17} />
          <MacroShape macro="fat" size={17} />
        </div>
        <h1 className="g-fg" style={{ fontWeight: 700, fontSize: 42, color: "#1B1D17", letterSpacing: "-.03em", margin: "26px 0 0" }}>
          macro<span style={{ color: "#55654C" }}>.</span>
        </h1>
        <p style={{ fontSize: 15, color: "#6B6E60", margin: "12px 0 0", lineHeight: 1.55, maxWidth: 270 }}>
          {mode === "signup" ? t("signupSubtitle") : t("tagline")}
        </p>
      </div>

      <div style={{ flex: 1 }} />

      <div>
        <div style={overline}>{t("username")}</div>
        <input
          ref={userRef}
          style={field}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t("username").toLowerCase()}
        />

        <div style={{ ...overline, margin: "16px 0 8px" }}>{t("pin")}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Four cells make the 4-digit requirement unmistakable. A single
              transparent input behind them captures the keystrokes. */}
          <div
            style={{ position: "relative", flex: 1, display: "flex", gap: 8 }}
            onClick={() => pinRef.current?.focus()}
          >
            <input
              ref={pinRef}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              onFocus={() => setPinFocused(true)}
              onBlur={() => setPinFocused(false)}
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              aria-label={t("pin")}
              style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", border: "none", background: "transparent", fontSize: 16 }}
            />
            {[0, 1, 2, 3].map((i) => {
              const filled = pin.length > i;
              const active = pinFocused && i === pin.length;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 52,
                    borderRadius: 14,
                    background: "#FCFAF4",
                    border: `1px solid ${active ? "#55654C" : "#E0DCCE"}`,
                    boxShadow: active ? "0 0 0 1px #55654C" : "none",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {filled &&
                    (show ? (
                      <span className="g-fg" style={{ fontSize: 20, color: "#1B1D17" }}>{pin[i]}</span>
                    ) : (
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#1B1D17" }} />
                    ))}
                </div>
              );
            })}
          </div>
          <button type="button" className="g-eye" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide PIN" : "Show PIN"}>
            {show ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {err && <div className="g-err">{err}</div>}

        <button className="g-btn g-btn-pri" type="submit" disabled={busy} style={{ marginTop: 20 }}>
          {busy ? (
            <>
              <Loader2 size={16} className="g-spin" /> {t("signingIn")}
            </>
          ) : mode === "signup" ? (
            t("createAccountBtn")
          ) : (
            t("signIn")
          )}
        </button>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13.5, color: "#6B6E60" }}>
          {mode === "signup" ? t("haveAccount") : t("newHere")}{" "}
          <button
            type="button"
            onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
            style={{ color: "#55654C", fontWeight: 600, background: "none", border: "none", padding: 0, font: "inherit" }}
          >
            {mode === "signup" ? t("signIn") : t("createAccount")}
          </button>
        </div>
      </div>
    </form>
  );
}
