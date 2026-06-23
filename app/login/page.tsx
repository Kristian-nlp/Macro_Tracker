"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!username.trim()) {
      setErr("Enter a username.");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setErr("PIN must be 4 digits.");
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
        const data = await res.json().catch(() => ({}));
        setErr(data.error || "Could not sign in.");
        setBusy(false);
      }
    } catch {
      setErr("Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="cal-login">
      <div className="cal-brand" style={{ fontSize: 17 }}>
        <span className="cal-mark" />
        <span>Daily intake</span>
      </div>
      <form className="cal-card" onSubmit={submit}>
        <h1>Sign in</h1>
        <p>Enter your username and 4-digit PIN. A new username will be created.</p>
        <input
          className="cal-input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          style={{ marginBottom: 9 }}
        />
        <input
          className="cal-input"
          placeholder="4-digit PIN"
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
                <Loader2 size={16} className="cal-spin" /> Signing in
              </>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
