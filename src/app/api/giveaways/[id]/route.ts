export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { GiveawayStatus } from "@/generated/prisma/client";

/**
 * GET /api/giveaways/[id]
 * Retrieve a single giveaway by ID with all details
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;
  try {
    const giveaway = await prisma.giveaway.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, legalName: true } },
        requirements: { orderBy: { order: "asc" } },
        _count: { select: { participations: true } },
      },
    });

    if (!giveaway) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ giveaway });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/giveaways/[id]
 * Update giveaway (status, etc.) - requires ownership
 */
interface GiveawayUpdatePayload {
  title?: string;
  description?: string;
  startsAt?: string | Date;
  endsAt?: string | Date;
  status?: GiveawayStatus;
  basesUrl?: string;
  imageUrl?: string;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const userId = authResult.user!.id;
  const { id } = await context.params;

  try {
    // Fetch giveaway first without join to avoid strict include errors when FKs are relaxed in tests
    const giveaway = await prisma.giveaway.findUnique({ where: { id } });

    if (!giveaway) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fetch company separately and verify ownership
    const company = await prisma.companyAccount.findUnique({ where: { id: giveaway.companyId } });
    if (!company) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (company.ownerUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Business rules: cannot modify if finished or awaiting_winner
    if (giveaway.status === "finished" || giveaway.status === "awaiting_winner") {
      return NextResponse.json({ error: "Cannot modify a finalized giveaway" }, { status: 400 });
    }

  const body: GiveawayUpdatePayload = await req.json();

    // Prevent changing ownership/company
  // companyId never allowed to change via PATCH; remove if present from untyped client
  if ((body as Record<string, unknown>).companyId) delete (body as Record<string, unknown>).companyId;

    // Validate dates if provided
    if ("startsAt" in body || "endsAt" in body) {
      const starts = body.startsAt ? new Date(body.startsAt) : giveaway.startsAt;
      const ends = body.endsAt ? new Date(body.endsAt) : giveaway.endsAt;
      if (isNaN(starts.getTime()) || isNaN(ends.getTime())) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
      }
      if (ends <= starts) {
        return NextResponse.json({ error: "endsAt must be after startsAt" }, { status: 400 });
      }
    }

    // Optional: validate status transitions (allow draft->active, active->awaiting_winner only)
    if (body.status) {
      const next = body.status;
      const current = giveaway.status as GiveawayStatus;
      const allowed: Record<GiveawayStatus, GiveawayStatus[]> = {
        draft: ["draft", "active"],
        active: ["active", "awaiting_winner"],
        awaiting_winner: ["awaiting_winner", "finished"],
        finished: ["finished"],
      };
      if (!allowed[current].includes(next)) {
        return NextResponse.json({ error: `Invalid status transition: ${current} -> ${next}` }, { status: 400 });
      }
    }

    // Use updateMany to avoid throwing if record disappears between read and update under test sqlite
  const result = await prisma.giveaway.updateMany({ where: { id }, data: body });
    if (result.count === 0) {
      // Re-check existence to decide between 404 and 409
      const still = await prisma.giveaway.findUnique({ where: { id } });
      if (!still) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ error: "Conflict updating giveaway" }, { status: 409 });
    }
    const updated = await prisma.giveaway.findUnique({ where: { id } });
    return NextResponse.json({ giveaway: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/giveaways/[id]
 * Delete giveaway - requires ownership
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const userId = authResult.user!.id;
  const { id } = await context.params;

  try {
    const giveaway = await prisma.giveaway.findUnique({ where: { id } });

    if (!giveaway) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const company = await prisma.companyAccount.findUnique({ where: { id: giveaway.companyId } });
    if (!company) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (company.ownerUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Business rules: cannot delete if not draft or if winner selection exists
    if (giveaway.status !== "draft") {
      return NextResponse.json({ error: "Cannot delete a non-draft giveaway" }, { status: 400 });
    }

    await prisma.giveaway.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
