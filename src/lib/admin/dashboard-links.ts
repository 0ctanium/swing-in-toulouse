export type AdminDashboardLink = {
  label: string;
  description: string;
  href: string;
};

export const adminDashboardLinks: AdminDashboardLink[] = [
  {
    label: "PostHog",
    description: "Analytics, funnels et test A/B hero",
    href: "https://eu.posthog.com/project/190420/home",
  },
  {
    label: "Google Search Console",
    description: "Référencement et performances de recherche",
    href: "https://search.google.com/search-console?resource_id=sc-domain%3Aswing-toulouse.fr",
  },
  {
    label: "Neon",
    description: "Base de données PostgreSQL",
    href: "https://console.neon.tech/app/projects/nameless-bar-14735498?database=neondb&branchId=br-aged-river-alitoxt5",
  },
  {
    label: "Vercel",
    description: "Déploiements, logs et performance",
    href: "https://vercel.com/benjamin-lepas-projects/swing-in-toulouse",
  },
];
