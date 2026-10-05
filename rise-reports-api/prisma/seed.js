import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = (process.env.SEED_SUPER_ADMIN_USERNAME || 'superadmin').trim();
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD || 'change-me';

  if (!username || !password) {
    throw new Error('SEED_SUPER_ADMIN_USERNAME and SEED_SUPER_ADMIN_PASSWORD are required');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.appUser.upsert({
    where: { username },
    update: {
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      username,
      passwordHash,
      displayName: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log(`Seeded SUPER_ADMIN: ${user.username} (${user.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
