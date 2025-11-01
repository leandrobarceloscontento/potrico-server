import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.product.createMany({
    data: [
      { sku: "PORT90X90", title: "York SGR Portinari 90x90 acetinado", description: "Porcelanato York SGR 90x90", priceCents: 9990, available: true },
      { sku: "PORT120X120", title: "York SGR Portinari 120x120 acetinado", description: "Porcelanato York SGR 120x120", priceCents: 13990, available: true }
    ],
    skipDuplicates: true
  });
  console.log("Seed done");
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
