export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
// Using response cookies instead of global cookies() for easier testing

// Note: real implementation would call Graph API to exchange code for token and extend to long-lived token.
// Here we implement the structure and persistence; tests will mock fetch.

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const userId = auth.user!.id;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  const error = url.searchParams.get("error");
  if (error) return NextResponse.json({ error }, { status: 400 });
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const expected = req.cookies.get("meta_oauth_state")?.value || "";
  if (expected && expected !== state) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const [companyId] = state.split(":");
  if (!companyId) return NextResponse.json({ error: "Missing company in state" }, { status: 400 });

  // Ensure user owns the company
  const company = await prisma.companyAccount.findUnique({ where: { id: companyId } });
  if (!company || company.ownerUserId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const clientId = process.env.META_APP_ID!;
  const clientSecret = process.env.META_APP_SECRET!;
  const redirectUri = process.env.META_REDIRECT_URI || `${url.origin}/api/oauth/meta/callback`;

  // 1) Exchange code for short-lived access token
  const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", clientId);
  tokenUrl.searchParams.set("client_secret", clientSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);

  const tokenRes = await fetch(tokenUrl, { method: "GET" });
  if (!tokenRes.ok) {
    const txt = await safeText(tokenRes);
    return NextResponse.json({ error: `token_exchange_failed: ${txt}` }, { status: 502 });
  }
  const tokenJson = await tokenRes.json() as { access_token: string; token_type?: string; expires_in?: number };

  // 2) Exchange for long-lived token
  const extendUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  extendUrl.searchParams.set("grant_type", "fb_exchange_token");
  extendUrl.searchParams.set("client_id", clientId);
  extendUrl.searchParams.set("client_secret", clientSecret);
  extendUrl.searchParams.set("fb_exchange_token", tokenJson.access_token);

  const extendRes = await fetch(extendUrl, { method: "GET" });
  if (!extendRes.ok) {
    const txt = await safeText(extendRes);
    return NextResponse.json({ error: `token_extend_failed: ${txt}` }, { status: 502 });
  }
  const extendJson = await extendRes.json() as { access_token: string; token_type?: string; expires_in?: number };

  const expiresAt = extendJson.expires_in ? new Date(Date.now() + extendJson.expires_in * 1000) : null;

  // Persist social account for company as Meta (facebook)
  await prisma.socialAccount.upsert({
    where: { id: `${companyId}-meta` },
    update: {
      network: "facebook",
      handle: company.legalName,
      tokenType: "long",
      accessToken: extendJson.access_token,
      accessTokenExpiresAt: expiresAt,
      companyId,
    },
    create: {
      id: `${companyId}-meta`,
      network: "facebook",
      handle: company.legalName,
      tokenType: "long",
      accessToken: extendJson.access_token,
      accessTokenExpiresAt: expiresAt,
      companyId,
    },
  });

  const back = new URL("/empresas/onboarding?step=2", url.origin);
  const res = NextResponse.redirect(back);
  res.cookies.set("meta_oauth_state", "", { path: "/", maxAge: 0 });
  return res;
}

async function safeText(res: Response) {
  try { return await res.text(); } catch { return "<no-body>"; }
}
