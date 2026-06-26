import "@/load-env";

import {
  pruneProjectedOccurrencesOutsideWindow,
  rebuildAllOccurrences,
} from "@/lib/events/occurrence-projector";
import { getProjectionWindow } from "@/lib/events/projection-window";

async function main() {
  const window = getProjectionWindow();
  const count = await rebuildAllOccurrences(window);
  await pruneProjectedOccurrencesOutsideWindow(window);

  console.info(`Projected ${count} occurrence rows.`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
