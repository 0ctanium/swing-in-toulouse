import { redirect } from "next/navigation";

import { adminVenuesPendingFilterHref } from "@/lib/venues/admin-venues-params";

export default function AdminVenuesConfirmRedirectPage() {
  redirect(adminVenuesPendingFilterHref());
}
