import { createClerkClient, type Organization } from "@clerk/backend";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { organizations } from "@/db/schema";
import { env } from "@/env";

export const CLERK_DB_ORG_METADATA_KEY = "dbOrganizationId";

export type ClerkClient = ReturnType<typeof createClerkClient>;

export function getClerkClient() {
  return createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
}

export async function listAllClerkOrganizations(
  clerk: ClerkClient,
): Promise<Organization[]> {
  const organizations: Organization[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, totalCount } = await clerk.organizations.getOrganizationList({
      limit,
      offset,
    });

    organizations.push(...data);

    if (organizations.length >= totalCount || data.length === 0) {
      break;
    }

    offset += data.length;
  }

  return organizations;
}

export function getClerkOrgDbOrganizationId(org: Organization) {
  const metadata = org.publicMetadata as Record<string, unknown> | undefined;
  const value = metadata?.[CLERK_DB_ORG_METADATA_KEY];

  return typeof value === "string" ? value : null;
}

export async function createClerkOrganizationForDbOrg(
  clerk: ClerkClient,
  input: {
    id: string;
    name: string;
    slug: string;
    createdBy: string;
  },
) {
  return clerk.organizations.createOrganization({
    name: input.name,
    slug: input.slug,
    createdBy: input.createdBy,
    publicMetadata: {
      [CLERK_DB_ORG_METADATA_KEY]: input.id,
    },
  });
}

export async function getOrganizationByClerkOrganizationId(
  clerkOrganizationId: string,
) {
  return db.query.organizations.findFirst({
    where: eq(organizations.clerkOrganizationId, clerkOrganizationId),
  });
}
