import "@/load-env";

import { syncAllSources } from "@/lib/ical/sync";

async function main() {
  for await (const result of syncAllSources()) {
    if (result.error) {
      console.error(
        new Error(`Failed to sync ${result.source.name}`, {
          cause: result.error,
        }),
      );
      continue;
    }

    const organizer = result.source.organization?.name ?? "sans organisateur";
    console.info(
      `✓ ${result.source.name} (${organizer}): ${result.stats?.created ?? 0} created, ${result.stats?.updated ?? 0} updated, ${result.stats?.unchanged ?? 0} unchanged, ${result.stats?.cancelled ?? 0} removed from feed`,
    );
  }
}

main()
  .then(async () => {
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  });
