/// <reference lib="webworker" />
// Renders ambient loops off the main thread so the page never stutters.
import { RECIPES, type SoundId } from "./recipes";

self.onmessage = (e: MessageEvent<{ id: SoundId; sr: number }>) => {
  const { id, sr } = e.data;
  const [L, R] = RECIPES[id](sr);
  (self as unknown as Worker).postMessage({ id, L, R }, [L.buffer, R.buffer]);
};
