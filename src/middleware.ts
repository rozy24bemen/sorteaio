import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Protect selected enterprise routes. If not authenticated redirect to /login.
// NOTE: For NextAuth v5 with App Router we have to call auth() at runtime in middleware.
export async function middleware(req: Request) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Public enterprise pages that remain accessible
  const publicEnterprise = ["/empresas", "/empresas/registro"];
  const isEnterpriseProtected = pathname.startsWith("/empresas") && !publicEnterprise.includes(pathname);

  if (!isEnterpriseProtected) {
    return NextResponse.next();
  }

  const session = await auth();
  if (!session?.user?.id) {
    // Preserve original destination for post-login redirect
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  // Authorization: rely on session enrichment (isCompany) to avoid DB calls in middleware
  if (!session.user.isCompany) {
    const redirectUrl = new URL("/empresas", req.url);
    redirectUrl.searchParams.set("error", "no_company_account");
    return NextResponse.redirect(redirectUrl);
  }
  return NextResponse.next();
}

// Configure matcher only for enterprise protected routes (exclude API and static assets)
export const config = {
  matcher: [
    "/empresas/dashboard",
    "/empresas/crear",
    "/empresas/sorteos/:path*",
  ],
};
