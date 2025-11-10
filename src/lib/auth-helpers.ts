import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Get authenticated user from session, or return error response.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
    };
  }
  return { user: session.user, error: null };
}
