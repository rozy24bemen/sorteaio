import "dotenv/config";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");
  // Normalize SQLite path to absolute to avoid Windows relative path issues
  if (process.env.DATABASE_URL?.startsWith("file:")) {
    const p = process.env.DATABASE_URL.replace(/^file:/, "");
    const isRel = p.startsWith("./") || p.startsWith("../");
    const abs = isRel ? path.resolve(process.cwd(), p) : p;
    if (isRel) process.env.DATABASE_URL = `file:${abs}`;
  }
  console.log("DATABASE_URL=", process.env.DATABASE_URL);

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Test User",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=test",
    },
  });

  console.log("✅ User created:", user.email);

  // Create a company
  const company = await prisma.companyAccount.upsert({
    where: { id: "test-company-1" },
    update: {},
    create: {
      id: "test-company-1",
      legalName: "Sortea.io Demo S.L.",
      taxId: "B12345678",
      fiscalAddress: "Calle Mayor 1, 28001 Madrid",
      contactEmail: "empresa@sortea.io",
      ownerUserId: user.id,
    },
  });

  console.log("✅ Company created:", company.legalName);

  // Create active giveaways
  const giveaway1 = await prisma.giveaway.create({
    data: {
      title: "Sorteo iPhone 15 Pro 🎁",
      description:
        "¡Participa en nuestro increíble sorteo y gana un iPhone 15 Pro! Solo tienes que seguir las instrucciones en Instagram.",
      imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80",
      network: "instagram",
      postUrl: "https://instagram.com/p/example1",
      companyId: company.id,
      startsAt: new Date("2025-11-01"),
      endsAt: new Date("2025-12-15"),
      basesUrl: "https://sortea.io/bases/ejemplo",
      status: "active",
      requirements: {
        create: [
          {
            type: "follow",
            required: true,
            profileToFollow: "@sortea.io",
            order: 0,
          },
          {
            type: "like",
            required: true,
            order: 1,
          },
          {
            type: "mentions",
            required: false,
            mentionsCount: 2,
            order: 2,
          },
        ],
      },
    },
  });

  const giveaway2 = await prisma.giveaway.create({
    data: {
      title: "Gana una Nintendo Switch OLED 🎮",
      description:
        "¡Queremos regalarte una Nintendo Switch OLED! Participa en TikTok siguiendo estos pasos. ¡Mucha suerte!",
      imageUrl: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=80",
      network: "tiktok",
      postUrl: "https://tiktok.com/@sortea.io/video/example",
      companyId: company.id,
      startsAt: new Date("2025-11-05"),
      endsAt: new Date("2025-12-20"),
      status: "active",
      requirements: {
        create: [
          {
            type: "follow",
            required: true,
            profileToFollow: "@sortea.io",
            order: 0,
          },
          {
            type: "like",
            required: true,
            order: 1,
          },
          {
            type: "comment",
            required: true,
            order: 2,
          },
        ],
      },
    },
  });

  const giveaway3 = await prisma.giveaway.create({
    data: {
      title: "Sorteo AirPods Pro 2 🎧",
      description:
        "Los mejores auriculares del mercado pueden ser tuyos. Sigue las instrucciones en X (Twitter) para participar.",
      imageUrl: "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800&q=80",
      network: "x",
      postUrl: "https://x.com/sortea_io/status/example",
      companyId: company.id,
      startsAt: new Date("2025-11-07"),
      endsAt: new Date("2025-12-10"),
      status: "active",
      requirements: {
        create: [
          {
            type: "follow",
            required: true,
            profileToFollow: "@sortea_io",
            order: 0,
          },
          {
            type: "like",
            required: true,
            order: 1,
          },
          {
            type: "comment",
            required: false,
            order: 2,
          },
          {
            type: "mentions",
            required: false,
            mentionsCount: 1,
            order: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Giveaways created:");
  console.log("  -", giveaway1.title);
  console.log("  -", giveaway2.title);
  console.log("  -", giveaway3.title);

  // Create some participations
  await prisma.participation.create({
    data: {
      giveawayId: giveaway1.id,
      userId: user.id,
      entries: 1,
      verificationStatus: "approved",
    },
  });

  await prisma.participation.create({
    data: {
      giveawayId: giveaway2.id,
      userId: user.id,
      entries: 1,
      verificationStatus: "pending",
    },
  });

  console.log("✅ Participations created");

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
