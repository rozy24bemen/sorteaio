export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import crypto from "node:crypto";

/**
 * POST /api/giveaways/[id]/select-winner
 * Select a primary winner and backups for a finished giveaway.
 * Preconditions:
 *  - Authenticated
 *  - Caller owns the company of the giveaway
 *  - Giveaway status is 'active' (or 'awaiting_winner' in some flows) AND endsAt < now
 *  - No prior winner selection exists
 */
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const userId = auth.user!.id;
  const { id } = await ctx.params;

  try {
    const giveaway = await prisma.giveaway.findUnique({
      where: { id },
      include: { selection: true },
    });
    if (!giveaway) {
      return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
    }

    // Ownership check
    const company = await prisma.companyAccount.findUnique({ where: { id: giveaway.companyId } });
    if (!company || company.ownerUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Must be time-finished (endsAt < now) and still active (or draft-to-active edge) to select
    const now = new Date();
    if (giveaway.endsAt > now) {
      return NextResponse.json({ error: "Giveaway has not ended yet" }, { status: 400 });
    }
    if (giveaway.status === "finished" || giveaway.status === "awaiting_winner") {
      return NextResponse.json({ error: "Winner already selected" }, { status: 400 });
    }
    if (giveaway.status !== "active") {
      return NextResponse.json({ error: "Giveaway not in selectable state" }, { status: 400 });
    }

    // Existing selection safeguard
    if (giveaway.selection) {
      return NextResponse.json({ error: "Selection already exists" }, { status: 409 });
    }

    // Fetch participations
    const participations = await prisma.participation.findMany({
      where: { giveawayId: giveaway.id },
      select: { id: true, userId: true },
    });
    if (participations.length === 0) {
      return NextResponse.json({ error: "No participations to select from" }, { status: 400 });
    }

    // Random selection using cryptographically secure RNG
    const pickIndex = (max: number) => crypto.randomInt(0, max);
    const remaining = [...participations];
    const primaryIdx = pickIndex(remaining.length);
    const primary = remaining.splice(primaryIdx, 1)[0];

    const backupsDesired = 3;
    const backups: { id: string; userId: string }[] = [];
    for (let i = 0; i < backupsDesired && remaining.length > 0; i++) {
      const bIdx = pickIndex(remaining.length);
      backups.push(remaining.splice(bIdx, 1)[0]);
    }

    // Persist selection atomically
    const [selection] = await prisma.$transaction([
      prisma.winnerSelection.create({
        data: {
          giveawayId: giveaway.id,
          primaryParticipationId: primary.id,
          backups: {
            create: backups.map((b, order) => ({ participationId: b.id, order })),
          },
        },
        include: { backups: true, primaryParticipation: { select: { id: true, userId: true } } },
      }),
      prisma.giveaway.update({
        where: { id: giveaway.id },
        data: { status: "awaiting_winner" },
      }),
    ]);

    return NextResponse.json(
      {
        selection: {
          id: selection.id,
          giveawayId: selection.giveawayId,
          primaryParticipationId: selection.primaryParticipationId,
          primaryUserId: selection.primaryParticipation.userId,
          backups: selection.backups.map((b) => ({ id: b.id, participationId: b.participationId, order: b.order })),
          backupsCount: selection.backups.length,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    interface HasCode { code?: string }
    if (err && typeof err === "object" && "code" in err && (err as HasCode).code === "P2002") {
      return NextResponse.json({ error: "Winner already selected (unique constraint)" }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
