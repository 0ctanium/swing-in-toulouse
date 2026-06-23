import { redirect } from "next/navigation";
import { Suspense } from "react";

import { assertPlatformAdminPage } from "@/lib/admin/access";
import { adminVenuesPendingFilterHref } from "@/lib/venues/admin-venues-params";

async function AdminVenuesConfirmRedirectContent() {
  await assertPlatformAdminPage();
  redirect(adminVenuesPendingFilterHref());
  return null;
}

export default function AdminVenuesConfirmRedirectPage() {
  return (
    <Suspense fallback={null}>
      <AdminVenuesConfirmRedirectContent />
    </Suspense>
  );
}
