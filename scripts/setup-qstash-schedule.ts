import "@/load-env";

import { getCronProjectOccurrencesUrl, getCronSyncUrl } from "@/env";
import {
  ensureDailyProjectOccurrencesSchedule,
  ensureHourlySyncSchedule,
} from "@/lib/qstash";

async function main() {
  const syncSchedule = await ensureHourlySyncSchedule();
  const projectionSchedule = await ensureDailyProjectOccurrencesSchedule();

  console.info("QStash schedules configured:");
  console.info("");
  console.info("Hourly iCal sync:");
  console.info(`  id: ${syncSchedule.scheduleId}`);
  console.info(`  cron: ${syncSchedule.cron}`);
  console.info(`  destination: ${syncSchedule.destination}`);
  console.info(`  (CRON_SYNC_URL / default: ${getCronSyncUrl()})`);
  console.info("");
  console.info("Daily occurrence projection:");
  console.info(`  id: ${projectionSchedule.scheduleId}`);
  console.info(`  cron: ${projectionSchedule.cron}`);
  console.info(`  destination: ${projectionSchedule.destination}`);
  console.info(
    `  (CRON_PROJECT_OCCURRENCES_URL / default: ${getCronProjectOccurrencesUrl()})`,
  );
}

main()
  .then(async () => {
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  });
