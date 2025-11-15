import { prisma } from "@/lib/prisma";

export async function instagramCallbackCore(opts: {
  code: string;
  state: string;
  cookieState: string | undefined;
  userId: string;
  origin: string;
}): Promise<{ ok: true; redirect: string } | { ok: false; status: number; error: string }> {
  const { code, state, cookieState, userId, origin } = opts;
  if (!code) return { ok: false, status: 400, error: "Missing code" };
  if (cookieState && cookieState !== state) return { ok: false, status: 400, error: "Invalid state" };

  const clientId = process.env.INSTAGRAM_APP_ID;
  const clientSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${origin}/api/oauth/instagram/callback`;
  if (!clientId || !clientSecret) {
    return { ok: false, status: 500, error: "Missing Instagram app credentials" };
  }

  const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }).toString(),
  });
  if (!tokenRes.ok) {
    const txt = await safeText(tokenRes);
    return { ok: false, status: 502, error: `token_exchange_failed: ${txt}` };
  }
  const tokenJson = await tokenRes.json() as { access_token: string; user_id?: string };

  const meUrl = new URL("https://graph.instagram.com/me");
  meUrl.searchParams.set("fields", "id,username");
  meUrl.searchParams.set("access_token", tokenJson.access_token);
  const meRes = await fetch(meUrl);
  if (!meRes.ok) {
    const txt = await safeText(meRes);
    return { ok: false, status: 502, error: `me_fetch_failed: ${txt}` };
  }
  const me = await meRes.json() as { id: string; username: string };

  const id = `${userId}-instagram`;
  await prisma.socialAccount.upsert({
    where: { id },
    update: {
      network: "instagram",
      handle: me.username,
      providerUserId: me.id,
      tokenType: "short",
      accessToken: tokenJson.access_token,
      userId,
    },
    create: {
      id,
      network: "instagram",
      handle: me.username,
      providerUserId: me.id,
      tokenType: "short",
      accessToken: tokenJson.access_token,
      userId,
    },
  });

  return { ok: true, redirect: "/perfil/vincular-social?linked=instagram" };
}

async function safeText(res: Response) {
  try { return await res.text(); } catch { return "<no-body>"; }
}
