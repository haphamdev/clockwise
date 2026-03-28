import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  await prisma.organization.upsert({
    where: { id: DEFAULT_ORG_ID },
    update: {},
    create: {
      id: DEFAULT_ORG_ID,
      name: 'Default Organization',
      settings: {
        expectedHoursPerWeek: 40,
        dailyWarningThreshold: 12,
        weeklyWarningThreshold: 60,
        dateFormat: 'YYYY-MM-DD',
        csvMaxRows: 5000,
      },
    },
  });

  console.log('Seed complete: default organization created.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
