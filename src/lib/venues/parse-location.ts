import { slugifyText } from "@/lib/slug";

export type ParsedIcalLocation = {
  name: string;
  address: string | null;
  fullLocation: string;
};

/** Split iCal LOCATION into display name + address remainder. */
export function parseIcalLocation(location: string): ParsedIcalLocation {
  const fullLocation = location.trim();

  if (!fullLocation) {
    return { name: "", address: null, fullLocation };
  }

  const commaIndex = fullLocation.indexOf(",");
  if (commaIndex === -1) {
    return {
      name: fullLocation,
      address: null,
      fullLocation,
    };
  }

  const name = fullLocation.slice(0, commaIndex).trim() || fullLocation;
  const address = fullLocation.slice(commaIndex + 1).trim() || null;

  return {
    name,
    address,
    fullLocation,
  };
}

export function venueSlugFromLocation(location: string) {
  const { name } = parseIcalLocation(location);
  return slugifyText(name || location);
}

