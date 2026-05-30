import { format } from "date-fns";
import { fr } from "date-fns/locale";
import slugify from "slugify";

const slugifyOptions = {
  lower: true,
  strict: true,
  locale: "fr" as const,
};

export function slugifyText(value: string) {
  return slugify(value, slugifyOptions);
}

export function generateEventSlug(title: string, startAt: Date) {
  const datePart = format(startAt, "d-MMMM-yyyy", { locale: fr });
  return slugifyText(`${title} ${datePart}`);
}

export function generateVenueSlug(name: string) {
  return slugifyText(name);
}

export function generateOrganizationSlug(name: string) {
  return slugifyText(name);
}

export function generateSourceSlug(name: string) {
  return slugifyText(name);
}
