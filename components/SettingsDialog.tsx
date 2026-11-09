"use client";

import { useCallback, useEffect } from "react";
import { Track } from "livekit-client";
import { useLocalParticipant, useMediaDeviceSelect } from "@livekit/components-react";
import { CloseIcon } from "@/components/icons";
import { useSfxMuted } from "@/components/games/kit";
import { setMuted } from "@/lib/games/sfx";
import { captureOptions, getPrefs, setPrefs, usePrefs, type Prefs } from "@/lib/prefs";

/** Call settings: devices, how your video looks, and sounds. */
export default function SettingsDialog({ onClose, flash }: { onClose: () => void; flash: (msg: string) => void }) {
  const prefs = usePrefs();
  const gameMuted = useSfxMuted();
  const { localParticipant } = useLocalParticipant();
  // Must keep the same identity between renders, or the device lists never settle.
  // Listing can fail quietly (no permission yet); the note below covers that.
  const onError = useCallback(() => {}, []);
  const mics = useMediaDeviceSelect({ kind: "audioinput", onError });
  const cams = useMediaDeviceSelect({ kind: "videoinput", onError });
  const speakers = useMediaDeviceSelect({ kind: "audiooutput", onError });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Re-capture the mic or camera so a changed setting takes effect right away.
  const restart = async (source: Track.Source) => {
    const pub = localParticipant.getTrackPublication(source);
    const opts = captureOptions(getPrefs());
    try {
      if (source === Track.Source.Microphone) await pub?.audioTrack?.restartTrack(opts.audio);
      else await pub?.videoTrack?.restartTrack(opts.video);
    } catch {
      flash("That setting will apply the next time you join.");
    }
  };

  const toggle = (key: keyof Prefs, then?: () => void) => () => {
    setPrefs({ [key]: !prefs[key] } as Partial<Prefs>);
    then?.();
  };

  const select = (label: string, id: string, pick: typeof mics, prefKey: "micId" | "camId" | "speakerId") =>
    pick.devices.length > 0 && (
      <div className="setting-row">
        <label htmlFor={id}>{label}</label>
        <select
          id={id}
          className="input"
          value={pick.activeDeviceId}
          onChange={(e) => {
            setPrefs({ [prefKey]: e.target.value } as Partial<Prefs>);
            pick.setActiveMediaDevice(e.target.value).catch(() => flash("Couldn't switch to that device."));
          }}
        >
          {pick.devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || "Default"}
            </option>
          ))}
        </select>
      </div>
    );

  const sw = (label: string, hint: string, on: boolean, onChange: () => void) => (
    <label className="setting-switch">
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      <input type="checkbox" role="switch" checked={on} onChange={onChange} />
      <i aria-hidden="true" />
    </label>
  );

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog glass" role="dialog" aria-modal="true" aria-label="Settings" onClick={(e) => e.stopPropagation()}>
        <header className="dialog-head">
          <h2>Settings</h2>
          <button className="round-btn small" onClick={onClose} aria-label="Close settings">
            <CloseIcon size={16} />
          </button>
        </header>

        <section>
          <h3>Devices</h3>
          {select("Microphone", "set-mic", mics, "micId")}
          {select("Camera", "set-cam", cams, "camId")}
          {select("Speaker", "set-spk", speakers, "speakerId")}
          {mics.devices.length === 0 && cams.devices.length === 0 ? (
            <p className="setting-note">Turn on your mic or camera once so your browser lets Starlit Desk list your devices.</p>
          ) : (
            speakers.devices.length === 0 && <p className="setting-note">This browser uses your system&apos;s speaker setting.</p>
          )}
        </section>

        <section>
          <h3>Video</h3>
          {sw("Mirror my video", "Only changes what you see. Friends always see you unflipped.", prefs.mirror, toggle("mirror"))}
          {sw("Save data", "Send smaller video. Good for slow Wi-Fi and long sessions.", prefs.saveData, toggle("saveData", () => void restart(Track.Source.Camera)))}
        </section>

        <section>
          <h3>Sound</h3>
          {sw("Noise suppression", "Quiets keyboard clicks and background hum from your mic.", prefs.noiseSuppression, toggle("noiseSuppression", () => void restart(Track.Source.Microphone)))}
          {sw("Join and leave chimes", "A soft sound when someone arrives or goes.", prefs.chimes, toggle("chimes"))}
          {sw("Game sounds", "Sound effects in break games.", !gameMuted, () => setMuted(!gameMuted))}
        </section>

        <section>
          <h3>Shortcuts</h3>
          <ul className="shortcut-list">
            <li>
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>D</kbd> <span>Mute or unmute</span>
            </li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>E</kbd> <span>Camera on or off</span>
            </li>
            <li>
              <kbd>Esc</kbd> <span>Close this, or shrink an enlarged video</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
