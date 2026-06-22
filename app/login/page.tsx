"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setErr(data.error || "Incorrect password");
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
        <p>This tracker is private. Enter the shared password to continue.</p>
        <input
          className="cal-input"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {err && <div className="cal-err">{err}</div>}
        <div className="cal-row">
          <button className="cal-btn cal-btn-pri" type="submit" disabled={busy || !password} style={{ flex: 1 }}>
            {busy ? (
              <>
                <Loader2 size={16} className="cal-spin" /> Signing in
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
