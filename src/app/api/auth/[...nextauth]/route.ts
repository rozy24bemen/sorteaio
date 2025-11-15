export const runtime = 'nodejs';
import { handlers } from "@/auth";
import type { NextRequest } from "next/server";

type Handler = (req: NextRequest, ctx: Record<string, unknown>) => Promise<Response>;

function withDevCsp(fn: Handler) {
	return (async (req: NextRequest, ctx: Record<string, unknown>) => {
		const res = await fn(req, ctx);
		if (process.env.NODE_ENV !== "production") {
			const existing = res.headers.get("Content-Security-Policy");
			if (existing) {
				// Try to append 'unsafe-eval' to script-src to support Next.js dev source maps
				const updated = existing.replace(/script-src([^;]*)/i, (m, g1) => {
					return m.includes("unsafe-eval") ? m : `script-src${g1} 'unsafe-eval'`;
				});
				res.headers.set("Content-Security-Policy", updated);
			} else {
				res.headers.set("Content-Security-Policy", "script-src 'self' 'unsafe-eval'");
			}
		}
		return res;
	});
}

export const GET = withDevCsp(handlers.GET as Handler);
export const POST = withDevCsp(handlers.POST as Handler);