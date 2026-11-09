"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Track } from "livekit-client";
import { useRoomContext, useTrackToggle } from "@livekit/components-react";
import { CamIcon, CamOffIcon, DiceIcon, GearIcon, HandIcon, LeaveIcon, LockIcon, MicIcon, MicOffIcon, ScreenIcon, SmileIcon } from "@/components/icons";
import { captureOptions, getPrefs } from "@/lib/prefs";

export const REACTIONS = ["👍", "👏", "😂", "❤️", "🎉", "😮", "🔥", "💯"];

function BarButton({
  icon,
  label,
  onClick,
  pressed,
  tone,
  disabled,
  title,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  pressed?: boolean;
  tone?: "off" | "on" | "leave";
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button type="button" className={`bar-btn ${tone ? `bar-${tone}` : ""}`} aria-pressed={pressed} disabled={disabled} onClick={onClick} title={title}>
      <span className="bar-icon">{icon}</span>
      <span className="bar-label">{label}</span>
    </button>
  );
}

/** The call controls along the bottom, like the bar in Zoom or Meet. */
export default function ControlBar({
  onError,
  onReact,
  handUp,
  onHand,
  gamesOpen,
  gamesLabel,
  gamesLocked,
  onGames,
  onSettings,
}: {
  onError: (msg: string) => void;
  onReact: (emoji: string) => void;
  handUp: boolean;
  onHand: () => void;
  gamesOpen: boolean;
  gamesLabel: string;
  gamesLocked: boolean;
  onGames: () => void;
  onSettings: () => void;
}) {
  const mic = useTrackToggle({
    source: Track.Source.Microphone,
    captureOptions: captureOptions(getPrefs()).audio,
    onDeviceError: () => onError("Can't reach your microphone. Check your browser's permissions."),
  });
  const cam = useTrackToggle({
    source: Track.Source.Camera,
    captureOptions: captureOptions(getPrefs()).video,
    onDeviceError: () => onError("Can't reach your camera. Check your browser's permissions."),
  });
  const share = useTrackToggle({
    source: Track.Source.ScreenShare,
    captureOptions: { audio: true, selfBrowserSurface: "exclude", surfaceSwitching: "include" },
    onDeviceError: (e) => {
      // Closing the browser's picker isn't worth an error message.
      if (e?.name !== "NotAllowedError") onError("Couldn't start screen sharing.");
    },
  });
  const room = useRoomContext();

  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(!!navigator.mediaDevices?.getDisplayMedia), []);

  // Ctrl/⌘+D mutes, Ctrl/⌘+E toggles the camera (same as Google Meet).
  const toggles = useRef({ mic: mic.toggle, cam: cam.toggle });
  toggles.current = { mic: mic.toggle, cam: cam.toggle };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "d") {
        e.preventDefault();
        void toggles.current.mic();
      } else if (k === "e") {
        e.preventDefault();
        void toggles.current.cam();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const [picker, setPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!picker) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !pickerRef.current?.contains(e.target as Node)) setPicker(false);
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", close);
    };
  }, [picker]);

  return (
    <footer className="glass control-bar" aria-label="Call controls">
      <BarButton icon={mic.enabled ? <MicIcon /> : <MicOffIcon />} label={mic.enabled ? "Mute" : "Unmute"} tone={mic.enabled ? undefined : "off"} pressed={!mic.enabled} disabled={mic.pending} onClick={() => void mic.toggle()} title="Ctrl/⌘ + D" />
      <BarButton icon={cam.enabled ? <CamIcon /> : <CamOffIcon />} label={cam.enabled ? "Stop video" : "Start video"} tone={cam.enabled ? undefined : "off"} pressed={!cam.enabled} disabled={cam.pending} onClick={() => void cam.toggle()} title="Ctrl/⌘ + E" />
      {canShare && <BarButton icon={<ScreenIcon />} label={share.enabled ? "Stop sharing" : "Share screen"} tone={share.enabled ? "on" : undefined} pressed={share.enabled} disabled={share.pending} onClick={() => void share.toggle()} />}

      <span className="bar-sep" aria-hidden="true" />

      <div className="bar-pop" ref={pickerRef}>
        <BarButton icon={<SmileIcon />} label="React" pressed={picker} onClick={() => setPicker((p) => !p)} />
        {picker && (
          <div className="reaction-picker glass" role="menu" aria-label="Send a reaction">
            {REACTIONS.map((r) => (
              <button
                key={r}
                type="button"
                role="menuitem"
                onClick={() => {
                  onReact(r);
                  setPicker(false);
                }}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
      <BarButton icon={<HandIcon />} label={handUp ? "Lower hand" : "Raise hand"} tone={handUp ? "on" : undefined} pressed={handUp} onClick={onHand} />
      <BarButton icon={gamesLocked ? <LockIcon /> : <DiceIcon />} label={gamesLabel} tone={gamesOpen ? "on" : undefined} pressed={gamesOpen} onClick={onGames} />
      <BarButton icon={<GearIcon />} label="Settings" onClick={onSettings} />

      <span className="bar-sep" aria-hidden="true" />

      <BarButton icon={<LeaveIcon />} label="Leave" tone="leave" onClick={() => void room.disconnect(true)} />
    </footer>
  );
}
