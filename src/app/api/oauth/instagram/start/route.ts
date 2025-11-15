export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const origin = url.origin;

  const clientId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${origin}/api/oauth/instagram/callback`;
  if (!clientId) {
    return NextResponse.json({ error: "Missing INSTAGRAM_APP_ID" }, { status: 500 });
  }

  const state = `${auth.user!.id}:${crypto.randomUUID()}`;
  const igAuth = new URL("https://api.instagram.com/oauth/authorize");
  igAuth.searchParams.set("client_id", clientId);
  igAuth.searchParams.set("redirect_uri", redirectUri);
  igAuth.searchParams.set("scope", "user_profile");
  igAuth.searchParams.set("response_type", "code");
  igAuth.searchParams.set("state", state);

  const res = NextResponse.redirect(igAuth);
  res.cookies.set("instagram_oauth_state", state, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 10 });
  return res;
}
