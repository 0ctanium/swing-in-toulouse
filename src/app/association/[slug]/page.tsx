import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { publicMetadata } from "@/lib/metadata";

type LegacyAssociationPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: LegacyAssociationPageProps): Promise<Metadata> {
  const { slug } = await params;

  return publicMetadata({
    title: "Organisateur",
    description: `Redirection vers la page organisateur pour ${slug}.`,
    path: `/organisateur/${slug}`,
  });
}

export default async function LegacyAssociationPage({
  params,
}: LegacyAssociationPageProps) {
  const { slug } = await params;
  redirect(`/organisateur/${slug}`);
}
