import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Normalize DATABASE_URL for Prisma:
// - Prefer DATABASE_URL
// - Fallback to common Vercel Postgres envs (POSTGRES_PRISMA_URL, POSTGRES_URL)
// - As a last resort (e.g., CI), fall back to a local SQLite URL so `prisma generate`
//   and type-checking can run without secrets.
// Prefer direct Postgres URLs for CLI (POSTGRES_URL[_NON_POOLING]) over prisma://
const candidates = [
  process.env.DATABASE_URL,
  process.env.POSTGRES_URL,
  process.env.POSTGRES_URL_NON_POOLING,
  process.env.POSTGRES_PRISMA_URL,
];
let effectiveDbUrl = candidates.find((u) => !!u && !u.startsWith("prisma:"));
if (!effectiveDbUrl) {
  // As a last resort (e.g., CI without secrets), fall back to SQLite
  effectiveDbUrl = "file:./prisma/dev.db";
}

// Ensure Prisma sees DATABASE_URL even if only POSTGRES_* is set (e.g., Vercel Postgres)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = effectiveDbUrl;
}

// Choose schema by effective URL protocol: SQLite (file:) vs Postgres
const isSqlite = (process.env.DATABASE_URL ?? "").startsWith("file:");
const schemaPath = isSqlite ? "prisma/schema.prisma" : "prisma/schema.postgres.prisma";

export default defineConfig({
  schema: schemaPath,
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
