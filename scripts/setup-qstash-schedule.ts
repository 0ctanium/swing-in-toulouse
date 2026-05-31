import "@/load-env";

import { closeDb } from "@/db";
import { getCronSyncUrl } from "@/env";
import { ensureHourlySyncSchedule } from "@/lib/qstash";

async function main() {
  const schedule = await ensureHourlySyncSchedule();

  console.info("QStash schedule configured:");
  console.info(`  id: ${schedule.scheduleId}`);
  console.info(`  cron: ${schedule.cron}`);
  console.info(`  destination: ${schedule.destination}`);
  console.info(`  (CRON_SYNC_URL / default: ${getCronSyncUrl()})`);
}

main()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await closeDb();
    process.exit(1);
  });
