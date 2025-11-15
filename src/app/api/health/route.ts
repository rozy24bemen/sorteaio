import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const giveaways = await prisma.giveaway.count();
    const users = await prisma.user.count();
    return NextResponse.json({ ok: true, users, giveaways });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
