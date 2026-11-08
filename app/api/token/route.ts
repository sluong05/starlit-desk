import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

// Issues a short-lived LiveKit access token for one person joining one room.
// Room codes are the only "auth" in this MVP: anyone with the link can join.

const ROOM_CODE = /^[a-z0-9-]{3,40}$/;

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room")?.toLowerCase() ?? "";
  const name = (req.nextUrl.searchParams.get("name") ?? "").trim().slice(0, 24);

  if (!ROOM_CODE.test(room)) {
    return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Please enter a name." }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Server is missing LIVEKIT_API_KEY / LIVEKIT_API_SECRET. See README." },
      { status: 500 },
    );
  }

  // Identity must be unique per connection; the display name can repeat.
  const identity = `${name}-${crypto.randomUUID().slice(0, 6)}`;

  const at = new AccessToken(apiKey, apiSecret, { identity, name, ttl: "4h" });
  at.addGrant({
    room: `starlit-${room}`,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return NextResponse.json({ token: await at.toJwt(), identity });
}
