// Builds the trimmed word lists the games use from SCOWL (via wordlist-english).
// Run: node scripts/build-word-data.mjs   (license: lib/games/data/WORDLIST-COPYRIGHT.txt)
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const dir = require.resolve("wordlist-english/package.json").replace(/package\.json$/, "");
// Never use these as puzzle answers (still fine as guesses if they're in the big list).
const BLOCK = new Set(
  "abuse anal anus arse bitch bimbo boner boobs booby bosom busty butt cocky crack crap dildo dumbo dyke fanny fart fatso freak gonad grope horny hussy idiot kinky lewd loins moron nazi negro nude nudes nympho orgy penis pervy piss porn prick pubes pussy queer rape raped racist randy rapes semen sexy shit skank slave slut sperm spunk stoned strip suck sucks tits titty toke turd twat vomit whore wanker weiner willy booze drunk gay homo lesbo spaz retard lynch kill dead death dying murder suicide gross nigga niggas nigger chink chinks gook gooks kike kikes spic spics wetback fag fags faggot faggots tranny trannies coon coons darky darkie paki pakis jap japs dago dagos wop wops honky raghead towelhead cunt cunts bloody bastard".split(" "),
);
// Never accepted anywhere, not even as a guess.
const SLURS = new Set(
  "nigga niggas nigger niggers chink chinks gook gooks kike kikes spic spics wetback wetbacks fag fags faggot faggots tranny trannies coon coons darky darkie darkies paki pakis jap japs dago dagos wop wops honky honkies raghead ragheads towelhead towelheads cunt cunts retard retards retarded dyke dykes niggaz niggard niggardly niggle niggled niggles niggling".split(" "),
);
const tier = (n) =>
  ["english", "american"].flatMap((v) => JSON.parse(readFileSync(`${dir}${v}-words-${n}.json`, "utf8")));
const upTo = (max) =>
  new Set([10, 20, 35, 40, 50, 55, 60].filter((n) => n <= max).flatMap(tier).filter((w) => /^[a-z]+$/.test(w) && !SLURS.has(w)));

const isInflected = (w) => (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us") && !w.endsWith("is")) || w.endsWith("ed");
const good = (w) => !BLOCK.has(w) && !isInflected(w);

const common20 = upTo(20);
const common35 = upTo(35);
const valid50 = upTo(50);
const valid60 = upTo(60);

const sorted = (s) => [...s].sort();
const out = (name, data) => {
  const json = JSON.stringify(data);
  writeFileSync(`lib/games/data/${name}.json`, json);
  console.log(name, (json.length / 1024).toFixed(0) + "KB");
};

out("five", {
  answers: sorted([...common20].filter((w) => w.length === 5 && good(w))),
  valid: sorted([...valid60].filter((w) => w.length === 5)),
});
out("four", {
  common: sorted([...common20].filter((w) => w.length === 4 && good(w))),
  valid: sorted([...valid50].filter((w) => w.length === 4)),
});
const distinct = (w) => new Set(w).size;
// Hive: "common" words count toward the puzzle total; "extra" words are accepted as bonus finds.
const hiveOk = (w) => w.length >= 4 && distinct(w) <= 7 && !w.includes("s");
const hiveCommon = [...common35].filter((w) => hiveOk(w) && !BLOCK.has(w));
out("hive", {
  pangrams: sorted(hiveCommon.filter((w) => w.length >= 7 && distinct(w) === 7 && good(w))),
  common: sorted(hiveCommon),
  extra: sorted([...valid50].filter((w) => hiveOk(w) && !common35.has(w))),
});
// Scramble: each puzzle word plus any other real words using the same letters.
const key = (w) => [...w].sort().join("");
const byKey = new Map();
for (const w of valid60) if (w.length >= 5 && w.length <= 7) byKey.set(key(w), [...(byKey.get(key(w)) ?? []), w]);
out("scramble", {
  words: sorted([...common20].filter((w) => w.length >= 5 && w.length <= 7 && good(w))).map((w) =>
    [w, ...(byKey.get(key(w)) ?? []).filter((x) => x !== w)].join("|"),
  ),
});
