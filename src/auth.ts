import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";

// Extend session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isCompany?: boolean;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Allow dynamic host detection behind Vercel proxy and on preview URLs
  trustHost: true,
  // Be explicit about the secret to avoid env resolution issues
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // Lightweight role check: does the user own at least one CompanyAccount?
        try {
          const count = await prisma.companyAccount.count({ where: { ownerUserId: user.id } });
          session.user.isCompany = count > 0;
        } catch {
          // Fallback: don't block session creation if DB check fails
          session.user.isCompany = false;
        }
      }
      return session;
    },
  },
  // Use logger to surface errors in Vercel logs
  logger: {
    error: (...args: unknown[]) => {
      console.error("[auth][error]", ...args);
    },
    warn: (...args: unknown[]) => {
      console.warn("[auth][warn]", ...args);
    },
    debug: (...args: unknown[]) => {
      if (process.env.NODE_ENV !== "production") console.debug("[auth][debug]", ...args);
    },
  },
});
