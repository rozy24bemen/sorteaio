import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * POST /api/participations
 * Create a new participation in a giveaway
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const userId = authResult.user!.id;

  try {
    const body = await req.json();
    const { giveawayId, entries = 1 } = body;

    // Validate giveaway exists and is active
    const giveaway = await prisma.giveaway.findUnique({
      where: { id: giveawayId },
    });

    if (!giveaway) {
      return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
    }

    if (giveaway.status !== "active") {
      return NextResponse.json(
        { error: "Giveaway is not active" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now < giveaway.startsAt || now > giveaway.endsAt) {
      return NextResponse.json(
        { error: "Giveaway is not within participation period" },
        { status: 400 }
      );
    }

    // Check if user already participated
    const existing = await prisma.participation.findFirst({
      where: { giveawayId, userId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already participated in this giveaway" },
        { status: 400 }
      );
    }

    // Create participation
    const participation = await prisma.participation.create({
      data: {
        giveawayId,
        userId,
        entries,
        verificationStatus: "pending",
      },
    });

    return NextResponse.json({ participation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/participations
 * List user's participations
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const userId = authResult.user!.id;

  try {
    const participations = await prisma.participation.findMany({
      where: { userId },
      include: {
        giveaway: {
          select: {
            id: true,
            title: true,
            endsAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ participations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
