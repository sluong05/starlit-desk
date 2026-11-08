"use client";

import { useEffect, useState } from "react";
import { Track } from "livekit-client";
import { useTrackToggle } from "@livekit/components-react";

/** Start/stop sharing your screen (with tab or system audio where the browser allows it). */
export default function ScreenShareButton({ onError }: { onError: (msg: string) => void }) {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    // Phones and some tablets can't share their screen from a browser.
    setSupported(typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia);
  }, []);

  const { toggle, enabled, pending } = useTrackToggle({
    source: Track.Source.ScreenShare,
    captureOptions: { audio: true, selfBrowserSurface: "exclude", surfaceSwitching: "include" },
    onDeviceError: (e) => {
      // Closing the browser's picker isn't an error worth showing.
      if (e?.name !== "NotAllowedError") onError("Couldn't start screen sharing.");
    },
  });

  if (!supported) return null;

  return (
    <button
      className="btn btn-ghost"
      aria-pressed={enabled}
      disabled={pending}
      onClick={() => void toggle()}
      style={enabled ? { background: "var(--lamp)", color: "var(--on-lamp)", borderColor: "var(--lamp)" } : undefined}
    >
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: "-3px", marginRight: 6 }}>
        <rect x="2" y="4" width="20" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
      {enabled ? "Stop sharing" : "Share screen"}
    </button>
  );
}
