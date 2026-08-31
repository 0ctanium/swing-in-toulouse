import { siteConfig } from "@/lib/site";

export function normalizeRequestHost(host: string | null | undefined) {
  return host?.split(":")[0]?.toLowerCase().replace(/\.$/, "") ?? null;
}

export function isPrimaryOrLocalHost(host: string | null | undefined) {
  const normalizedHost = normalizeRequestHost(host);

  if (!normalizedHost) {
    return true;
  }

  const primaryHost = new URL(siteConfig.url).hostname.toLowerCase();

  return (
    normalizedHost === primaryHost ||
    normalizedHost === "localhost" ||
    normalizedHost.endsWith(".localhost")
  );
}
