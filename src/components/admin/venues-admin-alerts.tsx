import { VenuesMergeAlert } from "@/components/admin/venues-merge-alert";
import { VenuesPendingAlert } from "@/components/admin/venues-pending-alert";
import { VenuesQualityAlert } from "@/components/admin/venues-quality-alert";

type VenuesAdminAlertsProps = {
  pendingConfirmationCount: number;
  activeQualityIssueCount: number;
  similarGroupCount: number;
  locationConflictCount: number;
};

export function VenuesAdminAlerts({
  pendingConfirmationCount,
  activeQualityIssueCount,
  similarGroupCount,
  locationConflictCount,
}: VenuesAdminAlertsProps) {
  if (
    pendingConfirmationCount === 0 &&
    activeQualityIssueCount === 0 &&
    similarGroupCount === 0 &&
    locationConflictCount === 0
  ) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <VenuesMergeAlert
        similarGroupCount={similarGroupCount}
        locationConflictCount={locationConflictCount}
      />
      <VenuesPendingAlert pendingCount={pendingConfirmationCount} />
      <VenuesQualityAlert count={activeQualityIssueCount} linkToConfirm />
    </div>
  );
}
