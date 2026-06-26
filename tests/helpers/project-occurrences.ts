import { rebuildAllOccurrences } from "@/lib/events/occurrence-projector";

export async function projectIntegrationOccurrences() {
  return rebuildAllOccurrences();
}
