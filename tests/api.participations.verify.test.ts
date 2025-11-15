import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import path from "path";
import fs from "fs";
import { NextRequest } from "next/server";

if (!process.env.DATABASE_URL) {
  const dbPath = path.resolve(process.cwd(), "prisma", "test-verify.db").replace(/\\/g, "/");
  process.env.DATABASE_URL = `file:${dbPath}`;
}
process.env.MOCK_VERIFICATION = "pass"; // Ensure mock passes

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: async () => ({ user: { id: process.env.TEST_USER_ID || "owner-1" } }),
}));

let prisma: typeof import("@/lib/prisma") ["prisma"];
let VerifyPOST: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

const asCtx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/participations/[id]/verify POST", () => {
  beforeAll(async () => {
    // Ensure per-file DB has schema by copying from base test.db
    const baseDb = path.resolve(process.cwd(), "prisma", "test.db");
    const targetDb = process.env.DATABASE_URL!.replace(/^file:/, "");
    try {
      if (fs.existsSync(baseDb)) {
        fs.copyFileSync(baseDb, targetDb);
      }
    } catch {}
    prisma = (await import("@/lib/prisma")).prisma;
    const mod = await import("@/app/api/participations/[id]/verify/route");
    VerifyPOST = mod.POST as any;
    await prisma.$connect();
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys=OFF;");
  });
  afterAll(async () => { await prisma.$disconnect(); });

  beforeEach(async () => {
    await prisma.winnerBackup.deleteMany({});
    await prisma.winnerSelection.deleteMany({});
    await prisma.participation.deleteMany({});
    await prisma.requirement.deleteMany({});
    await prisma.giveaway.deleteMany({});
    await prisma.companyAccount.deleteMany({});
    await prisma.user.deleteMany({});

    await prisma.user.create({ data: { id: "u1" } as any });
    await prisma.companyAccount.create({
      data: { id: "c1", legalName: "Empresa", taxId: "B-1", contactEmail: "c@test.com", ownerUserId: "u1" },
    });

    const now = Date.now();
    await prisma.giveaway.create({
      data: {
        id: "g1",
        title: "Sorteo",
        description: "",
        network: "instagram",
        postUrl: "https://instagram.com/p/abc",
        companyId: "c1",
        startsAt: new Date(now - 2000),
        endsAt: new Date(now + 3600_000),
        status: "active",
        requirements: {
          create: [
            { type: "follow", profileToFollow: "brand", required: true },
            { type: "like", required: true },
            { type: "comment", required: false },
            { type: "mentions", required: true, mentionsCount: 1 },
          ],
        },
      },
    });
    await prisma.user.create({ data: { id: "u2" } as any });
    await prisma.participation.create({ data: { id: "p1", giveawayId: "g1", userId: "u1" } });
    await prisma.participation.create({ data: { id: "p2", giveawayId: "g1", userId: "u2" } });
  });

  it("approves when all required requirements pass (200)", async () => {
    process.env.TEST_USER_ID = "u1";
    const req = new NextRequest("http://localhost/api/participations/p1/verify", { method: "POST" } as any);
    const res = await VerifyPOST(req as any, asCtx("p1"));
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.status).toBe("approved");
    expect(Array.isArray(data.checked)).toBe(true);
    const participation = await prisma.participation.findUnique({ where: { id: "p1" } });
    expect(participation?.verificationStatus).toBe("approved");
  });

  it("forbidden for other user (403)", async () => {
    process.env.TEST_USER_ID = "u2";
    const req = new NextRequest("http://localhost/api/participations/p1/verify", { method: "POST" } as any);
    const res = await VerifyPOST(req as any, asCtx("p1"));
    expect(res.status).toBe(403);
    process.env.TEST_USER_ID = "u1";
  });

  it("idempotent when already verified (200)", async () => {
  process.env.TEST_USER_ID = "u1";
  const first = new NextRequest("http://localhost/api/participations/p1/verify", { method: "POST" } as any);
    const res1 = await VerifyPOST(first as any, asCtx("p1"));
    expect(res1.status).toBe(200);
    const again = new NextRequest("http://localhost/api/participations/p1/verify", { method: "POST" } as any);
    const res2 = await VerifyPOST(again as any, asCtx("p1"));
    expect(res2.status).toBe(200);
    const data: any = await res2.json();
    expect(data.status).toBe("approved");
  });

  it("rejects when mock forces failure (200 with rejected)", async () => {
    process.env.MOCK_VERIFICATION = "fail";
    const req = new NextRequest("http://localhost/api/participations/p2/verify", { method: "POST" } as any);
    process.env.TEST_USER_ID = "u2";
    const res = await VerifyPOST(req as any, asCtx("p2"));
    expect(res.status).toBe(200); // Route returns 200 but status rejected inside payload
    const data: any = await res.json();
    expect(data.status).toBe("rejected");
    process.env.MOCK_VERIFICATION = "pass";
    process.env.TEST_USER_ID = "u1";
  });
});
