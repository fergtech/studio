import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateUniqueUsername(fullName: string | null) {
  let base = (fullName || 'user').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!base) base = 'user';
  let username = base;
  let counter = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${counter}`;
    counter++;
  }
  return username;
}

async function backfillUsernames() {
  const users = await prisma.user.findMany({ where: { username: null } });
  for (const user of users) {
    const username = await generateUniqueUsername(user.name);
    await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });
    console.log(`Assigned username "${username}" to user ${user.id}`);
  }
  console.log('Backfill complete!');
}

backfillUsernames()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect()); 