import { PrismaClient } from "@prisma/client";
import path from "node:path";

// Normalize env vars at runtime so Prisma Client always has DATABASE_URL
// This mirrors prisma.config.ts logic used at build time (for CLI),
// but we also need it here for the running app on Vercel.
if (!process.env.DATABASE_URL) {
  const fallback = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL;
  if (fallback) {
    process.env.DATABASE_URL = fallback;
    console.log("[prisma.ts] DATABASE_URL filled from POSTGRES_* env var");
  }
}

// Helpful logging to diagnose SQLite path issues in dev
const logConfig: ("query"|"error"|"warn"|"info")[] = process.env.PRISMA_LOG_QUERIES === "1" ? ['query','error','warn'] : ['error','warn'];

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma ?? new PrismaClient({
  log: logConfig,
});

if (!process.env.DATABASE_URL) {
  console.error("[prisma.ts] DATABASE_URL not set at runtime");
} else if (process.env.DATABASE_URL.startsWith("file:")) {
  const dbPath = process.env.DATABASE_URL.replace(/^file:/, "");
  // If relative path, convert to absolute for reliability on Windows
  const isRelative = dbPath.startsWith("./") || dbPath.startsWith("../");
  const resolved = isRelative ? path.resolve(process.cwd(), dbPath) : dbPath;
  if (isRelative) {
    process.env.DATABASE_URL = `file:${resolved}`;
  }
  console.log("[prisma.ts] Using SQLite file:", process.env.DATABASE_URL);
} else if (process.env.DATABASE_URL.startsWith("postgres")) {
  // Light log to confirm runtime url source (redacted)
  try {
    const redacted = process.env.DATABASE_URL.replace(/:(\/\/[^:]+:)[^@]+@/, "://$1***@");
    console.log("[prisma.ts] Using Postgres URL (redacted):", redacted);
  } catch {
    // ignore
  }
} else if (process.env.DATABASE_URL.startsWith("prisma:")) {
  console.warn("[prisma.ts] DATABASE_URL uses prisma://. Consider setting POSTGRES_URL for direct connection in serverless envs.");
}

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
