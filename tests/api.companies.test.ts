import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import path from "path";
import { NextRequest } from "next/server";

// Set DATABASE_URL for Prisma before any module import that uses it
if (!process.env.DATABASE_URL) {
  const dbPath = path.resolve(process.cwd(), "prisma", "test.db").replace(/\\/g, "/");
  process.env.DATABASE_URL = `file:${dbPath}`;
}

// Mock authentication to always return a test user id
vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: async () => ({ user: { id: "test-user" } }),
}));

describe("/api/companies POST", () => {
  let prisma: typeof import("@/lib/prisma")["prisma"];
  let CompaniesPOST: (req: NextRequest) => Promise<Response>;
  beforeAll(async () => {
    // Dynamic imports after env is set
    prisma = (await import("@/lib/prisma")).prisma;
    CompaniesPOST = (await import("@/app/api/companies/route")).POST as any;
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean tables that we touch
  await prisma.companyAccount.deleteMany({});
  await prisma.user.deleteMany({ where: { id: "test-user" } });
    // Create a test user (if schema requires foreign key)
    await prisma.user.create({
      data: {
        id: "test-user",
        email: "test@example.com",
        name: "Tester",
      },
    });
  });

  it("creates a company and returns 201", async () => {
    const payload = {
      legalName: "Mi Empresa S.L.",
      taxId: "B12345678",
      fiscalAddress: "Calle Falsa 123",
      contactEmail: "empresa@test.com",
    };
    const req = new NextRequest("http://localhost/api/companies", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    } as any);

    const res = await CompaniesPOST(req as any);
    expect(res.status).toBe(201);
    const json: any = await res.json();
    expect(json.company).toBeDefined();
    expect(json.company.legalName).toBe(payload.legalName);

    const count = await prisma.companyAccount.count({ where: { ownerUserId: "test-user" } });
    expect(count).toBe(1);
  });

  it("validates required fields", async () => {
    const payload = { legalName: "Mi Empresa S.L." };
    const req = new NextRequest("http://localhost/api/companies", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    } as any);

    const res = await CompaniesPOST(req as any);
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error).toContain("Missing required fields");
  });
});
