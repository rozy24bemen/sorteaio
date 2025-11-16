export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { RequirementType } from "@prisma/client";
import type { GiveawayStatus, SocialNetwork, RequirementType as RequirementTypeEnum } from "@prisma/client";

/**
 * GET /api/giveaways
 * List giveaways with optional filters: status, companyId, network
 */
type GiveawayFilters = {
  status?: GiveawayStatus;
  companyId?: string;
  network?: SocialNetwork;
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") as GiveawayStatus | null;
    const companyId = searchParams.get("companyId");
    const network = searchParams.get("network") as SocialNetwork | null;

    const where: GiveawayFilters = {};
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/giveaways
 * Create a new giveaway (requires auth + company ownership)
 */
interface RequirementInput {
  type: string;
  required?: boolean;
  mentionsCount?: number;
  profileToFollow?: string;
}
interface GiveawayCreatePayload {
  title: string;
  description?: string;
  network: SocialNetwork;
  postUrl: string;
  companyId: string;
  startsAt: string | number | Date;
  endsAt: string | number | Date;
  basesUrl?: string;
  imageUrl?: string;
  requirements?: RequirementInput[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const userId = authResult.user!.id;

  try {
    const body: GiveawayCreatePayload = await req.json();
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

    // Basic required fields validation
    if (!title || !network || !postUrl || !companyId || !startsAt || !endsAt) {
      return NextResponse.json(
        { error: "Missing required fields: title, network, postUrl, companyId, startsAt, endsAt" },
        { status: 400 }
      );
    }

    // Validate dates
    const starts = new Date(startsAt);
    const ends = new Date(endsAt);
    if (isNaN(starts.getTime()) || isNaN(ends.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }
    if (ends <= starts) {
      return NextResponse.json({ error: "endsAt must be after startsAt" }, { status: 400 });
    }

    // Validate user owns the company
    const company = await prisma.companyAccount.findUnique({ where: { id: companyId } });
    // Optional dev-only debug removed for production cleanliness
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
  description: description ?? "",
        network,
        postUrl,
        companyId,
        startsAt: starts,
        endsAt: ends,
        basesUrl,
        imageUrl,
        status: "draft",
        requirements: {
          create: requirements.map((r, idx) => ({
            type: (Object.values(RequirementType) as string[]).includes(r.type)
              ? (r.type as RequirementTypeEnum)
              : ("follow" as RequirementTypeEnum),
            required: r.required ?? true,
            mentionsCount: r.mentionsCount,
            profileToFollow: r.profileToFollow,
            order: idx,
          })),
        },
      },
      include: { requirements: true },
    });
    // Optional dev-only debug removed for production cleanliness

    return NextResponse.json({ giveaway }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
