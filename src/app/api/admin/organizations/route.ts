import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { assertPlatformAdminApi } from "@/lib/admin/auth";
import { invalidatePublicOrganizerCache } from "@/lib/cache/invalidate";
import {
  createClerkOrganizationForDbOrg,
  getClerkClient,
} from "@/lib/organizations/clerk-sync";
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
  const authError = await assertPlatformAdminApi();
  if (authError) {
    return authError;
  }

  const organizationsList = await listAdminOrganizations();
  return NextResponse.json({ organizations: organizationsList });
}

export async function POST(request: NextRequest) {
  const authError = await assertPlatformAdminApi();
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

  const { userId } = await auth();

  if (!userId) {
    await db.delete(organizations).where(eq(organizations.id, created.id));
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const clerk = getClerkClient();
    const clerkOrganization = await createClerkOrganizationForDbOrg(clerk, {
      id: created.id,
      name: created.name,
      slug: created.slug,
      createdBy: userId,
    });

    const [linked] = await db
      .update(organizations)
      .set({ clerkOrganizationId: clerkOrganization.id })
      .where(eq(organizations.id, created.id))
      .returning();

    invalidatePublicOrganizerCache();

    return NextResponse.json({ organization: linked }, { status: 201 });
  } catch (error) {
    await db.delete(organizations).where(eq(organizations.id, created.id));

    const message =
      error instanceof Error
        ? error.message
        : "Création de l'organisation Clerk impossible.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
