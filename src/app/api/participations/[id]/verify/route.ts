export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { SocialVerifier } from "@/lib/verification/SocialVerifier";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const userId = authResult.user!.id;

  const { id } = await ctx.params;

  try {
    // Check existing status for idempotency
  const existing = await prisma.participation.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Participation not found" }, { status: 404 });
    if (existing.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (existing.verificationStatus === "approved" || existing.verificationStatus === "rejected") {
      return NextResponse.json({ status: existing.verificationStatus, checked: [] });
    }

    const verifier = new SocialVerifier();
    const result = await verifier.verifyParticipation(id, userId);

    const updated = await prisma.participation.update({
      where: { id },
      data: { verificationStatus: result.status },
    });

    return NextResponse.json({ status: updated.verificationStatus, checked: result.checked }, { status: 200 });
  } catch (error) {
    const status = typeof (error as { status?: number })?.status === "number" ? (error as { status?: number }).status! : 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status });
  }
}
