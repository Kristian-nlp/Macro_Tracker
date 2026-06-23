"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLang } from "@/components/LangProvider";

export default function LoginPage() {
  const { t } = useLang();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!username.trim()) {
      setErr(t("errEnterUser"));
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setErr(t("errPin4"));
      return;
    }
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
        // Translate by status so the message matches the chosen language.
        const msg =
          res.status === 401
            ? t("errWrongPin")
            : res.status === 429
              ? t("errTooMany")
              : t("errLoginGeneric");
        setErr(msg);
        setBusy(false);
      }
    } catch {
      setErr(t("errSomething"));
      setBusy(false);
    }
  }

  return (
    <div className="cal-login">
      <div className="cal-brand" style={{ fontSize: 17 }}>
        <span className="cal-mark" />
        <span>{t("brand")}</span>
      </div>
      <form className="cal-card" onSubmit={submit}>
        <h1>{t("signIn")}</h1>
        <p>{t("loginHint")}</p>
        <input
          className="cal-input"
          placeholder={t("username")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          style={{ marginBottom: 9 }}
        />
        <input
          className="cal-input"
          placeholder={t("pin")}
          value={pin}
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        {err && <div className="cal-err">{err}</div>}
        <div className="cal-row">
          <button className="cal-btn cal-btn-pri" type="submit" disabled={busy} style={{ flex: 1 }}>
            {busy ? (
              <>
                <Loader2 size={16} className="cal-spin" /> {t("signingIn")}
              </>
            ) : (
              t("continue")
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
