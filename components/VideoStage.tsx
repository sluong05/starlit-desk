"use client";

import { useEffect, useRef, useState } from "react";
import { Track } from "livekit-client";
import {
  VideoTrack,
  isTrackReference,
  useIsMuted,
  useIsSpeaking,
  useTracks,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";

const keyOf = (t: TrackReferenceOrPlaceholder) => `${t.participant.identity}:${t.source}`;
const isScreen = (t: TrackReferenceOrPlaceholder) => t.source === Track.Source.ScreenShare;

/**
 * The video area. Normally your desk and your friend's desk sit side by side.
 * Click any tile to make it big (the others shrink into a strip); click it
 * again to go back. A new screen share is enlarged automatically.
 */
export default function VideoStage({ inviteUrl }: { inviteUrl: string }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  // Local camera first, then at most one friend, then any screen shares.
  // (Starlit Desk is a two-person room.)
  const cams = tracks.filter((t) => !isScreen(t));
  const localCam = cams.filter((t) => t.participant.isLocal).slice(0, 1);
  const remoteCams = cams.filter((t) => !t.participant.isLocal);
  const screens = tracks.filter(isScreen);
  const shown = [...localCam, ...remoteCams.slice(0, 1), ...screens];
  const extra = remoteCams.length - 1;

  const [focus, setFocus] = useState<string | null>(null);

  // Enlarge a screen share as soon as it starts.
  const knownScreens = useRef<Set<string>>(new Set());
  const screenKeys = screens.map(keyOf).join("|");
  useEffect(() => {
    const now = new Set(screenKeys ? screenKeys.split("|") : []);
    for (const k of now) if (!knownScreens.current.has(k)) setFocus(k);
    knownScreens.current = now;
  }, [screenKeys]);

  // If the enlarged tile goes away (share stopped, friend left), go back.
  const focused = shown.find((t) => keyOf(t) === focus);
  useEffect(() => {
    if (focus && !focused) setFocus(null);
  }, [focus, focused]);

  // Escape returns to side-by-side.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFocus(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = (k: string) => setFocus((f) => (f === k ? null : k));

  const waiting = remoteCams.length === 0 && (
    <div className="tile tile-empty">
      <div>
        <strong>Waiting for your study buddy…</strong>
        Send them the invite link — it&apos;s copied when you press <em>Invite</em>.
        <br />
        <small style={{ wordBreak: "break-all", opacity: 0.8 }}>{inviteUrl}</small>
      </div>
    </div>
  );

  if (focused) {
    const others = shown.filter((t) => t !== focused);
    return (
      <div className="stage stage-focus">
        <Tile trackRef={focused} big onClick={() => toggle(keyOf(focused))} />
        <div className="stage-strip">
          {others.map((t) => (
            <Tile key={keyOf(t)} trackRef={t} small onClick={() => toggle(keyOf(t))} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="stage">
      {shown.map((t) => (
        <Tile key={keyOf(t)} trackRef={t} onClick={() => toggle(keyOf(t))} />
      ))}
      {waiting}
      {extra > 0 && (
        <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--ink-dim)" }}>
          +{extra} more {extra === 1 ? "person is" : "people are"} here — Starlit Desk shows two desks at a time.
        </p>
      )}
    </div>
  );
}

function Tile({
  trackRef,
  big = false,
  small = false,
  onClick,
}: {
  trackRef: TrackReferenceOrPlaceholder;
  big?: boolean;
  small?: boolean;
  onClick: () => void;
}) {
  const { participant } = trackRef;
  const screen = isScreen(trackRef);
  const speaking = useIsSpeaking(participant);
  // True when the mic is muted or was never turned on.
  const micMuted = useIsMuted({ participant, source: Track.Source.Microphone });
  const name = participant.name || participant.identity;
  const hasVideo = isTrackReference(trackRef) && !trackRef.publication.isMuted;
  const who = participant.isLocal ? "Your" : `${name}'s`;
  const label = screen ? `${who} screen` : `${name}${participant.isLocal ? " (you)" : ""}`;

  const cls = [
    "tile",
    screen ? "tile-screen" : "tile-camera",
    participant.isLocal ? "tile-local" : "",
    big ? "tile-big" : "",
    small ? "tile-small" : "",
  ].join(" ");

  return (
    <div
      className={cls}
      role="button"
      tabIndex={0}
      aria-label={big ? `Shrink ${label}` : `Enlarge ${label}`}
      title={big ? "Click to go back" : "Click to enlarge"}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {hasVideo ? <VideoTrack trackRef={trackRef} /> : <div className="cam-off">{name.slice(0, 1).toUpperCase()}</div>}
      {!screen && micMuted && (
        <div className="mute-badge" title={`${participant.isLocal ? "You are" : `${name} is`} muted`}>
          <MicOffIcon />
          {!small && <span>Muted</span>}
        </div>
      )}
      <span className="tile-hint" aria-hidden="true">
        {big ? <ShrinkIcon /> : <ExpandIcon />}
      </span>
      <div className="tile-name">
        {screen && <ScreenIcon />}
        {!screen && speaking && !micMuted && <span className="speaking-dot" aria-label="speaking" />}
        {!screen && micMuted && <MicOffIcon small />}
        {label}
      </div>
    </div>
  );
}

const iconProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  viewBox: "0 0 24 24",
};

function MicOffIcon({ small = false }: { small?: boolean }) {
  const size = small ? 14 : 16;
  return (
    <svg width={size} height={size} {...iconProps}>
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function ScreenIcon() {
  return (
    <svg width={14} height={14} {...iconProps}>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width={16} height={16} {...iconProps}>
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

function ShrinkIcon() {
  return (
    <svg width={16} height={16} {...iconProps}>
      <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
    </svg>
  );
}
