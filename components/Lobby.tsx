"use client";

import { useEffect, useRef, useState } from "react";
import Mascot from "@/components/Mascot";
import { CamIcon, CamOffIcon, MicIcon, MicOffIcon } from "@/components/icons";
import { setPrefs, usePrefs } from "@/lib/prefs";

/**
 * The "green room" before joining: check your camera and mic, pick devices,
 * and choose whether to walk in muted. Nothing is sent to anyone yet.
 */
export default function Lobby({ code, initialName, onJoin }: { code: string; initialName: string; onJoin: (name: string) => void }) {
  const prefs = usePrefs();
  const [name, setName] = useState(initialName);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [camError, setCamError] = useState("");
  const [micError, setMicError] = useState("");
  const [level, setLevel] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (initialName) setName(initialName);
  }, [initialName]);

  const refreshDevices = () =>
    navigator.mediaDevices
      ?.enumerateDevices()
      .then(setDevices)
      .catch(() => {});

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshDevices);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refreshDevices);
  }, []);

  // Camera preview
  useEffect(() => {
    if (!prefs.camOn) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    const constraints = (id: string): MediaStreamConstraints => ({ video: { deviceId: id ? { exact: id } : undefined, width: 1280, height: 720 } });
    const start = async () => {
      try {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints(prefs.camId));
        } catch (e) {
          // The saved camera may be unplugged: fall back to any camera.
          if (!prefs.camId) throw e;
          stream = await navigator.mediaDevices.getUserMedia(constraints(""));
        }
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        setCamError("");
        if (videoRef.current) videoRef.current.srcObject = stream;
        refreshDevices();
      } catch {
        if (!cancelled) setCamError("Can't reach your camera. Allow it in your browser's address bar, or join with it off.");
      }
    };
    start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [prefs.camOn, prefs.camId]);

  // Mic level meter
  useEffect(() => {
    if (!prefs.micOn) {
      setLevel(0);
      return;
    }
    let stream: MediaStream | null = null;
    let ac: AudioContext | null = null;
    let raf = 0;
    let cancelled = false;
    const constraints = (id: string): MediaStreamConstraints => ({ audio: { deviceId: id ? { exact: id } : undefined, noiseSuppression: prefs.noiseSuppression, echoCancellation: true } });
    const start = async () => {
      try {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints(prefs.micId));
        } catch (e) {
          if (!prefs.micId) throw e;
          stream = await navigator.mediaDevices.getUserMedia(constraints(""));
        }
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        setMicError("");
        refreshDevices();
        ac = new AudioContext();
        const analyser = ac.createAnalyser();
        analyser.fftSize = 512;
        ac.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let peak = 0;
          for (const v of data) peak = Math.max(peak, Math.abs(v - 128) / 128);
          setLevel((l) => Math.max(peak, l * 0.85));
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        if (!cancelled) setMicError("Can't reach your microphone. Allow it in your browser's address bar, or join muted.");
      }
    };
    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ac?.close();
    };
  }, [prefs.micOn, prefs.micId, prefs.noiseSuppression]);

  const cams = devices.filter((d) => d.kind === "videoinput" && d.label);
  const mics = devices.filter((d) => d.kind === "audioinput" && d.label);

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    try {
      localStorage.setItem("starlit:name", n);
    } catch {
      /* ignore */
    }
    onJoin(n);
  };

  return (
    <main className="lobby">
      <div className="lobby-card glass">
        <div className="lobby-preview">
          <div className={`tile lobby-video ${prefs.mirror ? "mirrored" : ""}`}>
            {prefs.camOn && !camError ? (
              <video ref={videoRef} autoPlay playsInline muted />
            ) : (
              <div className="lobby-camoff">
                <Mascot pose="sit" size={110} />
                <p>{camError || "Your camera is off"}</p>
              </div>
            )}
            <div className="lobby-toggles">
              <button type="button" className={`round-btn ${prefs.micOn ? "" : "off"}`} aria-pressed={!prefs.micOn} aria-label={prefs.micOn ? "Mute microphone" : "Unmute microphone"} onClick={() => setPrefs({ micOn: !prefs.micOn })}>
                {prefs.micOn ? <MicIcon /> : <MicOffIcon />}
              </button>
              <button type="button" className={`round-btn ${prefs.camOn ? "" : "off"}`} aria-pressed={!prefs.camOn} aria-label={prefs.camOn ? "Turn camera off" : "Turn camera on"} onClick={() => setPrefs({ camOn: !prefs.camOn })}>
                {prefs.camOn ? <CamIcon /> : <CamOffIcon />}
              </button>
            </div>
          </div>
          <div className="mic-meter" role="meter" aria-label="Microphone level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level * 100)}>
            <MicIcon size={16} />
            <div className="mic-meter-bar">
              <div style={{ width: `${Math.min(100, level * 160)}%` }} />
            </div>
            <span>{prefs.micOn ? (micError ? "Mic blocked" : "Say something to test your mic") : "You'll join muted"}</span>
          </div>
          {micError && prefs.micOn && <p className="error">{micError}</p>}
        </div>

        <form className="lobby-form" onSubmit={join}>
          <h1 className="room-title">Ready to sit down?</h1>
          <p className="lobby-sub">
            Desk <strong>#{code}</strong>. Nobody can see or hear you until you join.
          </p>

          <div>
            <label className="label" htmlFor="lobby-name">
              Your name
            </label>
            <input id="lobby-name" className="input" value={name} maxLength={24} autoComplete="nickname" placeholder="What should your friend call you?" onChange={(e) => setName(e.target.value)} autoFocus={!initialName} />
          </div>

          {cams.length > 1 && (
            <div>
              <label className="label" htmlFor="lobby-cam">
                Camera
              </label>
              <select id="lobby-cam" className="input" value={prefs.camId} onChange={(e) => setPrefs({ camId: e.target.value })}>
                <option value="">Default camera</option>
                {cams.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {mics.length > 1 && (
            <div>
              <label className="label" htmlFor="lobby-mic">
                Microphone
              </label>
              <select id="lobby-mic" className="input" value={prefs.micId} onChange={(e) => setPrefs({ micId: e.target.value })}>
                <option value="">Default microphone</option>
                {mics.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button className="btn btn-lamp btn-big" type="submit" disabled={!name.trim()}>
            Join the desk
          </button>
          <a className="lobby-back" href="/">
            Back home
          </a>
        </form>
      </div>
    </main>
  );
}
