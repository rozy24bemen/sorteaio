export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";

const META_AUTH_URL = "https://www.facebook.com/v21.0/dialog/oauth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "Missing companyId" }, { status: 400 });

  const clientId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI || `${url.origin}/api/oauth/meta/callback`;
  if (!clientId) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  const state = `${companyId}:${crypto.getRandomValues(new Uint32Array(2)).join("")}`;

  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "instagram_basic",
    "instagram_manage_insights",
  ];

  const redirect = new URL(META_AUTH_URL);
  redirect.searchParams.set("client_id", clientId);
  redirect.searchParams.set("redirect_uri", redirectUri);
  redirect.searchParams.set("state", state);
  redirect.searchParams.set("scope", scopes.join(","));
  const res = NextResponse.redirect(redirect.toString());
  res.cookies.set("meta_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  responseHeadersFix();
  return res;
}

function responseHeadersFix(): void {
  // placeholder to keep file cohesive; nothing needed
}
