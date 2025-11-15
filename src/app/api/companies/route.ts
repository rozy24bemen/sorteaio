export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * POST /api/companies
 * Create a new company account for authenticated user
 */
interface CompanyCreatePayload {
  legalName: string;
  taxId: string;
  fiscalAddress?: string | null;
  contactEmail: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const userId = authResult.user!.id;

  try {
    const body: CompanyCreatePayload = await req.json();
    const { legalName, taxId, fiscalAddress, contactEmail } = body;

    if (!legalName || !taxId || !contactEmail) {
      return NextResponse.json(
        { error: "Missing required fields: legalName, taxId, contactEmail" },
        { status: 400 }
      );
    }

    const company = await prisma.companyAccount.create({
      data: {
        legalName,
        taxId,
        fiscalAddress,
        contactEmail,
        ownerUserId: userId,
      },
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/companies
 * List companies owned by authenticated user
 */
export async function GET(): Promise<NextResponse> {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const userId = authResult.user!.id;

  try {
    const companies = await prisma.companyAccount.findMany({
      where: { ownerUserId: userId },
      include: {
        _count: { select: { giveaways: true } },
      },
    });

    return NextResponse.json({ companies });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
