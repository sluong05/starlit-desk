"use client";

import { useEffect, useRef, useState } from "react";
import { ConnectionQuality, Track } from "livekit-client";
import {
  VideoTrack,
  isTrackReference,
  useConnectionQualityIndicator,
  useIsMuted,
  useIsSpeaking,
  useTracks,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import Mascot from "@/components/Mascot";
import { ExpandIcon, FullscreenIcon, LinkIcon, MicOffIcon, ScreenIcon, ShrinkIcon } from "@/components/icons";
import { usePrefs } from "@/lib/prefs";

const keyOf = (t: TrackReferenceOrPlaceholder) => `${t.participant.identity}:${t.source}`;
const isScreen = (t: TrackReferenceOrPlaceholder) => t.source === Track.Source.ScreenShare;
const MAX_FRIENDS = 5;

/**
 * The video area. Everyone's camera sits in a grid. Click any tile to make it
 * big (the others move into a strip); click again to go back. A new screen
 * share is enlarged automatically. In game mode the game takes the big spot.
 */
export default function VideoStage({
  main,
  hands,
  onInvite,
}: {
  main?: React.ReactNode;
  hands: Record<string, boolean>;
  onInvite: () => void;
}) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  // You first, then your friends, then any shared screens.
  const cams = tracks.filter((t) => !isScreen(t));
  const localCam = cams.filter((t) => t.participant.isLocal).slice(0, 1);
  const remoteCams = cams.filter((t) => !t.participant.isLocal);
  const screens = tracks.filter(isScreen);
  const shown = [...localCam, ...remoteCams.slice(0, MAX_FRIENDS), ...screens];
  const extra = remoteCams.length - MAX_FRIENDS;

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

  // Escape returns to the grid.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.fullscreenElement && setFocus(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = (k: string) => setFocus((f) => (f === k ? null : k));
  const hand = (t: TrackReferenceOrPlaceholder) => !isScreen(t) && !!hands[t.participant.identity];

  if (main) {
    return (
      <div className="stage stage-focus stage-game">
        {main}
        <div className="stage-strip">
          {shown.map((t) => (
            <Tile key={keyOf(t)} trackRef={t} small hand={hand(t)} />
          ))}
        </div>
      </div>
    );
  }

  if (focused) {
    const others = shown.filter((t) => t !== focused);
    return (
      <div className="stage stage-focus">
        <Tile trackRef={focused} big hand={hand(focused)} onClick={() => toggle(keyOf(focused))} />
        <div className="stage-strip">
          {others.map((t) => (
            <Tile key={keyOf(t)} trackRef={t} small hand={hand(t)} onClick={() => toggle(keyOf(t))} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`stage stage-grid count-${Math.min(shown.length + (remoteCams.length === 0 ? 1 : 0), 6)}`}>
      {shown.map((t) => (
        <Tile key={keyOf(t)} trackRef={t} hand={hand(t)} onClick={() => toggle(keyOf(t))} />
      ))}
      {remoteCams.length === 0 && (
        <div className="tile tile-empty">
          <div>
            <Mascot pose="wave" size={92} />
            <strong>Saving a seat for your friend</strong>
            <p>Send them the link and they&apos;ll pop in right here.</p>
            <button className="btn btn-lamp" onClick={onInvite}>
              <LinkIcon size={16} /> Copy invite link
            </button>
          </div>
        </div>
      )}
      {extra > 0 && (
        <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--ink-dim)" }}>
          +{extra} more {extra === 1 ? "person is" : "people are"} here. Starlit Desk shows six desks at a time.
        </p>
      )}
    </div>
  );
}

function Tile({
  trackRef,
  big = false,
  small = false,
  hand = false,
  onClick,
}: {
  trackRef: TrackReferenceOrPlaceholder;
  big?: boolean;
  small?: boolean;
  hand?: boolean;
  onClick?: () => void;
}) {
  const { participant } = trackRef;
  const prefs = usePrefs();
  const ref = useRef<HTMLDivElement>(null);
  const screen = isScreen(trackRef);
  const speaking = useIsSpeaking(participant);
  // True when the mic is muted or was never turned on.
  const micMuted = useIsMuted({ participant, source: Track.Source.Microphone });
  const { quality } = useConnectionQualityIndicator({ participant });
  const name = participant.name || participant.identity;
  const hasVideo = isTrackReference(trackRef) && !trackRef.publication.isMuted;
  const who = participant.isLocal ? "Your" : `${name}'s`;
  const label = screen ? `${who} screen` : `${name}${participant.isLocal ? " (you)" : ""}`;
  const weak = quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost;

  const cls = [
    "tile",
    screen ? "tile-screen" : "tile-camera",
    participant.isLocal && prefs.mirror ? "tile-mirror" : "",
    big ? "tile-big" : "",
    small ? "tile-small" : "",
    !screen && speaking && !micMuted ? "tile-speaking" : "",
  ].join(" ");

  const fullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (document.fullscreenElement) void document.exitFullscreen();
    else void ref.current?.requestFullscreen?.();
  };

  return (
    <div
      ref={ref}
      className={cls}
      {...(onClick
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": big ? `Shrink ${label}` : `Enlarge ${label}`,
            title: big ? "Click to go back" : "Click to enlarge",
            onClick,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            },
          }
        : {})}
    >
      {hasVideo ? <VideoTrack trackRef={trackRef} /> : <div className="cam-off">{name.slice(0, 1).toUpperCase()}</div>}

      <div className="tile-badges">
        {hand && (
          <span className="hand-badge" title={`${name} raised a hand`}>
            ✋
          </span>
        )}
        {!screen && micMuted && (
          <span className="mute-badge" title={`${participant.isLocal ? "You are" : `${name} is`} muted`}>
            <MicOffIcon size={15} />
            {!small && <span>Muted</span>}
          </span>
        )}
      </div>

      {onClick && (
        <span className="tile-hint" aria-hidden="true">
          {big ? <ShrinkIcon size={16} /> : <ExpandIcon size={16} />}
        </span>
      )}
      {big && (
        <button type="button" className="tile-full" onClick={fullscreen} aria-label="Full screen" title="Full screen">
          <FullscreenIcon size={16} />
        </button>
      )}

      <div className="tile-name">
        {screen && <ScreenIcon size={14} />}
        {!screen && speaking && !micMuted && <span className="speaking-dot" aria-label="speaking" />}
        {label}
        {!screen && quality !== ConnectionQuality.Unknown && (
          <span className={`signal signal-${quality}`} title={weak ? "Weak connection" : "Good connection"} aria-label={weak ? "Weak connection" : "Good connection"}>
            <i />
            <i />
            <i />
          </span>
        )}
      </div>
    </div>
  );
}
