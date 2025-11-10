import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { GiveawayStatus, SocialNetwork } from "@/generated/prisma/client";

/**
 * GET /api/giveaways
 * List giveaways with optional filters: status, companyId, network
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") as GiveawayStatus | null;
    const companyId = searchParams.get("companyId");
    const network = searchParams.get("network") as SocialNetwork | null;

    const where: any = {};
    if (status) where.status = status;
    if (companyId) where.companyId = companyId;
    if (network) where.network = network;

    const giveaways = await prisma.giveaway.findMany({
      where,
      include: {
        company: { select: { id: true, legalName: true } },
        requirements: true,
        _count: { select: { participations: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ giveaways });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/giveaways
 * Create a new giveaway (requires auth + company ownership)
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const userId = authResult.user!.id;

  try {
    const body = await req.json();
    const {
      title,
      description,
      network,
      postUrl,
      companyId,
      startsAt,
      endsAt,
      basesUrl,
      imageUrl,
      requirements = [],
    } = body;

    // Validate user owns the company
    const company = await prisma.companyAccount.findUnique({
      where: { id: companyId },
    });
    if (!company || company.ownerUserId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: you do not own this company" },
        { status: 403 }
      );
    }

    // Create giveaway with requirements in a transaction
    const giveaway = await prisma.giveaway.create({
      data: {
        title,
        description,
        network,
        postUrl,
        companyId,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        basesUrl,
        imageUrl,
        status: "draft",
        requirements: {
          create: requirements.map((r: any, idx: number) => ({
            type: r.type,
            required: r.required ?? true,
            mentionsCount: r.mentionsCount,
            profileToFollow: r.profileToFollow,
            order: idx,
          })),
        },
      },
      include: { requirements: true },
    });

    return NextResponse.json({ giveaway }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
