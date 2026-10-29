import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret-at-least-16-chars';
process.env.JWT_EXPIRES_IN = '8h';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.PORT = '4000';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = path.join(root, 'prisma', 'test.db');
const journalPath = `${dbPath}-journal`;

for (const p of [dbPath, journalPath]) {
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

execSync('npx prisma db push --skip-generate', {
  cwd: root,
  env: { ...process.env },
  stdio: 'inherit',
});

const prisma = new PrismaClient();

const adminHash = await bcrypt.hash('admin123', 10);
const agentHash = await bcrypt.hash('agent123', 10);

await prisma.setting.upsert({
  where: { key: 'slaHours' },
  create: { key: 'slaHours', value: '4' },
  update: { value: '4' },
});

await prisma.user.createMany({
  data: [
    {
      name: 'Admin User',
      email: 'admin@demo.local',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
    {
      name: 'Riya Kapoor',
      email: 'riya@demo.local',
      passwordHash: agentHash,
      role: 'AGENT',
    },
    {
      name: 'Arjun Mehta',
      email: 'arjun@demo.local',
      passwordHash: agentHash,
      role: 'AGENT',
    },
    {
      name: 'Neha Singh',
      email: 'neha@demo.local',
      passwordHash: agentHash,
      role: 'AGENT',
    },
  ],
});

await prisma.$disconnect();
