export const siteNavItems = [
  { href: "/", label: "Accueil" },
  { href: "/agenda", label: "Agenda" },
  { href: "/#communaute", label: "Communauté" },
  { href: "/#ecoles", label: "Écoles" },
] as const;

export const siteNavLinkClassName =
  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export const siteNavMobileLinkClassName = `${siteNavLinkClassName} block w-full max-w-full text-left`;

export const siteNavAdminLinkClassName =
  "rounded-lg bg-amber-500/15 px-3 py-2 text-sm font-medium text-amber-950 hover:bg-amber-500/25 dark:text-amber-100";
