import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import path from "path";

if (!process.env.DATABASE_URL) {
  const dbPath = path.resolve(process.cwd(), "prisma", "test.db").replace(/\\/g, "/");
  process.env.DATABASE_URL = `file:${dbPath}`;
}

let prisma: typeof import("@/lib/prisma")["prisma"];
let instagramCallbackCore: typeof import("@/lib/oauth/instagramCallback").instagramCallbackCore;

describe("Instagram OAuth callback core (participants)", () => {
  beforeAll(async () => {
    prisma = (await import("@/lib/prisma")).prisma;
    const coreMod = await import("@/lib/oauth/instagramCallback");
    instagramCallbackCore = coreMod.instagramCallbackCore;
    await prisma.$connect();
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys=OFF;");
    process.env.INSTAGRAM_APP_ID = "ig-app";
    process.env.INSTAGRAM_APP_SECRET = "ig-secret";
  });
  afterAll(async () => { await prisma.$disconnect(); });

  beforeEach(async () => {
    // Avoid touching tables that may not exist in the minimal test schema (e.g., SocialAccount)
    // Ensure the test user exists without relying on deletes between tests.
    await prisma.user.upsert({
      where: { id: "u1" },
      update: {},
      create: { id: "u1" } as any,
    });
  });

  it("happy path: exchanges token, fetches profile, and upserts SocialAccount", async () => {
    const state = `u1:${crypto.randomUUID()}`;
    const fetchMock = vi.spyOn(global, "fetch" as any).mockImplementation(async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.toString?.() || "";
      if (url.startsWith("https://api.instagram.com/oauth/access_token") && (init?.method === "POST")) {
        return new Response(JSON.stringify({ access_token: "ig-short", user_id: "123" }), { status: 200 });
      }
      if (url.startsWith("https://graph.instagram.com/me")) {
        return new Response(JSON.stringify({ id: "17890", username: "tester" }), { status: 200 });
      }
      return new Response("not-found", { status: 404 });
    });
    const upsertSpy = vi.spyOn(prisma.socialAccount, "upsert").mockResolvedValueOnce({} as any);
    const result = await instagramCallbackCore({
      code: "abc",
      state,
      cookieState: state,
      userId: "u1",
      origin: "http://localhost",
    });
    expect(result.ok).toBe(true);
    expect((result as any).redirect).toContain("linked=instagram");
    expect(upsertSpy).toHaveBeenCalledTimes(1);
    const args = upsertSpy.mock.calls[0]?.[0];
    expect(args.create.network).toBe("instagram");
    expect(args.create.providerUserId).toBe("17890");
    expect(args.create.accessToken).toBe("ig-short");
    upsertSpy.mockRestore();
    fetchMock.mockRestore();
  });

  it("token exchange failure returns 502 and does not persist", async () => {
    const state = `u1:${crypto.randomUUID()}`;
    const fetchMock = vi.spyOn(global, "fetch" as any).mockResolvedValue(new Response("boom", { status: 400 }));
    const upsertSpy = vi.spyOn(prisma.socialAccount, "upsert").mockResolvedValue({} as any);
    const result = await instagramCallbackCore({
      code: "bad",
      state,
      cookieState: state,
      userId: "u1",
      origin: "http://localhost",
    });
    expect(result.ok).toBe(false);
    expect((result as any).status).toBe(502);
    expect(upsertSpy).not.toHaveBeenCalled();
    upsertSpy.mockRestore();
    fetchMock.mockRestore();
  });

  it("invalid state is rejected with 400", async () => {
    const cookieState = `u1:${crypto.randomUUID()}`;
    const urlState = `u1:${crypto.randomUUID()}`; // mismatch
    const fetchMock = vi.spyOn(global, "fetch" as any).mockResolvedValue(new Response(JSON.stringify({ access_token: "x" }), { status: 200 }));
    const result = await instagramCallbackCore({
      code: "abc",
      state: urlState,
      cookieState,
      userId: "u1",
      origin: "http://localhost",
    });
    expect(result.ok).toBe(false);
    expect((result as any).status).toBe(400);
    fetchMock.mockRestore();
  });
});
