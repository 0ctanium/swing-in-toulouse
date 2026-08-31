import type { Metadata } from "next";

import { publicMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import Content from "./content.md";

export const metadata: Metadata = publicMetadata({
  title: "Mentions légales",
  description: `Mentions légales du site ${siteConfig.name}.`,
  path: "/mentions-legales",
});

export default function MentionsLegalesPage() {
  return <Content />;
}
