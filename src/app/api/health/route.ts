import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const giveaways = await prisma.giveaway.count();
    const users = await prisma.user.count();
    return NextResponse.json({ ok: true, users, giveaways });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
