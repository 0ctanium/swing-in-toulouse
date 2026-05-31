import type { Metadata } from "next";

import { publicMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import Content from "./content.md";

export const metadata: Metadata = publicMetadata({
  title: "Politique de confidentialité",
  description: `Politique de confidentialité et cookies du site ${siteConfig.name}, conforme au RGPD.`,
  path: "/confidentialite",
});

export default function ConfidentialitePage() {
  return <Content />;
}
