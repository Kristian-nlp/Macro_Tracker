"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Macro({
  label,
  val,
  target,
  unit = "g",
}: {
  label: string;
  val: number;
  target?: number | null;
  unit?: string;
}) {
  return (
    <div className="cal-macro">
      <div className="cal-macro-v">{val}</div>
      <div className="cal-macro-g">{target != null ? `/ ${target} ${unit}` : unit}</div>
      <div className="cal-macro-l">{label}</div>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  accent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  accent?: boolean;
}) {
  return (
    <label className={`cal-field ${accent ? "acc" : ""}`}>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
      />
      <span>{label}</span>
    </label>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="cal-modal-bg" onClick={onClose}>
      <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cal-modal-head">
          <span>{title}</span>
          <button className="cal-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="cal-modal-body">{children}</div>
      </div>
    </div>
  );
}
