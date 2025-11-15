import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Choose schema by DATABASE_URL protocol: SQLite (file:) vs Postgres/MySQL/etc.
const dbUrl = process.env.DATABASE_URL ?? "";
const isSqlite = dbUrl.startsWith("file:");
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
