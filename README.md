# ✦ Starlit Desk

Study side by side with a friend over video, in a cozy room under the stars.

- **Video call** for two, powered by [LiveKit](https://livekit.io) (WebRTC, with TURN handled for you)
- **Invite links**: open a desk, press *Invite*, send the link
- **Shared Pomodoro timer** (25/5, 50/10, 90/15) that stays in sync for both of you
- **Five room themes** you pick together (synced for both people): Starlit Night, Rainy Café, Forest Cabin, Sakura Morning, Seaside Dusk
- **Ambience mixer**: rain, fireplace, crickets, waves, wind, birds — synthesized in the browser (no audio files), plus a one-tap mix for each theme
- **Text chat** and **mute indicators**

Built with Next.js 16 (App Router), React 19, and TypeScript.

---

## Setup (about 5 minutes)

### 1. Get free LiveKit keys
1. Sign up at **https://cloud.livekit.io** and create a project.
2. Go to **Settings → Keys** and create a key. Copy the **API Key**, the **API Secret**, and your project's **WebSocket URL** (`wss://…livekit.cloud`).

The free tier is plenty for two people studying.

### 2. Configure and run
```bash
npm install
cp .env.example .env.local   # then paste your three values into .env.local
npm run dev
```
Open http://localhost:3000, enter your name, and press **Open a new desk**.

### 3. Test with a friend
`localhost` only works on your own machine. To study with a friend on another computer, either:
- **Deploy** (recommended): push to GitHub, import the repo on [Vercel](https://vercel.com), and add the same three env vars in the Vercel project settings, or
- **Tunnel** your dev server: `npx localtunnel --port 3000` or `ngrok http 3000`.

Browsers only allow camera access on `https://` or `localhost`, so a plain LAN IP like `http://192.168.x.x:3000` won't work.

To test solo, open the invite link in a second browser profile or an incognito window.

---

## How it works

```
app/
  page.tsx               landing: name + "open a desk" / join by code or link
  room/[code]/page.tsx   the room: fetches a token, connects, lays out the desk
  api/token/route.ts     signs a LiveKit access token (server-side; keeps your secret safe)
components/
  Scene.tsx              animated background, cross-fades between themes
  ThemePicker.tsx        theme swatches
  VideoStage.tsx         your window + your friend's window
  Pomodoro.tsx           shared timer (LiveKit data channel)
  Chat.tsx               room chat
  AmbiencePanel.tsx      personal sound mixer
lib/
  themes.ts              theme list (name, swatch, suggested sound mix)
  scenes.ts              the canvas drawing for each theme
  useSyncedState.ts      tiny "shared value" hook used for the room theme
  sound/dsp.ts           filters, noise, seamless-loop helpers
  sound/recipes.ts       how each ambient sound is built
  sound/synth.worker.ts  renders sounds off the main thread
  sound/engine.ts        playback: reverb, compressor, looping voices, timer chime
```

**Timer sync.** The timer's full state is broadcast on the `timer` data topic whenever someone presses a button, and the last write wins. A running timer is stored as an absolute `endsAt` timestamp, so both browsers count down on their own without chatting every second. When someone joins, they send `hello` and whoever is already there replies with the current state. Both computers' clocks need to be roughly right; normal OS time sync is plenty.

**Rooms.** A room code like `cozy-owl-482` is the only key, so anyone with the link can join. That's fine for friends. Add auth before making it public.

**Themes.** The palette for each theme is a block of CSS variables in `app/globals.css` (`[data-theme="…"]`); the moving scene is a function in `lib/scenes.ts`. To add a theme, add an entry to `lib/themes.ts`, a palette block, and a scene.

**Sounds.** Each sound is rendered once into a seamless stereo loop (20–36 s) in a Web Worker, then looped with a random start point. To swap in recorded audio later (e.g. ElevenLabs), replace `loadSound` in `lib/sound/engine.ts` with a `fetch` + `decodeAudioData` of your file; the rest of the mixer stays the same.

---

## Ideas for next steps
- Background segmentation so you both appear *inside* the scene (`@livekit/track-processors` has a background-replacement processor).
- Shared to-do list (same data-channel pattern as the timer).
- Study streaks and a "focus blocks together" history (needs a small DB, e.g. Supabase).
- Enforce a two-person limit server-side with `RoomServiceClient.listParticipants` in the token route.
