import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { events, sources } from "@/db/schema";
import {
  getAdminAccessScope,
  getAdminDataScopeOrNull,
  type AdminAccessScope,
} from "@/lib/admin/access";
import {
  type AdminDataScope,
  matchesOrganizationScope,
  resolveAdminDataScope,
} from "@/lib/admin/data-scope";
import { isPlatformAdmin } from "@/lib/admin/roles";

export async function isAuthenticated() {
  const scope = await getAdminAccessScope();
  return scope && scope.userId !== null;
}

/** Platform admin in personal space (no active org). */
export async function isAdminAuthenticated() {
  return isPlatformAdmin();
}

/** User can edit events inline on the public site (platform admin or org member). */
export async function hasInlineEventEditAccess() {
  const dataScope = await getAdminDataScopeOrNull();
  return dataScope !== null;
}

export async function canEditEvent(eventId: string) {
  const dataScope = await getAdminDataScopeOrNull();

  if (!dataScope) {
    return false;
  }

  return assertEventInDataScope(eventId, dataScope);
}

export function isEventInInlineEditScope(
  dataScope: AdminDataScope,
  organizationId: string | null | undefined,
) {
  return matchesOrganizationScope(dataScope, organizationId);
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("UNAUTHORIZED");
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
}

export async function assertPlatformAdminApi() {
  if (!(await isAdminAuthenticated())) {
    return unauthorizedResponse();
  }

  return null;
}

type OrgScopedApiResult =
  | { error: NextResponse }
  | { dataScope: AdminDataScope; accessScope: AdminAccessScope };

export async function assertOrgScopedApi(): Promise<OrgScopedApiResult> {
  const accessScope = await getAdminAccessScope();

  if (!accessScope?.userId) {
    return { error: unauthorizedResponse() };
  }

  const dataScope = resolveAdminDataScope(accessScope);

  if (dataScope.mode === "none") {
    return { error: unauthorizedResponse() };
  }

  return { dataScope, accessScope };
}

export async function getEventOrganizationId(eventId: string) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    columns: { organizationId: true },
  });

  return event?.organizationId ?? null;
}

export async function getSourceOrganizationId(sourceId: string) {
  const source = await db.query.sources.findFirst({
    where: eq(sources.id, sourceId),
    columns: { organizationId: true },
  });

  return source?.organizationId ?? null;
}

export async function assertEventInDataScope(
  eventId: string,
  dataScope: AdminDataScope,
) {
  if (dataScope.mode === "all") {
    return true;
  }

  const organizationId = await getEventOrganizationId(eventId);
  return organizationId === dataScope.organizationId;
}

export async function assertSourceInDataScope(
  sourceId: string,
  dataScope: AdminDataScope,
) {
  if (dataScope.mode === "all") {
    return true;
  }

  const organizationId = await getSourceOrganizationId(sourceId);
  return organizationId === dataScope.organizationId;
}

/** @deprecated Use assertPlatformAdminApi() or assertOrgScopedApi() */
export async function assertAdminApi() {
  return assertPlatformAdminApi();
}
