import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { organizations } from "@/db/schema";
import { assertAdminApi } from "@/lib/admin/auth";
import { resolveOrganizationVenueId } from "@/lib/organizations/location";
import { organizationCategoryValues } from "@/lib/organizations/categories";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const bodySchema = z.object({
  category: z.enum(organizationCategoryValues).nullable().optional(),
  locationRaw: z.string().nullable().optional(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json());

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

  let venueId = existing.venueId;

  if (parsed.data.locationRaw !== undefined) {
    const locationRaw = parsed.data.locationRaw?.trim() || null;
    venueId = locationRaw ? await resolveOrganizationVenueId(locationRaw) : null;
  }

  const [updated] = await db
    .update(organizations)
    .set({
      ...(parsed.data.category !== undefined
        ? { category: parsed.data.category }
        : {}),
      ...(parsed.data.locationRaw !== undefined
        ? {
            locationRaw: parsed.data.locationRaw?.trim() || null,
            venueId,
          }
        : {}),
    })
    .where(eq(organizations.id, id))
    .returning();

  return NextResponse.json({ organization: updated });
}
