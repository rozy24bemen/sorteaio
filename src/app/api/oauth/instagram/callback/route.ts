export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { instagramCallbackCore } from "@/lib/oauth/instagramCallback";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const userId = auth.user!.id;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  const igError = url.searchParams.get("error");
  if (igError) return NextResponse.json({ error: igError }, { status: 400 });
  const result = await instagramCallbackCore({
    code: code || "",
    state,
    cookieState: req.cookies.get("instagram_oauth_state")?.value,
    userId,
    origin: url.origin,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  const back = new URL(result.redirect, url.origin);
  const res = NextResponse.redirect(back);
  res.cookies.set("instagram_oauth_state", "", { path: "/", maxAge: 0 });
  return res;
}

// (helper removed: safeText) - no longer needed after refactor
