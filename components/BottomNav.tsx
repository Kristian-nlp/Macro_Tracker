"use client";

import Link from "next/link";

// Bottom navigation: Today · History · Settings, with a raised `+` as the
// right-most item that opens "Add a meal". Mirrors prototype/BottomNav.dc.html.
// On Today, `onAdd` opens the sheet directly; elsewhere the `+` links to
// /?add=1 so Today opens the sheet on arrival.

type Tab = "today" | "history" | "settings";

const TodayIcon = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
  </svg>
);
const HistoryIcon = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3.2 1.8" />
  </svg>
);
const SettingsIcon = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.7 6.7l1.4 1.4M15.9 15.9l1.4 1.4M17.3 6.7l-1.4 1.4M8.1 15.9l-1.4 1.4" />
  </svg>
);
const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
    <path d="M12 5.5v13M5.5 12h13" />
  </svg>
);

export function BottomNav({
  active,
  onAdd,
  labels,
}: {
  active: Tab;
  onAdd?: () => void;
  labels: { today: string; history: string; settings: string; add: string };
}) {
  return (
    <nav className="g-nav">
      <Link href="/" className={`g-nav-item ${active === "today" ? "is-active" : ""}`} aria-current={active === "today" ? "page" : undefined}>
        <span className="g-nav-ico"><TodayIcon /></span>
        <span>{labels.today}</span>
      </Link>
      <Link href="/history" className={`g-nav-item ${active === "history" ? "is-active" : ""}`} aria-current={active === "history" ? "page" : undefined}>
        <span className="g-nav-ico"><HistoryIcon /></span>
        <span>{labels.history}</span>
      </Link>
      <Link href="/settings" className={`g-nav-item ${active === "settings" ? "is-active" : ""}`} aria-current={active === "settings" ? "page" : undefined}>
        <span className="g-nav-ico"><SettingsIcon /></span>
        <span>{labels.settings}</span>
      </Link>
      <div className="g-nav-plus">
        {onAdd ? (
          <button className="g-nav-plus-btn" onClick={onAdd} aria-label={labels.add}>
            <PlusIcon />
          </button>
        ) : (
          <Link className="g-nav-plus-btn" href="/?add=1" aria-label={labels.add}>
            <PlusIcon />
          </Link>
        )}
      </div>
    </nav>
  );
}
