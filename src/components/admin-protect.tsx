"use client";
import { useAuth } from "@clerk/nextjs";

export type ProtectProps = React.PropsWithChildren<{
  fallback?: React.ReactNode;

  /**
   * Indicates whether pending sessions are considered as signed out or not.
   *
   * @default true
   */
  treatPendingAsSignedOut?: boolean;
}>;

export function Protect({
  children,
  fallback,
  treatPendingAsSignedOut = true,
}: ProtectProps) {
  const { isLoaded, userId, sessionClaims } = useAuth({
    treatPendingAsSignedOut,
  });

  if (!isLoaded) {
    return null;
  }

  const authorized = children;
  const unauthorized = fallback ?? null;

  if (!userId) {
    return unauthorized;
  }

  if (sessionClaims.metadata.role !== "admin") {
    return unauthorized;
  }

  return authorized;
}
