// Import from generated Prisma client output directory
import { PrismaClient } from "../generated/prisma/client";
import path from "node:path";

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
}

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
