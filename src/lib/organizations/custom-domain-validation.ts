import { siteConfig } from "@/lib/site";

export type NormalizeCustomDomainOptions = {
  primaryHost?: string;
};

export function normalizeCustomDomain(
  value: string,
  options: NormalizeCustomDomainOptions = {},
) {
  const raw = value.trim().toLowerCase();

  if (!raw) {
    throw new Error("Le domaine est requis.");
  }

  if (raw.includes("://") || raw.includes("/") || raw.includes("?")) {
    throw new Error("Indiquez uniquement le nom de domaine, sans protocole ni chemin.");
  }

  const domain = raw.replace(/\.$/, "").replace(/^www\./, "");
  const primaryHost =
    options.primaryHost ?? new URL(siteConfig.url).hostname.toLowerCase();

  if (domain === primaryHost || domain.endsWith(`.${primaryHost}`)) {
    throw new Error("Ce domaine est réservé au site principal.");
  }

  if (domain === "vercel.app" || domain.endsWith(".vercel.app")) {
    throw new Error("Les domaines vercel.app ne sont pas acceptés.");
  }

  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) {
    throw new Error("Domaine invalide.");
  }

  return domain;
}
