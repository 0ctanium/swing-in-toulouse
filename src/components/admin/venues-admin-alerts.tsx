import { VenuesPendingAlert } from "@/components/admin/venues-pending-alert";
import { VenuesQualityAlert } from "@/components/admin/venues-quality-alert";

type VenuesAdminAlertsProps = {
  pendingConfirmationCount: number;
  activeQualityIssueCount: number;
};

export function VenuesAdminAlerts({
  pendingConfirmationCount,
  activeQualityIssueCount,
}: VenuesAdminAlertsProps) {
  if (pendingConfirmationCount === 0 && activeQualityIssueCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <VenuesPendingAlert pendingCount={pendingConfirmationCount} />
      <VenuesQualityAlert count={activeQualityIssueCount} linkToConfirm />
    </div>
  );
}
