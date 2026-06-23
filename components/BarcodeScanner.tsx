"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type Props = { onDetected: (code: string) => void; onClose: () => void };

// Camera barcode scanner. Loads ZXing lazily (browser-only) so it stays out of
// the main bundle. Prefers the rear camera and restricts to common product
// formats (EAN/UPC) for speed and accuracy.
export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const [err, setErr] = useState("");

  useEffect(() => {
    let stop: (() => void) | null = null;
    let done = false;

    (async () => {
      try {
        const [{ BrowserMultiFormatReader }, { DecodeHintType, BarcodeFormat }] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
        ]);

        const reader = new BrowserMultiFormatReader(hints);
        const video = videoRef.current;
        if (!video) return;

        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          video,
          (result, _e, ctrl) => {
            if (result && !done) {
              done = true;
              ctrl.stop();
              onDetectedRef.current(result.getText());
            }
          },
        );
        stop = () => controls.stop();
        if (done) controls.stop(); // detected before assignment
      } catch {
        setErr("Couldn't start the camera. Allow camera access, or add the numbers manually.");
      }
    })();

    return () => {
      done = true;
      try {
        stop?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return (
    <div className="cal-scan-bg" onClick={onClose}>
      <div className="cal-scan" onClick={(e) => e.stopPropagation()}>
        <div className="cal-scan-head">
          <span>Scan a barcode</span>
          <button className="cal-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="cal-scan-video">
          <video ref={videoRef} playsInline muted />
          {!err && <div className="cal-scan-line" />}
        </div>
        {err ? (
          <div className="cal-err" style={{ margin: "12px 16px" }}>
            {err}
          </div>
        ) : (
          <div className="cal-scan-hint">Point the camera at the product barcode.</div>
        )}
      </div>
    </div>
  );
}
