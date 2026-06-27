import { z } from "zod";

export const EVENT_OFFER_CURRENCY = "EUR" as const;
export const DEFAULT_OFFER_LABEL = "Entrée";

export const eventOfferSchema = z.object({
  label: z.string().min(1),
  price: z.number().nonnegative(),
  currency: z.literal("EUR").default("EUR"),
});

export type EventOffer = z.infer<typeof eventOfferSchema>;

export type EventOffersMode = "unset" | "free" | "single" | "multiple";

export type EventOfferDraft = {
  label: string;
  price: string;
};

export function createEmptyOfferDraft(
  label = DEFAULT_OFFER_LABEL,
): EventOfferDraft {
  return { label, price: "" };
}

export function normalizeOffers(
  offers: EventOffer[] | null | undefined,
): EventOffer[] | null {
  if (offers == null) {
    return null;
  }

  return offers.map((offer) => ({
    label: offer.label.trim(),
    price: offer.price,
    currency: EVENT_OFFER_CURRENCY,
  }));
}

export function offersEqual(
  left: EventOffer[] | null | undefined,
  right: EventOffer[] | null | undefined,
) {
  return (
    JSON.stringify(normalizeOffers(left)) === JSON.stringify(normalizeOffers(right))
  );
}

export function resolveOffersMode(
  offers: EventOffer[] | null | undefined,
): EventOffersMode {
  if (offers == null) {
    return "unset";
  }

  if (offers.length === 1 && offers[0]?.price === 0) {
    return "free";
  }

  if (offers.length === 1) {
    return "single";
  }

  return "multiple";
}

export function offersToDrafts(offers: EventOffer[] | null | undefined) {
  if (!offers?.length) {
    return [createEmptyOfferDraft()];
  }

  return offers.map((offer) => ({
    label: offer.label,
    price: String(offer.price),
  }));
}

export function resolveEffectiveOffers(
  patchOffers: EventOffer[] | null | undefined,
  syncedOffers: EventOffer[] | null | undefined,
): EventOffer[] | null {
  if (patchOffers !== undefined) {
    return patchOffers;
  }

  return syncedOffers ?? null;
}

export function resolveOffersFormState(options: {
  currentPatchOffers: EventOffer[] | null | undefined;
  syncedOffers: EventOffer[] | null | undefined;
}) {
  const effective = resolveEffectiveOffers(
    options.currentPatchOffers,
    options.syncedOffers,
  );

  return {
    mode: resolveOffersMode(effective),
    rows: offersToDrafts(effective),
  };
}

export function parseOfferDrafts(
  mode: EventOffersMode,
  rows: EventOfferDraft[],
): EventOffer[] | null {
  if (mode === "unset") {
    return null;
  }

  if (mode === "free") {
    return [{ label: DEFAULT_OFFER_LABEL, price: 0, currency: EVENT_OFFER_CURRENCY }];
  }

  const parsed = rows
    .map((row) => {
      const label = row.label.trim() || DEFAULT_OFFER_LABEL;
      const price = Number.parseFloat(row.price.replace(",", "."));

      if (!Number.isFinite(price) || price < 0) {
        return null;
      }

      return {
        label,
        price,
        currency: EVENT_OFFER_CURRENCY,
      } satisfies EventOffer;
    })
    .filter((offer): offer is EventOffer => offer != null);

  if (parsed.length === 0) {
    return null;
  }

  return parsed;
}

export function buildOffersOverridePatch(options: {
  mode: EventOffersMode;
  rows: EventOfferDraft[];
  syncedOffers: EventOffer[] | null;
  currentPatchOffers: EventOffer[] | null | undefined;
}) {
  if (options.mode === "unset") {
    if (options.currentPatchOffers !== undefined) {
      return { offers: null } as const;
    }

    return {};
  }

  const offers = parseOfferDrafts(options.mode, options.rows);

  if (offers == null) {
    return {};
  }

  if (offersEqual(offers, options.syncedOffers)) {
    return {};
  }

  return { offers } as const;
}
