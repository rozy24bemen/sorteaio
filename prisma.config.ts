import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Normalize DATABASE_URL for Prisma CLI:
// - Prefer direct Postgres URLs (POSTGRES_URL_NON_POOLING, POSTGRES_URL)
// - Then fallback to DATABASE_URL if set
// - Then allow Data Proxy (POSTGRES_PRISMA_URL)
// - Finally, fall back to local SQLite only when nothing else is available
const candidates = [
  process.env.POSTGRES_URL_NON_POOLING,
  process.env.POSTGRES_URL,
  process.env.DATABASE_URL,
  process.env.POSTGRES_PRISMA_URL,
];
let effectiveDbUrl = candidates.find((u) => !!u);
if (!effectiveDbUrl) {
  effectiveDbUrl = "file:./prisma/dev.db";
}

// Ensure Prisma uses the chosen effective URL, overriding a mismatched DATABASE_URL
if (process.env.DATABASE_URL !== effectiveDbUrl) {
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

