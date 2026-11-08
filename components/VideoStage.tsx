"use client";

import { Track } from "livekit-client";
import {
  VideoTrack,
  isTrackReference,
  useIsMuted,
  useIsSpeaking,
  useTracks,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";

/** The two "windows" you and your friend sit in. */
export default function VideoStage({ inviteUrl }: { inviteUrl: string }) {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    onlySubscribed: false,
  });

  // Local person first, then at most one friend. (Starlit Desk is a two-person room.)
  const local = tracks.filter((t) => t.participant.isLocal);
  const remote = tracks.filter((t) => !t.participant.isLocal);
  const shown = [...local.slice(0, 1), ...remote.slice(0, 1)];
  const extra = remote.length - 1;

  return (
    <div className="stage">
      {shown.map((t) => (
        <Tile key={`${t.participant.identity}-${t.source}`} trackRef={t} />
      ))}
      {remote.length === 0 && (
        <div className="tile tile-empty">
          <div>
            <strong>Waiting for your study buddy…</strong>
            Send them the invite link — it&apos;s copied when you press <em>Invite</em>.
            <br />
            <small style={{ wordBreak: "break-all", opacity: 0.8 }}>{inviteUrl}</small>
          </div>
        </div>
      )}
      {extra > 0 && (
        <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--ink-dim)" }}>
          +{extra} more {extra === 1 ? "person is" : "people are"} here — Starlit Desk shows two desks at a time.
        </p>
      )}
    </div>
  );
}

function Tile({ trackRef }: { trackRef: TrackReferenceOrPlaceholder }) {
  const { participant } = trackRef;
  const speaking = useIsSpeaking(participant);
  // True when the mic is muted or was never turned on.
  const micMuted = useIsMuted({ participant, source: Track.Source.Microphone });
  const name = participant.name || participant.identity;
  const hasVideo = isTrackReference(trackRef) && !trackRef.publication.isMuted;

  return (
    <div className={`tile ${participant.isLocal ? "tile-local" : ""}`}>
      {hasVideo ? <VideoTrack trackRef={trackRef} /> : <div className="cam-off">{name.slice(0, 1).toUpperCase()}</div>}
      {micMuted && (
        <div className="mute-badge" title={`${participant.isLocal ? "You are" : `${name} is`} muted`}>
          <MicOffIcon />
          <span>Muted</span>
        </div>
      )}
      <div className="tile-name">
        {speaking && !micMuted && <span className="speaking-dot" aria-label="speaking" />}
        {micMuted && <MicOffIcon small />}
        {name}
        {participant.isLocal && " (you)"}
      </div>
    </div>
  );
}

function MicOffIcon({ small = false }: { small?: boolean }) {
  const size = small ? 14 : 16;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}
