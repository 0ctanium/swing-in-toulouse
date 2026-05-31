import { redirect } from "next/navigation";
import { Suspense } from "react";

import { adminVenuesPendingFilterHref } from "@/lib/venues/admin-venues-params";

async function AdminVenuesConfirmRedirectContent() {
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
