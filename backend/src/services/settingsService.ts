import { prisma } from '../utils/prisma.js';

export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await prisma.siteSetting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return map;
}

export async function updateSettings(
  updates: Array<{ key: string; value: string }>
): Promise<Record<string, string>> {
  for (const update of updates) {
    await prisma.siteSetting.upsert({
      where: { key: update.key },
      update: { value: update.value },
      create: { key: update.key, value: update.value },
    });
  }

  return getAllSettings();
}

export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  return setting?.value ?? null;
}
