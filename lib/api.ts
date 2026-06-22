// Thin client-side fetch helpers. All requests are same-origin and rely on the
// httpOnly session cookie set at login; middleware gates everything.

import type { Entry, EstimateResult, Settings, Template } from "./types";

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("unauthorized");
  }
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function sendJSON<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("unauthorized");
  }
  if (!res.ok) throw new Error(`${method} ${url} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  // entries
  getEntriesForDate: (date: string) => getJSON<Entry[]>(`/api/entries?date=${date}`),
  getEntriesInRange: (from: string, to: string) =>
    getJSON<Entry[]>(`/api/entries?from=${from}&to=${to}`),
  addEntry: (entry: Omit<Entry, "id">) => sendJSON<Entry>("/api/entries", "POST", entry),
  deleteEntry: (id: string) => sendJSON<{ ok: true }>(`/api/entries/${id}`, "DELETE"),

  // settings
  getSettings: () => getJSON<Settings>("/api/settings"),
  putSettings: (s: Settings) => sendJSON<Settings>("/api/settings", "PUT", s),

  // templates
  getTemplates: () => getJSON<Template[]>("/api/templates"),
  addTemplate: (t: Omit<Template, "id">) => sendJSON<Template>("/api/templates", "POST", t),
  deleteTemplate: (id: string) => sendJSON<{ ok: true }>(`/api/templates/${id}`, "DELETE"),

  // estimate
  estimate: (payload: { imageBase64?: string; mediaType?: string; text: string }) =>
    sendJSON<EstimateResult>("/api/estimate", "POST", payload),
};
