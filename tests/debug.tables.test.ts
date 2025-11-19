import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";

if (!process.env.DATABASE_URL) {
  const dbPath = path.resolve(process.cwd(), "prisma", "test.db").replace(/\\/g, "/");
  process.env.DATABASE_URL = `file:${dbPath}`;
}
const isSqlite = (process.env.DATABASE_URL || "").startsWith("file:");

let prisma: typeof import("@/lib/prisma")['prisma'];

describe("debug: list tables", () => {
  beforeAll(async () => {
    prisma = (await import("@/lib/prisma")).prisma;
    await prisma.$connect();
  });
  afterAll(async () => { await prisma.$disconnect(); });
  it("prints tables", async () => {
    const rows: any = isSqlite
      ? await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      : await prisma.$queryRawUnsafe("SELECT tablename as name FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
    // eslint-disable-next-line no-console
    console.log("[debug tables]", rows.map((r: any) => r.name));
    expect(rows.length).toBeGreaterThan(0);
  });
});
