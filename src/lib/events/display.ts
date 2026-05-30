import type { IcalStoredData } from "@/lib/ical/types";

export function getGeoMapsUrl(geo: { lat: number; lon: number }) {
  return `https://www.google.com/maps/search/?api=1&query=${geo.lat},${geo.lon}`;
}

export function formatIcalStatus(status: IcalStoredData["icalStatus"]) {
  switch (status) {
    case "TENTATIVE":
      return "Provisoire";
    case "CONFIRMED":
      return "Confirmé";
    case "CANCELLED":
      return "Annulé";
    default:
      return undefined;
  }
}

export function formatTransparency(
  transparency: IcalStoredData["transparency"],
) {
  switch (transparency) {
    case "TRANSPARENT":
      return "Disponible";
    case "OPAQUE":
      return "Occupé";
    default:
      return undefined;
  }
}

export function getIcalOrganizer(icalData: IcalStoredData | null | undefined) {
  const organizer = icalData?.organizer;

  if (!organizer?.name && !organizer?.email) {
    return null;
  }

  return organizer;
}

export function shouldShowIcalOrganizer(
  icalData: IcalStoredData | null | undefined,
  organizationName?: string | null,
) {
  const organizer = getIcalOrganizer(icalData);

  if (!organizer) {
    return false;
  }

  if (!organizationName) {
    return true;
  }

  if (organizer.email && organizer.name !== organizationName) {
    return true;
  }

  return Boolean(organizer.email);
}
