import { getAdminDataScopeOrNull } from "@/lib/admin/access";
import { getEventConfirmQueueStats } from "@/lib/events/confirm-queue";

export async function getAdminPendingEventsCount() {
  const dataScope = await getAdminDataScopeOrNull();

  if (!dataScope) {
    return 0;
  }

  const { pendingCount } = await getEventConfirmQueueStats(dataScope);
  return pendingCount;
}
