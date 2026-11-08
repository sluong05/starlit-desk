"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDataChannel } from "@livekit/components-react";

/**
 * A tiny shared value for the room (last write wins).
 * Changes are broadcast on `topic`; someone who joins late sends "hello"
 * and whoever is already there answers with the current value.
 */

type Envelope<T> = { value: T; rev: number };
type Msg<T> = { type: "state"; state: Envelope<T> } | { type: "hello" };

const enc = new TextEncoder();
const dec = new TextDecoder();

export function useSyncedState<T>(topic: string, initial: T): [T, (v: T) => void] {
  const [state, setState] = useState<Envelope<T>>({ value: initial, rev: 0 });
  const ref = useRef(state);
  ref.current = state;

  const { send } = useDataChannel(topic, (m) => {
    let msg: Msg<T>;
    try {
      msg = JSON.parse(dec.decode(m.payload));
    } catch {
      return;
    }
    if (msg.type === "hello") post({ type: "state", state: ref.current });
    else if (msg.type === "state" && msg.state.rev >= ref.current.rev) setState(msg.state);
  });

  const post = useCallback(
    (msg: Msg<T>) => {
      send(enc.encode(JSON.stringify(msg)), { reliable: true, topic }).catch(() => {});
    },
    [send, topic],
  );

  useEffect(() => {
    const t = setTimeout(() => post({ type: "hello" }), 900);
    return () => clearTimeout(t);
  }, [post]);

  const set = useCallback(
    (value: T) => {
      const next = { value, rev: ref.current.rev + 1 };
      setState(next);
      post({ type: "state", state: next });
    },
    [post],
  );

  return [state.value, set];
}
