import { AdminEventActions } from "@/components/admin/admin-event-actions";
import { canEditEvent } from "@/lib/admin/auth";
import { getEventWithOverrides } from "@/lib/events/overrides";

export async function EventPageAdminSlot({
  masterEventId,
}: {
  masterEventId: string;
}) {
  if (!(await canEditEvent(masterEventId))) {
    return null;
  }

  const overrideInfo = await getEventWithOverrides(masterEventId);
  const overrideCount =
    (overrideInfo?.masterOverride ? 1 : 0) +
    (overrideInfo?.occurrenceOverrides.length ?? 0);

  return (
    <AdminEventActions
      masterEventId={masterEventId}
      admin={{
        masterOverridden: Boolean(overrideInfo?.masterOverride),
        occurrenceOverridden: false,
        overrideCount,
      }}
    />
  );
}
