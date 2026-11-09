"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDataChannel } from "@livekit/components-react";

type Incoming = { payload: Uint8Array; from?: { identity: string; name?: string } };

/**
 * A data-channel topic with a stable `send`.
 *
 * LiveKit's useDataChannel rebuilds its sender whenever the message handler
 * is a different function, so passing an inline handler gives a new `send` on
 * every render. Anything depending on `send` (effects, callbacks) would then
 * re-run every render. This keeps the latest handler in a ref and hands
 * LiveKit one handler that never changes.
 */
export function useTopic(topic: string, onMessage: (data: unknown, msg: Incoming) => void) {
  const handler = useRef(onMessage);
  useEffect(() => {
    handler.current = onMessage;
  });

  const stableHandler = useCallback((msg: Incoming) => {
    let data: unknown;
    try {
      data = JSON.parse(new TextDecoder().decode(msg.payload));
    } catch {
      return;
    }
    handler.current(data, msg);
  }, []);

  const { send } = useDataChannel(topic, stableHandler);

  // In case LiveKit ever hands back a new sender anyway, route through a ref
  // so our returned function stays the same.
  const sendRef = useRef(send);
  sendRef.current = send;

  return useCallback(
    (data: unknown) => {
      sendRef.current(new TextEncoder().encode(JSON.stringify(data)), { reliable: true, topic }).catch(() => {
        /* not connected yet; later messages will catch up */
      });
    },
    [topic],
  );
}
