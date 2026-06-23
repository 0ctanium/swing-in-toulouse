/**
 * Link existing Postgres organizations to Clerk organizations (1-to-1).
 *
 * Prerequisites:
 * - Migration 0008 applied (`pnpm db:push` or run drizzle SQL)
 * - CLERK_SECRET_KEY in .env.local
 * - CLERK_BACKFILL_CREATED_BY_USER_ID = a Clerk user id (instance admin)
 *
 * Run:
 *   pnpm db:backfill-clerk-organizations
 *   pnpm db:backfill-clerk-organizations -- --dry-run
 */
import "@/load-env";

import { isNull, eq } from "drizzle-orm";

import { db } from "@/db";
import { organizations } from "@/db/schema";
import {
  CLERK_DB_ORG_METADATA_KEY,
  createClerkOrganizationForDbOrg,
  getClerkClient,
  getClerkOrgDbOrganizationId,
  listAllClerkOrganizations,
} from "@/lib/organizations/clerk-sync";

type BackfillAction =
  | "linked-existing"
  | "created"
  | "skipped-already-linked"
  | "skipped-conflict"
  | "dry-run-create"
  | "dry-run-link";

type BackfillResult = {
  organizationId: string;
  slug: string;
  name: string;
  action: BackfillAction;
  clerkOrganizationId?: string;
  message?: string;
};

function getCreatedByUserId() {
  const userId = process.env.CLERK_BACKFILL_CREATED_BY_USER_ID?.trim();

  if (!userId) {
    throw new Error(
      "CLERK_BACKFILL_CREATED_BY_USER_ID is required to create new Clerk organizations.",
    );
  }

  return userId;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const clerk = getClerkClient();

  const dbOrganizations = await db.query.organizations.findMany({
    where: isNull(organizations.clerkOrganizationId),
    columns: {
      id: true,
      slug: true,
      name: true,
      clerkOrganizationId: true,
    },
    orderBy: (table, { asc }) => [asc(table.name)],
  });

  if (dbOrganizations.length === 0) {
    console.log("No organizations need backfill.");
    return;
  }

  const clerkOrganizations = await listAllClerkOrganizations(clerk);
  const clerkBySlug = new Map(
    clerkOrganizations.map((organization) => [organization.slug, organization]),
  );

  const results: BackfillResult[] = [];
  let createdBy: string | null = null;

  for (const organization of dbOrganizations) {
    const existingBySlug = clerkBySlug.get(organization.slug);

    if (existingBySlug) {
      const linkedDbId = getClerkOrgDbOrganizationId(existingBySlug);

      if (linkedDbId && linkedDbId !== organization.id) {
        results.push({
          organizationId: organization.id,
          slug: organization.slug,
          name: organization.name,
          action: "skipped-conflict",
          clerkOrganizationId: existingBySlug.id,
          message: `Clerk slug "${organization.slug}" is already linked to ${linkedDbId}.`,
        });
        continue;
      }

      if (dryRun) {
        results.push({
          organizationId: organization.id,
          slug: organization.slug,
          name: organization.name,
          action: "dry-run-link",
          clerkOrganizationId: existingBySlug.id,
        });
        continue;
      }

      if (!linkedDbId) {
        await clerk.organizations.updateOrganization(existingBySlug.id, {
          publicMetadata: {
            ...existingBySlug.publicMetadata,
            [CLERK_DB_ORG_METADATA_KEY]: organization.id,
          },
        });
      }

      await db
        .update(organizations)
        .set({ clerkOrganizationId: existingBySlug.id })
        .where(eq(organizations.id, organization.id));

      results.push({
        organizationId: organization.id,
        slug: organization.slug,
        name: organization.name,
        action: "linked-existing",
        clerkOrganizationId: existingBySlug.id,
      });
      continue;
    }

    if (dryRun) {
      results.push({
        organizationId: organization.id,
        slug: organization.slug,
        name: organization.name,
        action: "dry-run-create",
      });
      continue;
    }

    createdBy ??= getCreatedByUserId();

    const created = await createClerkOrganizationForDbOrg(clerk, {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdBy,
    });

    clerkBySlug.set(created.slug, created);

    await db
      .update(organizations)
      .set({ clerkOrganizationId: created.id })
      .where(eq(organizations.id, organization.id));

    results.push({
      organizationId: organization.id,
      slug: organization.slug,
      name: organization.name,
      action: "created",
      clerkOrganizationId: created.id,
    });
  }

  const summary = results.reduce<Record<BackfillAction, number>>(
    (counts, result) => {
      counts[result.action] = (counts[result.action] ?? 0) + 1;
      return counts;
    },
    {
      "linked-existing": 0,
      created: 0,
      "skipped-already-linked": 0,
      "skipped-conflict": 0,
      "dry-run-create": 0,
      "dry-run-link": 0,
    },
  );

  for (const result of results) {
    const clerkId = result.clerkOrganizationId
      ? ` → ${result.clerkOrganizationId}`
      : "";
    const details = result.message ? ` (${result.message})` : "";
    console.log(
      `[${result.action}] ${result.name} (${result.slug})${clerkId}${details}`,
    );
  }

  console.log("");
  console.log(dryRun ? "Dry run summary:" : "Backfill summary:");
  console.log(summary);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
