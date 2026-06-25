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
    label: "Google Cloud Console",
    description: "Gestion des ressources Google Cloud",
    href: "https://console.cloud.google.com/home/dashboard?project=swing-in-toulouse",
  },
  {
    label: "Clerk",
    description: "Gestion des utilisateurs et des permissions",
    href: "https://dashboard.clerk.com/apps/app_3FUDe25DdYqWhDHc3PjG3ZDAmpU/instances/ins_3FUDdyuXx4OWhkJx5hPkEle86C9",
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
