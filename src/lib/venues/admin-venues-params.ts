import { parseAsStringLiteral } from "nuqs/server";

export const ADMIN_VENUE_CONFIRMATION_FILTERS = [
  "pending",
  "confirmed",
] as const;

export type AdminVenueConfirmationFilter =
  (typeof ADMIN_VENUE_CONFIRMATION_FILTERS)[number];

export type AdminVenuesQuery = {
  confirmation: AdminVenueConfirmationFilter | null;
};

export const adminVenuesParsers = {
  confirmation: parseAsStringLiteral(ADMIN_VENUE_CONFIRMATION_FILTERS),
};

export const adminVenuesClientParsers = {
  confirmation: parseAsStringLiteral(ADMIN_VENUE_CONFIRMATION_FILTERS),
};

export function hasAdminVenuesFilters(query: AdminVenuesQuery) {
  return query.confirmation !== null;
}

export function adminVenuesPendingFilterHref() {
  return "/admin/venues?confirmation=pending";
}
