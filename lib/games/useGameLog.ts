"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDataChannel } from "@livekit/components-react";

/**
 * The shared move list for the current game. Each move is broadcast to the
 * room; everyone keeps the same list (sorted by time) and replays it through
 * the game's reducer. Someone who joins late asks for the log with "hello".
 */

export type LoggedAct = { id: string; by: string; t: number; a: unknown };
type Msg = { type: "act"; sid: string; act: LoggedAct } | { type: "hello"; sid: string } | { type: "log"; sid: string; acts: LoggedAct[] };

const enc = new TextEncoder();
const dec = new TextDecoder();
const TOPIC = "game-act";

const order = (x: LoggedAct, y: LoggedAct) => x.t - y.t || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0);

export function useGameLog(sid: string | null, me: string): [LoggedAct[], (a: unknown) => void] {
  const [acts, setActs] = useState<LoggedAct[]>([]);
  const actsRef = useRef(acts);
  actsRef.current = acts;
  const sidRef = useRef(sid);
  sidRef.current = sid;

  const merge = useCallback((incoming: LoggedAct[]) => {
    setActs((prev) => {
      const ids = new Set(prev.map((a) => a.id));
      const add = incoming.filter((a) => a && !ids.has(a.id));
      return add.length ? [...prev, ...add].sort(order) : prev;
    });
  }, []);

  const { send } = useDataChannel(TOPIC, (m) => {
    let msg: Msg;
    try {
      msg = JSON.parse(dec.decode(m.payload));
    } catch {
      return;
    }
    if (!sidRef.current || msg.sid !== sidRef.current) return;
    if (msg.type === "act") merge([msg.act]);
    else if (msg.type === "log") merge(msg.acts);
    else if (msg.type === "hello" && actsRef.current.length) post({ type: "log", sid: msg.sid, acts: actsRef.current });
  });

  const post = useCallback(
    (msg: Msg) => {
      send(enc.encode(JSON.stringify(msg)), { reliable: true, topic: TOPIC }).catch(() => {});
    },
    [send],
  );

  // New game: start a fresh log and ask if anyone already has moves for it.
  useEffect(() => {
    setActs([]);
    if (!sid) return;
    const t = setTimeout(() => post({ type: "hello", sid }), 400);
    return () => clearTimeout(t);
  }, [sid, post]);

  const dispatch = useCallback(
    (a: unknown) => {
      const s = sidRef.current;
      if (!s) return;
      const act: LoggedAct = { id: `${me}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, by: me, t: Date.now(), a };
      merge([act]);
      post({ type: "act", sid: s, act });
    },
    [me, merge, post],
  );

  return [acts, dispatch];
}
