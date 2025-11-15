import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Normalize DATABASE_URL for Prisma:
// - Prefer DATABASE_URL
// - Fallback to common Vercel Postgres envs (POSTGRES_PRISMA_URL, POSTGRES_URL)
// - As a last resort, leave as-is (may be empty in CI and cause an explicit validation error)
const effectiveDbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  "";

// Ensure Prisma sees DATABASE_URL even if only POSTGRES_* is set (e.g., Vercel Postgres)
if (!process.env.DATABASE_URL && effectiveDbUrl) {
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
