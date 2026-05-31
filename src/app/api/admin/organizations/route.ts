import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { organizations } from "@/db/schema";
import { assertAdminApi } from "@/lib/admin/auth";
import { invalidatePublicOrganizerCache } from "@/lib/cache/invalidate";
import {
  getSelectableVenueById,
  listAdminOrganizations,
  resolveUniqueOrganizationSlug,
} from "@/lib/organizations/admin";
import { generateOrganizationSlug } from "@/lib/slug";
import {
  normalizeOrganizationWebsite,
  organizationWriteSchema,
} from "@/lib/organizations/schemas";
import { normalizeOrganizationDances } from "@/lib/organizations/dances";
import { normalizeOrganizationSocialLinks } from "@/lib/organizations/social-links";

export async function GET(request: NextRequest) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const organizationsList = await listAdminOrganizations();
  return NextResponse.json({ organizations: organizationsList });
}

export async function POST(request: NextRequest) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const parsed = organizationWriteSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let venueId: string | null = null;

  if (parsed.data.venueId) {
    const venue = await getSelectableVenueById(parsed.data.venueId);

    if (!venue) {
      return NextResponse.json(
        { error: "Lieu introuvable ou non sélectionnable (alias)." },
        { status: 400 },
      );
    }

    venueId = venue.id;
  }

  const baseSlug =
    parsed.data.slug?.trim() || generateOrganizationSlug(parsed.data.name);
  const slug = await resolveUniqueOrganizationSlug(baseSlug);

  const [created] = await db
    .insert(organizations)
    .values({
      name: parsed.data.name.trim(),
      slug,
      description: parsed.data.description?.trim() || null,
      website: normalizeOrganizationWebsite(parsed.data.website),
      category: parsed.data.category ?? null,
      dances: normalizeOrganizationDances(parsed.data.dances) ?? null,
      socialLinks:
        normalizeOrganizationSocialLinks(parsed.data.socialLinks) ?? null,
      venueId,
      isActive: parsed.data.isActive ?? true,
    })
    .returning();

  invalidatePublicOrganizerCache();

  return NextResponse.json({ organization: created }, { status: 201 });
}
