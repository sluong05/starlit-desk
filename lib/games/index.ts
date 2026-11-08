import type { GameDef } from "./core";
import { moonword } from "./moonword";
import { constellations } from "./constellations";
import { deepsky } from "./deepsky";
import { hive } from "./hive";
import { ladder } from "./ladder";
import { scramble } from "./scramble";
import { digits } from "./digits";
import { sudoku } from "./sudoku";
import { emoji } from "./emoji";
import { timeline } from "./timeline";
import { sprint } from "./sprint";
import { jinx } from "./jinx";

/** Every break game, in menu order. */
export const GAMES: GameDef[] = [moonword, constellations, deepsky, hive, ladder, scramble, emoji, timeline, sprint, jinx, digits, sudoku];

export const getGame = (id: string | undefined) => GAMES.find((g) => g.id === id);
