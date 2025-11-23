import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";

// Local interface to access extended user fields that Prisma schema defines but
// adapter type narrowing may omit in generated TypeScript types.
interface ExtendedUser {
  id: string;
  email?: string | null;
  name?: string | null;
  passwordHash?: string | null;
  accountType?: string | null;
}

// Extend session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isCompany?: boolean;
      role?: string;
    } & DefaultSession["user"];
  }
}

const isProd = process.env.NODE_ENV === "production";
const cookieSuffix = (process.env.AUTH_SECRET || "").slice(0, 8) || "dev";
const sessionCookieName = isProd
  ? `__Secure-next-auth.session-token.${cookieSuffix}`
  : "next-auth.session-token";

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
      // Using default checks (state + pkce when applicable) to diagnose cookie issues
    }),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(creds) {
        const email = typeof creds?.email === "string" ? creds.email.trim().toLowerCase() : null;
        const password = typeof creds?.password === "string" ? creds.password : null;
        if (!email || !password) {
          console.warn("[auth][credentials] Missing email or password input");
          return null;
        }
        const user = await prisma.user.findUnique({ where: { email } }) as unknown as ExtendedUser | null;
        if (!user) {
          console.warn("[auth][credentials] User not found", email);
          return null;
        }
        if (!user.passwordHash) {
          console.warn("[auth][credentials] User has no password hash (likely OAuth-only)", user.id);
          return null;
        }
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          console.warn("[auth][credentials] Invalid password", user.id);
          return null;
        }
        return { id: user.id, email: user.email ?? undefined, name: user.name ?? undefined };
      }
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: sessionCookieName,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // Direct role mapping via accountType
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: user.id } }) as unknown as ExtendedUser | null;
          session.user.isCompany = dbUser?.accountType === "BRAND";
          session.user.role = (dbUser?.accountType as string) || "PARTICIPANT";
        } catch {
          session.user.isCompany = false;
          session.user.role = "PARTICIPANT";
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
