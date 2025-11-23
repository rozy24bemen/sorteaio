import { NextResponse } from "next/server";

// Lightweight middleware without DB/Auth imports to keep Edge Runtime compatible.
// We only check for presence of an Auth.js session cookie and let pages/APIs enforce detailed auth.
export function middleware(req: Request) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  const publicEnterprise = ["/empresas", "/empresas/registro"];
  const isEnterpriseProtected = pathname.startsWith("/empresas") && !publicEnterprise.includes(pathname);
  if (!isEnterpriseProtected) return NextResponse.next();

  const cookieHeader = (req as unknown as { headers?: Headers }).headers?.get("cookie") || "";
  const sessionPattern = /(?:^|;\s*)(?:authjs\.session-token|__Secure-authjs\.session-token|next-auth\.session-token(?:\.[^=;]+)?|__Secure-next-auth\.session-token(?:\.[^=;]+)?)/;
  const hasSession = sessionPattern.test(cookieHeader);
  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/empresas/dashboard",
    "/empresas/crear",
    "/empresas/sorteos/:path*",
  ],
};
