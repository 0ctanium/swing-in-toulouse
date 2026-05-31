import type { Metadata } from "next";

import { OrganizersIndex } from "@/components/organizations/organizers-index";
import { listOrganizers } from "@/lib/events/queries";
import { publicMetadata } from "@/lib/metadata";

export const metadata: Metadata = publicMetadata({
  title: "Organisateurs",
  description:
    "Écoles, associations et organisateurs d'événements swing à Toulouse.",
  path: "/organisateurs",
});

export default async function OrganizersIndexPage() {
  const organizers = await listOrganizers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Organisateurs
        </h1>
        <p className="text-muted-foreground mt-2">
          Toutes les écoles et associations référencées sur Swingin Toulouse.
        </p>
      </div>
      <OrganizersIndex organizers={organizers} />
    </div>
  );
}
