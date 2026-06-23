"use client";

import { useAuth } from "@clerk/nextjs";

export type ProtectProps = React.PropsWithChildren<{
  fallback?: React.ReactNode;
  treatPendingAsSignedOut?: boolean;
  ignoreOrg?: boolean;
}>;

/** Platform admin in personal space only — hidden when an org is active. */
export function Protect({
  children,
  fallback,
  treatPendingAsSignedOut = true,
  ignoreOrg = false,
}: ProtectProps) {
  const { isLoaded, userId, orgId, sessionClaims } = useAuth({
    treatPendingAsSignedOut,
  });

  if (!isLoaded) {
    return null;
  }

  const unauthorized = fallback ?? null;

  if (!userId) {
    return unauthorized;
  }

  if (ignoreOrg) {
    const isPlatformAdmin = sessionClaims?.metadata?.role === "admin";

    if (!isPlatformAdmin) {
      return unauthorized;
    }
  } else {
    const isPlatformAdmin = sessionClaims?.metadata?.role === "admin" && !orgId;

    if (!isPlatformAdmin) {
      return unauthorized;
    }
  }

  return children;
}
