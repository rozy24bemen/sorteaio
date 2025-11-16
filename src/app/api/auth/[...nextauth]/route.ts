export const runtime = 'nodejs';
import { handlers } from "@/auth";
import type { NextRequest } from "next/server";

type Handler = (req: NextRequest, ctx: Record<string, unknown>) => Promise<Response>;

function withDevCsp(fn: Handler) {
	return async (req: NextRequest, ctx: Record<string, unknown>) => {
		if (process.env.NODE_ENV !== "production") {
			const path = req.nextUrl.pathname;
			if (path.includes("/api/auth/signin") || path.includes("/api/auth/callback")) {
				const rawCookie = req.headers.get("cookie") || "";
				console.debug("[auth][debug][pre] path=%s cookies=%s", path, rawCookie);
			}
		}
		const res = await fn(req, ctx);
		if (process.env.NODE_ENV !== "production") {
			const existing = res.headers.get("Content-Security-Policy");
			if (existing) {
				const updated = existing.replace(/script-src([^;]*)/i, (m, g1) => {
					return m.includes("unsafe-eval") ? m : `script-src${g1} 'unsafe-eval'`;
				});
				res.headers.set("Content-Security-Policy", updated);
			} else {
				res.headers.set("Content-Security-Policy", "script-src 'self' 'unsafe-eval'");
			}
			const path = req.nextUrl.pathname;
			if (path.includes("/api/auth/signin") || path.includes("/api/auth/callback")) {
				const setCookie = res.headers.get("set-cookie") || "";
				console.debug("[auth][debug][post] path=%s set-cookie=%s", path, setCookie);
			}
		}
		return res;
	};
}

export const GET = withDevCsp(handlers.GET as Handler);
export const POST = withDevCsp(handlers.POST as Handler);