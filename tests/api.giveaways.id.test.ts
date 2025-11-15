import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import path from "path";
import fs from "fs";
import { NextRequest } from "next/server";

// Ensure DATABASE_URL before imports
// Use per-file isolated SQLite to avoid cross-file races
if (!process.env.DATABASE_URL) {
  const dbPath = path.resolve(process.cwd(), "prisma", "test-id.db").replace(/\\/g, "/");
  process.env.DATABASE_URL = `file:${dbPath}`;
}

let __currentUserId = "u1";
vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: async () => ({ user: { id: __currentUserId } }),
}));

let prisma: typeof import("@/lib/prisma")["prisma"];
let GiveawaysPATCH: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
let GiveawaysDELETE: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

const asCtx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/giveaways/[id] PATCH/DELETE", () => {
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
    const mod = await import("@/app/api/giveaways/[id]/route");
    GiveawaysPATCH = mod.PATCH as any;
    GiveawaysDELETE = mod.DELETE as any;
    await prisma.$connect();
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys=OFF;");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.requirement.deleteMany({});
    await prisma.giveaway.deleteMany({});
    await prisma.companyAccount.deleteMany({});
    await prisma.companyAccount.create({
      data: { id: "c1-id", legalName: "Empresa Uno", taxId: "B111", contactEmail: "c1@test.com", ownerUserId: "u1" },
    });
    await prisma.companyAccount.create({
      data: { id: "c2-id", legalName: "Empresa Dos", taxId: "B222", contactEmail: "c2@test.com", ownerUserId: "u2" },
    });
  });

  it("PATCH happy path updates title (200)", async () => {
    const g = await prisma.giveaway.create({
      data: {
        id: "g1",
        title: "Old",
        description: "",
        network: "instagram",
        postUrl: "https://instagram.com/p/abc",
        companyId: "c1-id",
        startsAt: new Date(Date.now() + 1000),
        endsAt: new Date(Date.now() + 3600_000),
        status: "draft",
      },
    });
  const pre = await prisma.giveaway.findUnique({ where: { id: "g1" } });
  expect(pre).toBeTruthy();
    const req = new NextRequest("http://localhost/api/giveaways/g1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New" }),
    } as any);
    const res = await GiveawaysPATCH(req as any, asCtx("g1"));
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.giveaway.title).toBe("New");
  });

  it("PATCH forbidden for non-owner (403)", async () => {
    __currentUserId = "u2";
    const g = await prisma.giveaway.create({
      data: {
        id: "g2",
        title: "T",
        description: "",
        network: "instagram",
        postUrl: "https://instagram.com/p/abc",
  companyId: "c1-id",
        startsAt: new Date(Date.now() + 1000),
        endsAt: new Date(Date.now() + 3600_000),
        status: "draft",
      },
    });
    const req = new NextRequest("http://localhost/api/giveaways/g2", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nope" }),
    } as any);
    const res = await GiveawaysPATCH(req as any, asCtx("g2"));
    expect(res.status).toBe(403);
    __currentUserId = "u1";
  });

  it("PATCH rejects invalid dates (400)", async () => {
    await prisma.giveaway.create({
      data: {
        id: "g3",
        title: "T",
        description: "",
        network: "instagram",
        postUrl: "https://instagram.com/p/abc",
  companyId: "c1-id",
        startsAt: new Date(Date.now() + 3600_000),
        endsAt: new Date(Date.now() + 7200_000),
        status: "draft",
      },
    });
    const payload = {
      startsAt: new Date(Date.now() + 7200_000).toISOString(),
      endsAt: new Date(Date.now() + 1000).toISOString(),
    };
    const req = new NextRequest("http://localhost/api/giveaways/g3", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    } as any);
    const res = await GiveawaysPATCH(req as any, asCtx("g3"));
    expect(res.status).toBe(400);
  });

  it("PATCH rejects finalized giveaway (400)", async () => {
    await prisma.giveaway.create({
      data: {
        id: "g4",
        title: "T",
        description: "",
        network: "instagram",
        postUrl: "https://instagram.com/p/abc",
  companyId: "c1-id",
        startsAt: new Date(Date.now() + 1000),
        endsAt: new Date(Date.now() + 3600_000),
        status: "finished",
      },
    });
    const req = new NextRequest("http://localhost/api/giveaways/g4", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nope" }),
    } as any);
    const res = await GiveawaysPATCH(req as any, asCtx("g4"));
    expect(res.status).toBe(400);
  });

  it("DELETE happy path (204)", async () => {
    await prisma.giveaway.create({
      data: {
        id: "g5",
        title: "T",
        description: "",
        network: "instagram",
        postUrl: "https://instagram.com/p/abc",
  companyId: "c1-id",
        startsAt: new Date(Date.now() + 1000),
        endsAt: new Date(Date.now() + 3600_000),
        status: "draft",
      },
    });
    const req = new NextRequest("http://localhost/api/giveaways/g5", { method: "DELETE" } as any);
    const res = await GiveawaysDELETE(req as any, asCtx("g5"));
    expect(res.status).toBe(204);
    const exists = await prisma.giveaway.findUnique({ where: { id: "g5" } });
    expect(exists).toBeNull();
  });

  it("DELETE forbidden for non-owner (403)", async () => {
    __currentUserId = "u2";
    await prisma.giveaway.create({
      data: {
        id: "g6",
        title: "T",
        description: "",
        network: "instagram",
        postUrl: "https://instagram.com/p/abc",
  companyId: "c1-id",
        startsAt: new Date(Date.now() + 1000),
        endsAt: new Date(Date.now() + 3600_000),
        status: "draft",
      },
    });
    const req = new NextRequest("http://localhost/api/giveaways/g6", { method: "DELETE" } as any);
    const res = await GiveawaysDELETE(req as any, asCtx("g6"));
    expect(res.status).toBe(403);
    __currentUserId = "u1";
  });

  it("DELETE rejects non-draft (400)", async () => {
    await prisma.giveaway.create({
      data: {
        id: "g7",
        title: "T",
        description: "",
        network: "instagram",
        postUrl: "https://instagram.com/p/abc",
        companyId: "c1-id",
        startsAt: new Date(Date.now() + 1000),
        endsAt: new Date(Date.now() + 3600_000),
        status: "active",
      },
    });
    const req = new NextRequest("http://localhost/api/giveaways/g7", { method: "DELETE" } as any);
    const res = await GiveawaysDELETE(req as any, asCtx("g7"));
    expect(res.status).toBe(400);
  });
});
