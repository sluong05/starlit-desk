"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTopic } from "./useTopic";

/**
 * A tiny shared value for the room (last write wins).
 * Changes are broadcast on `topic`; someone who joins late sends "hello"
 * and whoever is already there answers with the current value.
 */

type Envelope<T> = { value: T; rev: number };
type Msg<T> = { type: "state"; state: Envelope<T> } | { type: "hello" };

export function useSyncedState<T>(topic: string, initial: T): [T, (v: T) => void] {
  const [state, setState] = useState<Envelope<T>>({ value: initial, rev: 0 });
  const ref = useRef(state);
  ref.current = state;

  const post = useTopic(topic, (data) => {
    const msg = data as Msg<T>;
    if (msg.type === "hello") post({ type: "state", state: ref.current } satisfies Msg<T>);
    else if (msg.type === "state" && msg.state.rev >= ref.current.rev) setState(msg.state);
  });

  useEffect(() => {
    const t = setTimeout(() => post({ type: "hello" } satisfies Msg<T>), 900);
    return () => clearTimeout(t);
  }, [post]);

  const set = useCallback(
    (value: T) => {
      const next = { value, rev: ref.current.rev + 1 };
      setState(next);
      post({ type: "state", state: next } satisfies Msg<T>);
    },
    [post],
  );

  return [state.value, set];
}
