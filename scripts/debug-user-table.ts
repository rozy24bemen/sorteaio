import { prisma } from "../src/lib/prisma";
async function run() {
  const rows: any = await prisma.$queryRawUnsafe("SELECT sql FROM sqlite_master WHERE type='table' AND name='User'");
  console.log(rows);
  const cols: any = await prisma.$queryRawUnsafe("PRAGMA table_info(User)");
  console.log(cols);
}
run().catch(e=>{console.error(e); process.exit(1);}).finally(()=>prisma.$disconnect());
