"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTopic } from "@/lib/useTopic";

/**
 * The shared move list for the current game. Each move is broadcast to the
 * room; everyone keeps the same list (sorted by time) and replays it through
 * the game's reducer. Someone who joins late asks for the log with "hello".
 */

export type LoggedAct = { id: string; by: string; t: number; a: unknown };
type Msg = { type: "act"; sid: string; act: LoggedAct } | { type: "hello"; sid: string } | { type: "log"; sid: string; acts: LoggedAct[] };

const order = (x: LoggedAct, y: LoggedAct) => x.t - y.t || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0);

export function useGameLog(sid: string | null, me: string): [LoggedAct[], (a: unknown) => void] {
  const [log, setLog] = useState<{ sid: string | null; acts: LoggedAct[] }>({ sid: null, acts: [] });
  // Moves always belong to one game; a log from a different game is ignored.
  const acts = log.sid === sid ? log.acts : [];
  const actsRef = useRef(acts);
  actsRef.current = acts;
  const sidRef = useRef(sid);
  sidRef.current = sid;

  const merge = useCallback((forSid: string, incoming: LoggedAct[]) => {
    setLog((prev) => {
      const base = prev.sid === forSid ? prev.acts : [];
      const ids = new Set(base.map((a) => a.id));
      const add = incoming.filter((a) => a && !ids.has(a.id));
      if (!add.length && prev.sid === forSid) return prev;
      return { sid: forSid, acts: [...base, ...add].sort(order) };
    });
  }, []);

  const post = useTopic("game-act", (data) => {
    const msg = data as Msg;
    if (!sidRef.current || msg.sid !== sidRef.current) return;
    if (msg.type === "act") merge(msg.sid, [msg.act]);
    else if (msg.type === "log") merge(msg.sid, msg.acts);
    else if (msg.type === "hello" && actsRef.current.length) post({ type: "log", sid: msg.sid, acts: actsRef.current } satisfies Msg);
  });

  // Joined a game already in progress? Ask for its moves.
  useEffect(() => {
    if (!sid) return;
    const t = setTimeout(() => post({ type: "hello", sid } satisfies Msg), 400);
    return () => clearTimeout(t);
  }, [sid, post]);

  const dispatch = useCallback(
    (a: unknown) => {
      const s = sidRef.current;
      if (!s) return;
      const act: LoggedAct = { id: `${me}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, by: me, t: Date.now(), a };
      merge(s, [act]);
      post({ type: "act", sid: s, act } satisfies Msg);
    },
    [me, merge, post],
  );

  return [acts, dispatch];
}
