import "@/load-env";

import { closeDb } from "@/db";
import { getCronSyncUrl } from "@/env";
import { ensureHourlySyncSchedule } from "@/lib/qstash";

async function main() {
  const schedule = await ensureHourlySyncSchedule();

  console.log("QStash schedule configured:");
  console.log(`  id: ${schedule.scheduleId}`);
  console.log(`  cron: ${schedule.cron}`);
  console.log(`  destination: ${schedule.destination}`);
  console.log(`  (CRON_SYNC_URL / default: ${getCronSyncUrl()})`);
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
