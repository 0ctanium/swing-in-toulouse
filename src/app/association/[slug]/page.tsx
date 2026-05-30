import { redirect } from "next/navigation";

type LegacyAssociationPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyAssociationPage({
  params,
}: LegacyAssociationPageProps) {
  const { slug } = await params;
  redirect(`/organisateur/${slug}`);
}
