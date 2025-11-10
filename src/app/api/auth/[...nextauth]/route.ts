import { handlers } from "@/auth";
import type { NextRequest } from "next/server";

function withDevCsp<T extends (...args: any[]) => Promise<Response>>(fn: T) {
	return (async (...args: Parameters<T>) => {
		const res = await fn(...(args as any));
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
	}) as T;
}

export const GET = withDevCsp((handlers as any).GET as (req: NextRequest, ctx: any) => Promise<Response>);
export const POST = withDevCsp((handlers as any).POST as (req: NextRequest, ctx: any) => Promise<Response>);