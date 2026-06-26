import { Client } from "@upstash/qstash";

import {
  env,
  getCronProjectOccurrencesUrl,
  getCronSyncUrl,
} from "@/env";

export function createQStashClient() {
  if (!env.QSTASH_TOKEN) {
    throw new Error("QSTASH_TOKEN is not configured");
  }

  return new Client({
    token: env.QSTASH_TOKEN,
    baseUrl: env.QSTASH_URL,
  });
}

export async function ensureHourlySyncSchedule() {
  const client = createQStashClient();
  const destination = getCronSyncUrl();
  const cron = "0 * * * *";
  const scheduleId = "swing-toulouse-hourly-sync";

  const existing = await client.schedules.list();
  const current = existing.find((schedule) => schedule.scheduleId === scheduleId);

  if (current) {
    await client.schedules.delete(scheduleId);
  }

  await client.schedules.create({
    scheduleId,
    destination,
    cron,
  });

  return { scheduleId, destination, cron };
}

export async function ensureDailyProjectOccurrencesSchedule() {
  const client = createQStashClient();
  const destination = getCronProjectOccurrencesUrl();
  const cron = "0 4 * * *";
  const scheduleId = "swing-toulouse-daily-project-occurrences";

  const existing = await client.schedules.list();
  const current = existing.find((schedule) => schedule.scheduleId === scheduleId);

  if (current) {
    await client.schedules.delete(scheduleId);
  }

  await client.schedules.create({
    scheduleId,
    destination,
    cron,
  });

  return { scheduleId, destination, cron };
}
