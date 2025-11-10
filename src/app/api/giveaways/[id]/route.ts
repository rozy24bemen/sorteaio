import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * GET /api/giveaways/[id]
 * Retrieve a single giveaway by ID with all details
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/giveaways/[id]
 * Update giveaway (status, etc.) - requires ownership
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const userId = authResult.user!.id;
  const { id } = await context.params;

  try {
    const giveaway = await prisma.giveaway.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!giveaway) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (giveaway.company.ownerUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await prisma.giveaway.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ giveaway: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/giveaways/[id]
 * Delete giveaway - requires ownership
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const userId = authResult.user!.id;
  const { id } = await context.params;

  try {
    const giveaway = await prisma.giveaway.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!giveaway) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (giveaway.company.ownerUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.giveaway.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
