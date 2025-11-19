import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import path from "path";
import fs from "fs";
import { NextRequest } from "next/server";

// Per-file DB
if (!process.env.DATABASE_URL) {
  const dbPath = path.resolve(process.cwd(), "prisma", "test.db").replace(/\\/g, "/");
  process.env.DATABASE_URL = `file:${dbPath}`;
}
const isSqlite = (process.env.DATABASE_URL || "").startsWith("file:");

let __currentUserId = "owner-1";
vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: async () => ({ user: { id: __currentUserId } }),
}));

let prisma: typeof import("@/lib/prisma")["prisma"];
let SelectWinnerPOST: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

const asCtx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/giveaways/[id]/select-winner POST", () => {
  beforeAll(async () => {
    prisma = (await import("@/lib/prisma")).prisma;
    const mod = await import("@/app/api/giveaways/[id]/select-winner/route");
    SelectWinnerPOST = mod.POST as any;
    await prisma.$connect();
    if (isSqlite) {
      await prisma.$executeRawUnsafe("PRAGMA foreign_keys=OFF;");
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
  // Order: backups -> selection -> participation -> requirement -> giveaway -> social -> company -> users
  // Use try/catch to ignore missing table errors if schema evolves.
  try { await prisma.winnerBackup.deleteMany({}); } catch {}
  try { await prisma.winnerSelection.deleteMany({}); } catch {}
    await prisma.participation.deleteMany({});
    await prisma.requirement.deleteMany({});
    await prisma.giveaway.deleteMany({});
    await prisma.socialAccount?.deleteMany?.({} as any).catch(() => {});
    await prisma.companyAccount.deleteMany({});
    // Ensure user seeds are clean between tests to avoid unique constraint conflicts
    try { await prisma.user.deleteMany({}); } catch {}

    // Seed owner user and company, using relation connect to ensure ownerUserId is set reliably
    await prisma.user.create({ data: { id: "owner-1" } as any });
    await prisma.companyAccount.create({
      data: { id: "comp-1", legalName: "Empresa", taxId: "B-1", contactEmail: "c@test.com", owner: { connect: { id: "owner-1" } } },
    });
  await prisma.companyAccount.findUnique({ where: { id: "comp-1" } });
    const now = Date.now();
    await prisma.giveaway.create({
      data: {
        id: "gw-1",
        title: "Sorteo",
        description: "",
        network: "instagram",
        postUrl: "https://instagram.com/p/abc",
        companyId: "comp-1",
        startsAt: new Date(now - 7200_000),
        endsAt: new Date(now - 3600_000),
        status: "active",
      },
    });
    // Seed participations
    await prisma.user.create({ data: { id: "uA" } as any });
    await prisma.user.create({ data: { id: "uB" } as any });
    await prisma.user.create({ data: { id: "uC" } as any });
    await prisma.participation.createMany({
      data: [
        { giveawayId: "gw-1", userId: "uA" },
        { giveawayId: "gw-1", userId: "uB" },
        { giveawayId: "gw-1", userId: "uC" },
      ],
    });
  });

  it("happy path selects primary and backups (201)", async () => {
    const req = new NextRequest("http://localhost/api/giveaways/gw-1/select-winner", { method: "POST" } as any);
    const res = await SelectWinnerPOST(req as any, asCtx("gw-1"));
    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.selection.primaryParticipationId).toBeTruthy();
    expect(data.selection.backupsCount).toBeGreaterThanOrEqual(0);

    const sel = await prisma.winnerSelection.findUnique({ where: { giveawayId: "gw-1" } });
    expect(sel).toBeTruthy();
  });

  it("forbidden for non-owner (403)", async () => {
    __currentUserId = "other";
    const req = new NextRequest("http://localhost/api/giveaways/gw-1/select-winner", { method: "POST" } as any);
    const res = await SelectWinnerPOST(req as any, asCtx("gw-1"));
    expect(res.status).toBe(403);
    __currentUserId = "owner-1";
  });

  it("rejects if giveaway not ended (400)", async () => {
    await prisma.giveaway.update({ where: { id: "gw-1" }, data: { endsAt: new Date(Date.now() + 3600_000) } });
    const req = new NextRequest("http://localhost/api/giveaways/gw-1/select-winner", { method: "POST" } as any);
    const res = await SelectWinnerPOST(req as any, asCtx("gw-1"));
    expect(res.status).toBe(400);
  });

  it("rejects repeat selection (409/400)", async () => {
    const first = new NextRequest("http://localhost/api/giveaways/gw-1/select-winner", { method: "POST" } as any);
    const res1 = await SelectWinnerPOST(first as any, asCtx("gw-1"));
    expect([200, 201].includes(res1.status)).toBe(true);
    const again = new NextRequest("http://localhost/api/giveaways/gw-1/select-winner", { method: "POST" } as any);
    const res2 = await SelectWinnerPOST(again as any, asCtx("gw-1"));
    expect([400, 409].includes(res2.status)).toBe(true);
  });

  it("rejects when no participations (400)", async () => {
    await prisma.participation.deleteMany({ where: { giveawayId: "gw-1" } });
    const req = new NextRequest("http://localhost/api/giveaways/gw-1/select-winner", { method: "POST" } as any);
    const res = await SelectWinnerPOST(req as any, asCtx("gw-1"));
    expect(res.status).toBe(400);
  });
});
