export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// DELETE /api/oauth/instagram/link - revoke user's Instagram link
export async function DELETE() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const userId = auth.user!.id;

  // We use both id convention and where clause to be resilient
  const id = `${userId}-instagram`;
  await prisma.$transaction(async (tx) => {
    await tx.socialAccount.deleteMany({ where: { userId, network: "instagram" } });
    // In case we used deterministic id in older versions
    await tx.socialAccount.deleteMany({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
