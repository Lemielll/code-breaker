/**
 * Admin Seed Script — Code Breaker
 *
 * Membuat akun admin default saat pertama kali setup.
 * Password di-hash dari environment variable, BUKAN hardcoded.
 *
 * Usage: node prisma/seed.js
 *
 * @module prisma/seed
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.development') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function seed() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminNickname = process.env.ADMIN_NICKNAME || 'Administrator';

  if (!adminPassword || adminPassword.includes('CHANGE_ME')) {
    console.error('[SEED ERROR] ADMIN_PASSWORD must be set in .env and not contain CHANGE_ME');
    process.exit(1);
  }

  // Check existing admin
  const existing = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (existing) {
    console.log(`[SEED] Admin '${adminUsername}' already exists. Skipping.`);
    return;
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

  // Create admin user + stats in transaction
  await prisma.$transaction(async (tx) => {
    const admin = await tx.user.create({
      data: {
        username: adminUsername,
        passwordHash,
        nickname: adminNickname,
        role: 'admin',
      },
    });

    await tx.userStats.create({
      data: { userId: admin.id },
    });

    console.log(`[SEED] Admin created: ${admin.username} (${admin.id})`);
  });
}

seed()
  .catch((e) => {
    console.error('[SEED ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
