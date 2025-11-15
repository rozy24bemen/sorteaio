import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import path from "path";
import fs from "fs";
import { NextRequest } from "next/server";

// Ensure DATABASE_URL for Prisma before imports
if (!process.env.DATABASE_URL) {
  const dbPath = path.resolve(process.cwd(), "prisma", "test-main.db").replace(/\\/g, "/");
  process.env.DATABASE_URL = `file:${dbPath}`;
}

// Mocks
let __currentUserId = "u1";
vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: async () => ({ user: { id: __currentUserId } }),
}));

let prisma: typeof import("@/lib/prisma")["prisma"];
let GiveawaysPOST: (req: NextRequest) => Promise<Response>;

describe("/api/giveaways POST", () => {
  beforeAll(async () => {
    // Ensure our per-file DB has schema by copying from base test.db
    const baseDb = path.resolve(process.cwd(), "prisma", "test.db");
    const targetDb = process.env.DATABASE_URL!.replace(/^file:/, "");
    try {
      if (fs.existsSync(baseDb)) {
        fs.copyFileSync(baseDb, targetDb);
      }
    } catch {}
    prisma = (await import("@/lib/prisma")).prisma;
    GiveawaysPOST = (await import("@/app/api/giveaways/route")).POST as any;
    await prisma.$connect();
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys=OFF;");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Cleanup limited to models currently created in these tests
    await prisma.requirement.deleteMany({});
    await prisma.giveaway.deleteMany({});
    await prisma.companyAccount.deleteMany({});
    // Also clear any leftover companies/giveaways explicitly, just in case
    const extraG = await prisma.giveaway.count({});
    if (extraG > 0) {
      await prisma.$executeRawUnsafe("DELETE FROM Giveaway;");
    }
    // Seed company directly (ignore user FK for test simplification)
    await prisma.companyAccount.create({
      data: { id: "c1", legalName: "Empresa Uno", taxId: "B111", contactEmail: "c1@test.com", ownerUserId: "u1" },
    });
  });

  it("creates a giveaway for an owned company (201)", async () => {
    const payload = {
      title: "Sorteo 1",
      description: "Desc",
      network: "instagram",
      postUrl: "https://instagram.com/p/abc",
      companyId: "c1",
      startsAt: new Date(Date.now() + 1000).toISOString(),
      endsAt: new Date(Date.now() + 3600_000).toISOString(),
      requirements: [
        { type: "follow", profileToFollow: "@miMarca" },
        { type: "like" },
      ],
    };
  // Ensure starting company exists (precondition only)
  await prisma.companyAccount.findUnique({ where: { id: "c1" } });
  await prisma.giveaway.count({});

    const req = new NextRequest("http://localhost/api/giveaways", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    } as any);

    const res = await GiveawaysPOST(req as any);
    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.giveaway).toBeDefined();
    expect(data.giveaway.title).toBe(payload.title);
    const count = await prisma.giveaway.count({ where: { companyId: "c1" } });
    expect(count).toBe(1);
  });

  it("rejects creating for a company not owned by the user (403)", async () => {
    // Switch mocked user to u2 for this test
    __currentUserId = "u2";
    const payload = {
      title: "Sorteo 2",
      network: "instagram",
      postUrl: "https://instagram.com/p/xyz",
      companyId: "c1",
      startsAt: new Date(Date.now() + 1000).toISOString(),
      endsAt: new Date(Date.now() + 3600_000).toISOString(),
    };
    const req = new NextRequest("http://localhost/api/giveaways", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    } as any);

    const res = await GiveawaysPOST(req as any);
    expect(res.status).toBe(403);
    const data: any = await res.json();
    expect(data.error).toContain("Forbidden");
    // Restore user to u1
    __currentUserId = "u1";
  });

  it("validates required fields (400)", async () => {
    const req = new NextRequest("http://localhost/api/giveaways", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "x" }),
    } as any);
    const res = await GiveawaysPOST(req as any);
    expect(res.status).toBe(400);
  });

  it("validates endsAt after startsAt (400)", async () => {
    const payload = {
      title: "Sorteo",
      network: "instagram",
      postUrl: "https://instagram.com/p/abc",
      companyId: "c1",
      startsAt: new Date(Date.now() + 3600_000).toISOString(),
      endsAt: new Date(Date.now() + 1000).toISOString(),
    };
    const req = new NextRequest("http://localhost/api/giveaways", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    } as any);

    const res = await GiveawaysPOST(req as any);
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toContain("endsAt must be after startsAt");
  });
});
