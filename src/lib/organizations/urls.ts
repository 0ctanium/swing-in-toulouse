export function normalizeOrganizationWebsite(
  value: string | null | undefined,
) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(
      trimmed.includes("://") ? trimmed : `https://${trimmed}`,
    );
    return url.toString();
  } catch {
    return trimmed;
  }
}
