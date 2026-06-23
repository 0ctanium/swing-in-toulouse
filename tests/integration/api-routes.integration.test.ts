import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getCategoryTags } from "@/app/api/admin/category-tags/route";
import { GET as getOrganizations } from "@/app/api/admin/organizations/route";
import { GET as getPlacesAutocomplete } from "@/app/api/admin/places/autocomplete/route";
import { GET as getPlacesDetails } from "@/app/api/admin/places/details/route";
import { POST as postVenues } from "@/app/api/admin/venues/route";
import { GET as getAdminVenues } from "@/app/api/admin/venues/route";
import { POST as postVenueConfirm } from "@/app/api/admin/venues/[id]/confirm/route";
import { POST as postVenueConfirmArea } from "@/app/api/admin/venues/[id]/confirm-area/route";
import { POST as postVenueDuplicates } from "@/app/api/admin/venues/[id]/duplicates/route";
import { POST as postVenueBulkAssign } from "@/app/api/admin/venues/bulk-assign/route";
import { POST as postMergeDismissals } from "@/app/api/admin/venues/merge-dismissals/route";
import { POST as cronSync } from "@/app/api/cron/sync/route";
import { GET as getPublicEvents } from "@/app/api/events/route";
import { GET as getEventFilters } from "@/app/api/events/filters/route";
import { GET as getIcalPayload } from "@/app/api/ical/[payload]/route";
import { GET as getEventIcal } from "@/app/api/ical/evenement/[slug]/route";
import { GET as getOrganizerIcal } from "@/app/api/ical/organisateur/[slug]/route";
import { GET as getMapPhoto } from "@/app/api/maps/photo/route";
import { GET as getMapStatic } from "@/app/api/maps/static/route";
import { GLOBAL_ICAL_PAYLOAD } from "@/lib/ical/payload";

import {
  apiPersonas,
  expectAuthorized,
  expectUnauthorized,
} from "../helpers/api-personas";
import {
  createFormDataPutRequest,
  createJsonPatchRequest,
  createJsonPostRequest,
  createJsonPutRequest,
  createTestRequest,
} from "../helpers/api";
import { seedAuthMatrixFixtures, FIXTURE_IDS } from "../helpers/seed";
import {
  resetIntegrationDb,
  setupIntegrationDb,
} from "../helpers/setup-integration-db";

describe("public API routes", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
    await seedAuthMatrixFixtures(await setupIntegrationDb());
    apiPersonas.anonymous();
  });

  it("GET /api/events validates query parameters", async () => {
    const invalid = await getPublicEvents(
      createTestRequest("/api/events?from=not-a-date&to=also-bad"),
    );
    expect(invalid.status).toBe(400);

    const valid = await getPublicEvents(
      createTestRequest(
        "/api/events?from=2026-06-01T00:00:00.000Z&to=2026-06-30T23:59:59.999Z",
      ),
    );
    expect(valid.status).toBe(200);
  });

  it("GET /api/events/filters returns filter options", async () => {
    const response = await getEventFilters();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("categories");
    expect(body).toHaveProperty("venues");
    expect(body).toHaveProperty("organizations");
  });

  it("GET /api/ical/[payload] serves a calendar feed", async () => {
    const response = await getIcalPayload(createTestRequest("/api/ical/x"), {
      params: Promise.resolve({ payload: GLOBAL_ICAL_PAYLOAD }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/calendar");
  });

  it("GET /api/ical/evenement/[slug] redirects to a filtered feed", async () => {
    const response = await getEventIcal(createTestRequest("/api/ical/evenement/x"), {
      params: Promise.resolve({ slug: "soiree-lindy-a" }),
    });

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
  });

  it("GET /api/ical/organisateur/[slug] redirects to a filtered feed", async () => {
    const response = await getOrganizerIcal(
      createTestRequest("/api/ical/organisateur/x"),
      { params: Promise.resolve({ slug: "swing-club-a" }) },
    );

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
  });

  it("GET /api/maps/* returns 404 when Google Maps is not configured", async () => {
    const envModule = await import("@/env");
    const configuredSpy = vi
      .spyOn(envModule, "isGoogleMapsConfigured")
      .mockReturnValue(false);

    const staticMap = await getMapStatic(
      createTestRequest("/api/maps/static?lat=43.6&lng=1.44"),
    );
    const photo = await getMapPhoto(
      createTestRequest(
        "/api/maps/photo?name=places/ChIJx/photos/abc",
      ),
    );

    expect(staticMap.status).toBe(404);
    expect(photo.status).toBe(404);
    configuredSpy.mockRestore();
  });
});

describe("platform admin API routes", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
    await seedAuthMatrixFixtures(await setupIntegrationDb());
  });

  const platformAdminGetRoutes = [
    {
      name: "GET /api/admin/venues",
      call: () => getAdminVenues(),
    },
    {
      name: "GET /api/admin/organizations",
      call: () => getOrganizations(createTestRequest("/api/admin/organizations")),
    },
    {
      name: "GET /api/admin/category-tags",
      call: () => getCategoryTags(createTestRequest("/api/admin/category-tags")),
    },
    {
      name: "GET /api/admin/places/autocomplete",
      call: () =>
        getPlacesAutocomplete(
          createTestRequest("/api/admin/places/autocomplete?input=toul"),
        ),
    },
    {
      name: "GET /api/admin/places/details",
      call: () =>
        getPlacesDetails(
          createTestRequest("/api/admin/places/details?query=toulouse"),
        ),
    },
  ] as const;

  it.each(platformAdminGetRoutes)(
    "$name rejects anonymous and org members",
    async ({ call }) => {
      apiPersonas.anonymous();
      expectUnauthorized((await call()).status);

      apiPersonas.orgMemberA();
      expectUnauthorized((await call()).status);
    },
  );

  it.each(platformAdminGetRoutes)(
    "$name allows platform admins in personal space",
    async ({ call }) => {
      apiPersonas.platformAdmin();
      expectAuthorized((await call()).status);
    },
  );

  it("POST /api/admin/venues rejects org members", async () => {
    apiPersonas.orgMemberA();
    const response = await postVenues(
      createJsonPostRequest("/api/admin/venues", { name: "Test" }),
    );
    expectUnauthorized(response.status);
  });

  it("POST /api/admin/venues allows platform admins past auth", async () => {
    apiPersonas.platformAdmin();
    const response = await postVenues(
      createJsonPostRequest("/api/admin/venues", {}),
    );
    expectAuthorized(response.status);
    expect(response.status).toBe(400);
  });

  it("venue mutation routes reject org members", async () => {
    const venueId = FIXTURE_IDS.venue;
    apiPersonas.orgMemberA();

    const { PUT: putVenue } = await import("@/app/api/admin/venues/[id]/route");
    const { PATCH: patchOrganization } = await import(
      "@/app/api/admin/organizations/[id]/route"
    );
    const { PATCH: patchCategoryTag } = await import(
      "@/app/api/admin/category-tags/[name]/route"
    );
    const { DELETE: deleteVenueAlias } = await import(
      "@/app/api/admin/venues/[id]/alias/route"
    );

    const routes = [
      postVenueConfirm(
        createJsonPostRequest(`/api/admin/venues/${venueId}/confirm`, {}),
        { params: Promise.resolve({ id: venueId }) },
      ),
      postVenueConfirmArea(
        createJsonPostRequest(`/api/admin/venues/${venueId}/confirm-area`, {}),
        { params: Promise.resolve({ id: venueId }) },
      ),
      postVenueDuplicates(
        createJsonPostRequest(`/api/admin/venues/${venueId}/duplicates`, {}),
        { params: Promise.resolve({ id: venueId }) },
      ),
      postVenueBulkAssign(
        createJsonPostRequest("/api/admin/venues/bulk-assign", {}),
      ),
      postMergeDismissals(
        createJsonPostRequest("/api/admin/venues/merge-dismissals", {}),
      ),
      putVenue(createJsonPutRequest(`/api/admin/venues/${venueId}`, {}), {
        params: Promise.resolve({ id: venueId }),
      }),
      patchOrganization(
        createJsonPatchRequest(`/api/admin/organizations/${FIXTURE_IDS.orgA}`, {}),
        { params: Promise.resolve({ id: FIXTURE_IDS.orgA }) },
      ),
      patchCategoryTag(
        createJsonPatchRequest("/api/admin/category-tags/lindy", {
          subtitle: "Test",
        }),
        { params: Promise.resolve({ name: "lindy" }) },
      ),
      deleteVenueAlias(createTestRequest(`/api/admin/venues/${venueId}/alias`, {
        method: "DELETE",
      }), { params: Promise.resolve({ id: venueId }) }),
    ];

    const responses = await Promise.all(routes);
    for (const response of responses) {
      expectUnauthorized(response.status);
    }
  });

  it("platform admin mutation routes allow platform admins past auth", async () => {
    const venueId = FIXTURE_IDS.venue;
    apiPersonas.platformAdmin();

    const { PUT: putVenue } = await import("@/app/api/admin/venues/[id]/route");
    const { PATCH: patchOrganization } = await import(
      "@/app/api/admin/organizations/[id]/route"
    );
    const { PATCH: patchCategoryTag } = await import(
      "@/app/api/admin/category-tags/[name]/route"
    );
    const { DELETE: deleteVenueAlias } = await import(
      "@/app/api/admin/venues/[id]/alias/route"
    );

    const testDb = await setupIntegrationDb();
    const { eventCategoryTags } = await import("@/db/schema");
    await testDb.db.insert(eventCategoryTags).values({ name: "lindy" });

    const routes = [
      putVenue(
        createJsonPutRequest(`/api/admin/venues/${venueId}`, {
          name: "Le Grand Bal",
        }),
        { params: Promise.resolve({ id: venueId }) },
      ),
      patchOrganization(
        createJsonPatchRequest(`/api/admin/organizations/${FIXTURE_IDS.orgA}`, {
          name: "Swing Club A",
        }),
        { params: Promise.resolve({ id: FIXTURE_IDS.orgA }) },
      ),
      patchCategoryTag(
        createJsonPatchRequest("/api/admin/category-tags/lindy", {
          subtitle: "Hop",
        }),
        { params: Promise.resolve({ name: "lindy" }) },
      ),
      deleteVenueAlias(createTestRequest(`/api/admin/venues/${venueId}/alias`, {
        method: "DELETE",
      }), { params: Promise.resolve({ id: venueId }) }),
    ];

    const responses = await Promise.all(routes);
    for (const response of responses) {
      expectAuthorized(response.status);
    }
  });

  it("admin in organization context cannot access platform admin routes", async () => {
    apiPersonas.adminInOrgA();

    const response = await getAdminVenues();
    expectUnauthorized(response.status);
  });
});

describe("org-scoped API routes", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
    await seedAuthMatrixFixtures(await setupIntegrationDb());
  });

  it("GET /api/admin/sources is scoped to the active organization", async () => {
    const { GET: getSources } = await import("@/app/api/admin/sources/route");

    apiPersonas.anonymous();
    expectUnauthorized((await getSources()).status);

    apiPersonas.orgMemberA();
    const orgAResponse = await getSources();
    expectAuthorized(orgAResponse.status);
    const orgABody = await orgAResponse.json();
    expect(orgABody.sources).toHaveLength(1);
    expect(orgABody.sources[0]?.id).toBe(FIXTURE_IDS.sourceA);
  });

  it("org-scoped event routes reject cross-organization access", async () => {
    const { GET: getOverride } = await import(
      "@/app/api/admin/events/[id]/override/route"
    );
    const { GET: getDuplicate } = await import(
      "@/app/api/admin/events/[id]/duplicate/route"
    );
    const { POST: confirmEvent } = await import(
      "@/app/api/admin/events/[id]/confirm/route"
    );

    apiPersonas.orgMemberA();

    for (const handler of [
      () =>
        getOverride(createTestRequest("/api/admin/events/x/override"), {
          params: Promise.resolve({ id: FIXTURE_IDS.eventB }),
        }),
      () =>
        getDuplicate(createTestRequest("/api/admin/events/x/duplicate"), {
          params: Promise.resolve({ id: FIXTURE_IDS.eventB }),
        }),
      () =>
        confirmEvent(
          createJsonPostRequest(
            `/api/admin/events/${FIXTURE_IDS.eventB}/confirm`,
            {},
          ),
          { params: Promise.resolve({ id: FIXTURE_IDS.eventB }) },
        ),
    ]) {
      expectUnauthorized((await handler()).status);
    }
  });

  it("org-scoped event routes allow access within the organization", async () => {
    const { GET: getOverride } = await import(
      "@/app/api/admin/events/[id]/override/route"
    );
    const { GET: getDuplicate } = await import(
      "@/app/api/admin/events/[id]/duplicate/route"
    );

    apiPersonas.orgMemberA();

    expectAuthorized(
      (
        await getOverride(createTestRequest("/api/admin/events/x/override"), {
          params: Promise.resolve({ id: FIXTURE_IDS.eventA }),
        })
      ).status,
    );
    expectAuthorized(
      (
        await getDuplicate(createTestRequest("/api/admin/events/x/duplicate"), {
          params: Promise.resolve({ id: FIXTURE_IDS.eventA }),
        })
      ).status,
    );
  });

  it("PATCH /api/admin/sources/[id] rejects sources outside the org scope", async () => {
    const { PATCH: patchSource } = await import(
      "@/app/api/admin/sources/[id]/route"
    );

    apiPersonas.orgMemberA();
    const response = await patchSource(
      createJsonPatchRequest(`/api/admin/sources/${FIXTURE_IDS.sourceB}`, {
        name: "Hacked",
      }),
      { params: Promise.resolve({ id: FIXTURE_IDS.sourceB }) },
    );

    expectUnauthorized(response.status);
  });

  it("POST /api/admin/sources/[id]/sync rejects sources outside the org scope", async () => {
    const { POST: syncSource } = await import(
      "@/app/api/admin/sources/[id]/sync/route"
    );

    apiPersonas.orgMemberA();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("x", { status: 404 })),
    );

    const response = await syncSource(
      createTestRequest(`/api/admin/sources/${FIXTURE_IDS.sourceB}/sync`, {
        method: "POST",
      }),
      { params: Promise.resolve({ id: FIXTURE_IDS.sourceB }) },
    );

    expectUnauthorized(response.status);
    vi.unstubAllGlobals();
  });

  it("DELETE /api/admin/sources/[id] rejects sources outside the org scope", async () => {
    const { DELETE: deleteSource } = await import(
      "@/app/api/admin/sources/[id]/route"
    );

    apiPersonas.orgMemberA();
    const response = await deleteSource(
      createTestRequest(`/api/admin/sources/${FIXTURE_IDS.sourceB}`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: FIXTURE_IDS.sourceB }) },
    );

    expectUnauthorized(response.status);
  });

  it("PUT /api/admin/sources/[id]/file rejects sources outside the org scope", async () => {
    const { PUT: putSourceFile } = await import(
      "@/app/api/admin/sources/[id]/file/route"
    );

    apiPersonas.orgMemberA();
    const response = await putSourceFile(
      createFormDataPutRequest(
        `/api/admin/sources/${FIXTURE_IDS.sourceB}/file`,
        new FormData(),
      ),
      { params: Promise.resolve({ id: FIXTURE_IDS.sourceB }) },
    );

    expectUnauthorized(response.status);
  });

  it("PUT /api/admin/events/[id]/duplicate rejects cross-organization canonical links", async () => {
    const { PUT: putDuplicate } = await import(
      "@/app/api/admin/events/[id]/duplicate/route"
    );

    apiPersonas.orgMemberA();
    const response = await putDuplicate(
      createJsonPutRequest(
        `/api/admin/events/${FIXTURE_IDS.eventA}/duplicate`,
        { canonicalEventId: FIXTURE_IDS.eventB },
      ),
      { params: Promise.resolve({ id: FIXTURE_IDS.eventA }) },
    );

    expectUnauthorized(response.status);
  });

  it("DELETE /api/admin/events/[id]/duplicate rejects events outside the org scope", async () => {
    const { DELETE: deleteDuplicate } = await import(
      "@/app/api/admin/events/[id]/duplicate/route"
    );

    apiPersonas.orgMemberA();
    const response = await deleteDuplicate(
      createTestRequest(`/api/admin/events/${FIXTURE_IDS.eventB}/duplicate`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: FIXTURE_IDS.eventB }) },
    );

    expectUnauthorized(response.status);
  });

  it("admin in organization context can access org-scoped routes within their org", async () => {
    const { GET: getSources } = await import("@/app/api/admin/sources/route");

    apiPersonas.adminInOrgA();
    const response = await getSources();
    expectAuthorized(response.status);

    const body = await response.json();
    expect(body.sources).toHaveLength(1);
    expect(body.sources[0]?.id).toBe(FIXTURE_IDS.sourceA);
  });
});

describe("cron API route", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
    await seedAuthMatrixFixtures(await setupIntegrationDb());
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not found", { status: 404 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POST /api/cron/sync runs when QStash verification is bypassed in tests", async () => {
    const response = await cronSync(
      createTestRequest("/api/cron/sync", { method: "POST" }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("syncedAt");
    expect(body).toHaveProperty("results");
  });
});
