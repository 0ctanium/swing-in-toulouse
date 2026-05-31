export const siteNavItems = [
  { href: "/", label: "Accueil" },
  { href: "/agenda", label: "Agenda" },
  { href: "/evenements", label: "Événements" },
  { href: "/organisateurs", label: "Organisateurs" },
  { href: "/lieux", label: "Lieux" },
  { href: "/#communaute", label: "Communauté" },
] as const;

export const siteNavLinkClassName =
  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export const siteNavMobileLinkClassName = `${siteNavLinkClassName} block w-full max-w-full text-left`;
