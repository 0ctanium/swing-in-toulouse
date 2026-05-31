import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { organizations } from "@/db/schema";
import { assertAdminApi } from "@/lib/admin/auth";
import {
  getSelectableVenueById,
  resolveUniqueOrganizationSlug,
} from "@/lib/organizations/admin";
import {
  normalizeOrganizationWebsite,
  organizationPatchSchema,
} from "@/lib/organizations/schemas";
import { normalizeOrganizationDances } from "@/lib/organizations/dances";
import { normalizeOrganizationSocialLinks } from "@/lib/organizations/social-links";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const { id } = await context.params;
  const parsed = organizationPatchSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await db.query.organizations.findFirst({
    where: eq(organizations.id, id),
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Organisateur introuvable." },
      { status: 404 },
    );
  }

  if (parsed.data.venueId) {
    const venue = await getSelectableVenueById(parsed.data.venueId);

    if (!venue) {
      return NextResponse.json(
        { error: "Lieu introuvable ou non sélectionnable (alias)." },
        { status: 400 },
      );
    }
  }

  let slug = existing.slug;

  if (parsed.data.slug !== undefined) {
    slug = await resolveUniqueOrganizationSlug(parsed.data.slug.trim(), id);
  }

  const [updated] = await db
    .update(organizations)
    .set({
      ...(parsed.data.name !== undefined
        ? { name: parsed.data.name.trim() }
        : {}),
      ...(parsed.data.slug !== undefined ? { slug } : {}),
      ...(parsed.data.description !== undefined
        ? { description: parsed.data.description?.trim() || null }
        : {}),
      ...(parsed.data.website !== undefined
        ? { website: normalizeOrganizationWebsite(parsed.data.website) }
        : {}),
      ...(parsed.data.category !== undefined
        ? { category: parsed.data.category }
        : {}),
      ...(parsed.data.dances !== undefined
        ? { dances: normalizeOrganizationDances(parsed.data.dances) }
        : {}),
      ...(parsed.data.socialLinks !== undefined
        ? {
            socialLinks: normalizeOrganizationSocialLinks(
              parsed.data.socialLinks,
            ),
          }
        : {}),
      ...(parsed.data.venueId !== undefined
        ? { venueId: parsed.data.venueId }
        : {}),
      ...(parsed.data.isActive !== undefined
        ? { isActive: parsed.data.isActive }
        : {}),
    })
    .where(eq(organizations.id, id))
    .returning();

  return NextResponse.json({ organization: updated });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const { id } = await context.params;

  const existing = await db.query.organizations.findFirst({
    where: eq(organizations.id, id),
    columns: { id: true, name: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Organisateur introuvable." },
      { status: 404 },
    );
  }

  await db.delete(organizations).where(eq(organizations.id, id));

  return NextResponse.json({ success: true });
}
