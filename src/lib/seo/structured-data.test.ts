import { describe, expect, it } from "vitest";

import {
  archiveBreadcrumbs,
  danceBreadcrumbs,
  danceIndexBreadcrumbs,
  eventBreadcrumbs,
  eventStructuredData,
  organizationStructuredData,
  organizerBreadcrumbs,
  placeStructuredData,
  siteWebSiteJsonLd,
  venueBreadcrumbs,
} from "@/lib/seo/structured-data";

describe("eventStructuredData", () => {
  it("builds schema.org Event JSON-LD", () => {
    const data = eventStructuredData({
      title: "Soirée Lindy",
      description: "Bal swing",
      startAt: new Date("2026-06-20T18:00:00.000Z"),
      endAt: new Date("2026-06-20T21:00:00.000Z"),
      slug: "soiree-lindy",
      sourceUrl: "https://example.com/event",
      organization: {
        id: "org-1",
        slug: "swing-club",
        name: "Swing Club",
      } as never,
      venue: {
        id: "venue-1",
        slug: "le-grand-bal",
        name: "Le Grand Bal",
        address: "12 rue du Swing",
        city: "Toulouse",
        formattedAddress: null,
        addressConfirmedAt: null,
        latitude: null,
        longitude: null,
        locationKind: "place",
      } as never,
      locationRaw: null,
      status: "published",
      offers: null,
    });

    expect(data["@type"]).toBe("Event");
    expect(data.name).toBe("Soirée Lindy");
    expect(data.url).toContain("/evenement/soiree-lindy");
    expect(data.location).toEqual(
      expect.objectContaining({
        "@type": "Place",
        name: "Le Grand Bal",
      }),
    );
    expect(data.organizer).toEqual(
      expect.objectContaining({
        "@type": "Organization",
        name: "Swing Club",
      }),
    );
  });

  it("marks cancelled events in schema.org vocabulary", () => {
    const data = eventStructuredData({
      title: "Annulé",
      description: null,
      startAt: new Date("2026-06-20T18:00:00.000Z"),
      endAt: null,
      slug: "annule",
      sourceUrl: null,
      organization: null,
      venue: null,
      locationRaw: "Toulouse",
      status: "cancelled",
      offers: null,
    });

    expect(data.eventStatus).toBe("https://schema.org/EventCancelled");
    expect(data.location).toEqual({
      "@type": "Place",
      name: "Toulouse",
    });
  });

  it("includes schema.org Offer JSON-LD for priced events", () => {
    const data = eventStructuredData({
      title: "Workshop",
      description: null,
      startAt: new Date("2026-06-20T18:00:00.000Z"),
      endAt: null,
      slug: "workshop",
      sourceUrl: "https://example.com/book",
      organization: null,
      venue: null,
      locationRaw: null,
      status: "published",
      offers: [
        { label: "Atelier 1h", price: 75, currency: "EUR" },
        { label: "Atelier 2h", price: 100, currency: "EUR" },
      ],
    });

    expect(data.offers).toEqual([
      expect.objectContaining({
        "@type": "Offer",
        name: "Atelier 1h",
        price: "75",
        priceCurrency: "EUR",
      }),
      expect.objectContaining({
        "@type": "Offer",
        name: "Atelier 2h",
        price: "100",
      }),
    ]);
    const offerList = Array.isArray(data.offers) ? data.offers : [data.offers];
    expect(offerList.every((offer) => !("availability" in offer))).toBe(true);
    expect(offerList.every((offer) => !("url" in offer))).toBe(true);
  });

  it("omits offers when unset", () => {
    const data = eventStructuredData({
      title: "Soirée",
      description: null,
      startAt: new Date("2026-06-20T18:00:00.000Z"),
      endAt: null,
      slug: "soiree",
      sourceUrl: null,
      organization: null,
      venue: null,
      locationRaw: null,
      status: "published",
      offers: null,
    });

    expect(data.offers).toBeUndefined();
  });
});

describe("organizationStructuredData", () => {
  it("builds schema.org Organization JSON-LD", () => {
    const data = organizationStructuredData({
      name: "Swing Club",
      slug: "swing-club",
      description: "École de danse",
      website: "https://swing-club.example",
    } as never);

    expect(data["@type"]).toBe("Organization");
    expect(data.url).toContain("/organisateur/swing-club");
  });
});

describe("placeStructuredData", () => {
  it("builds schema.org Place JSON-LD", () => {
    const data = placeStructuredData({
      name: "Le Grand Bal",
      slug: "le-grand-bal",
      address: "12 rue du Swing",
      city: "Toulouse",
      formattedAddress: null,
      addressConfirmedAt: null,
      latitude: null,
      longitude: null,
      googlePlaceId: null,
    } as never);

    expect(data["@type"]).toBe("Place");
    expect(data.url).toContain("/lieu/le-grand-bal");
  });
});

describe("siteWebSiteJsonLd", () => {
  it("builds website JSON-LD from site config", () => {
    const data = siteWebSiteJsonLd();

    expect(data["@type"]).toBe("WebSite");
    expect(data.url).toContain("http://localhost:3000");
  });
});

describe("breadcrumbs", () => {
  it("builds navigation breadcrumbs for entities", () => {
    expect(eventBreadcrumbs({ title: "Soirée", slug: "soiree" })).toEqual([
      { label: "Accueil", href: "/" },
      { label: "Événements", href: "/evenements" },
      { label: "Soirée" },
    ]);
    expect(organizerBreadcrumbs({ name: "Club", slug: "club" })).toHaveLength(3);
    expect(venueBreadcrumbs({ name: "Bal", slug: "bal" })).toHaveLength(3);
    expect(archiveBreadcrumbs(2026, 6, "Juin 2026")).toEqual([
      { label: "Accueil", href: "/" },
      { label: "Événements", href: "/evenements" },
      { label: "Juin 2026", href: "/evenements/2026/06" },
    ]);
    expect(danceIndexBreadcrumbs()).toEqual([
      { label: "Accueil", href: "/" },
      { label: "Danses" },
    ]);
    expect(danceBreadcrumbs({ name: "Lindy Hop", slug: "lindy-hop" })).toHaveLength(3);
  });
});
