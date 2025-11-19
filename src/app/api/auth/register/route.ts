export const runtime = "nodejs";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

interface RegisterCompanyInput {
  legalName?: string;
  taxId?: string;
  contactEmail?: string;
}

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
  accountType: "PARTICIPANT" | "BRAND";
  company?: RegisterCompanyInput;
}

// Strict mode: an email cannot register as a different accountType if already present.
// Body: { email, password, name?, accountType: 'PARTICIPANT' | 'BRAND', company?: { legalName, taxId?, contactEmail? } }
export async function POST(req: Request) {
  try {
    const json: unknown = await req.json().catch(() => null);
    if (!json || typeof json !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    const { email, password, name, accountType, company } = json as RegisterBody;
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return NextResponse.json({ error: "Email y password requeridos" }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (accountType !== "PARTICIPANT" && accountType !== "BRAND") {
      return NextResponse.json({ error: "Tipo de cuenta inválido" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true, accountType: true, passwordHash: true } });
    if (existing) {
      if (existing.accountType !== accountType) {
        return NextResponse.json({ error: "Este correo ya está registrado con otro tipo de cuenta" }, { status: 409 });
      }
      return NextResponse.json({ error: "Usuario ya existe" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const created = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: typeof name === "string" ? name : null,
        passwordHash,
        accountType: accountType,
      },
      select: { id: true, email: true, accountType: true }
    });

    if (accountType === "BRAND") {
      // Minimal company creation; require legalName (fall back to name or email prefix)
      const legalName = company?.legalName && typeof company.legalName === "string" && company.legalName.trim()
        ? company.legalName.trim()
        : (name && typeof name === "string" ? name : normalizedEmail.split("@")[0]);
      await prisma.companyAccount.create({
        data: {
          legalName,
          taxId: typeof company?.taxId === "string" ? company.taxId : "TEMP",
          contactEmail: normalizedEmail,
          ownerUserId: created.id,
        }
      });
    }

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (err) {
    console.error("[auth][register][error]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
