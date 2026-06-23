import { NextResponse } from "next/server";

import {
  assertEventInDataScope,
  assertOrgScopedApi,
  assertPlatformAdminApi,
  assertSourceInDataScope,
  unauthorizedResponse,
} from "@/lib/admin/auth";
import type { AdminDataScope } from "@/lib/admin/data-scope";

type ApiError = { error: NextResponse };
type ApiDataScope = { dataScope: AdminDataScope };

export async function requirePlatformAdminApi(): Promise<
  ApiError | Record<string, never>
> {
  const error = await assertPlatformAdminApi();

  if (error) {
    return { error };
  }

  return {};
}

export async function requireOrgScopedApi(): Promise<ApiError | ApiDataScope> {
  const result = await assertOrgScopedApi();

  if ("error" in result) {
    return { error: result.error };
  }

  return { dataScope: result.dataScope };
}

export async function requireEventInScope(
  eventId: string,
  dataScope: AdminDataScope,
): Promise<ApiError | Record<string, never>> {
  if (!(await assertEventInDataScope(eventId, dataScope))) {
    return { error: unauthorizedResponse() };
  }

  return {};
}

export async function requireSourceInScope(
  sourceId: string,
  dataScope: AdminDataScope,
): Promise<ApiError | Record<string, never>> {
  if (!(await assertSourceInDataScope(sourceId, dataScope))) {
    return { error: unauthorizedResponse() };
  }

  return {};
}
