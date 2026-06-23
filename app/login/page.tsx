"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { MacroShape } from "@/components/MacroMarker";
import { useLang } from "@/components/LangProvider";

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
  const userRef = useRef<HTMLInputElement>(null);

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
        body: JSON.stringify({ username, pin }),
      });
      if (res.ok) {
        router.replace("/");
        router.refresh();
      } else {
        setErr(
          res.status === 401
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
    fontSize: 15,
    color: "#1B1D17",
    width: "100%",
  };

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
        <p style={{ fontSize: 15, color: "#6B6E60", margin: "12px 0 0", lineHeight: 1.55, maxWidth: 270 }}>{t("tagline")}</p>
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
          placeholder="kristian"
        />

        <div style={{ ...overline, margin: "16px 0 8px" }}>{t("pinOverline")}</div>
        <div style={{ ...field, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "4px 8px 4px 14px" }}>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            type={show ? "text" : "password"}
            placeholder="••••"
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              background: "none",
              outline: "none",
              fontSize: 15,
              color: "#1B1D17",
              letterSpacing: show ? "normal" : ".3em",
              padding: "10px 0",
            }}
          />
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
          ) : (
            t("signIn")
          )}
        </button>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13.5, color: "#6B6E60" }}>
          {t("newHere")}{" "}
          <button
            type="button"
            onClick={() => userRef.current?.focus()}
            style={{ color: "#55654C", fontWeight: 600, background: "none", border: "none", padding: 0, font: "inherit" }}
          >
            {t("createAccount")}
          </button>
        </div>
      </div>
    </form>
  );
}
