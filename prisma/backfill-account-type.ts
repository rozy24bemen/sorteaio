import { prisma } from "../src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });
  let updated = 0;
  for (const u of users) {
    const companyCount = await prisma.companyAccount.count({ where: { ownerUserId: u.id } });
    if (companyCount > 0) {
      await prisma.user.update({ where: { id: u.id }, data: { accountType: "BRAND" } });
      updated++;
    }
  }
  console.log(`Backfill terminado. Usuarios marcados como BRAND: ${updated}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
