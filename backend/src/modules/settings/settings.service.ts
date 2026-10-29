import { prisma } from '../../lib/prisma.js';
import { DEFAULT_SLA_HOURS } from '../../domain/constants.js';

export async function getSlaHours(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: 'slaHours' } });
  if (!setting) return DEFAULT_SLA_HOURS;
  const n = Number(setting.value);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_SLA_HOURS;
}

export async function getSettings() {
  const slaHours = await getSlaHours();
  return { slaHours };
}

export async function updateSettings(slaHours: number) {
  await prisma.setting.upsert({
    where: { key: 'slaHours' },
    create: { key: 'slaHours', value: String(slaHours) },
    update: { value: String(slaHours) },
  });
  return { slaHours };
}
