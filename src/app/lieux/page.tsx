import type { Metadata } from "next";

import { VenuesIndex } from "@/components/venues/venues-index";
import { listVenues } from "@/lib/events/queries";
import { publicMetadata } from "@/lib/metadata";

export const metadata: Metadata = publicMetadata({
  title: "Lieux",
  description:
    "Salles, bars et lieux accueillant des événements swing à Toulouse.",
  path: "/lieux",
});

export default async function VenuesIndexPage() {
  const venues = await listVenues();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Lieux
        </h1>
        <p className="text-muted-foreground mt-2">
          Tous les lieux où se déroulent des événements swing à Toulouse.
        </p>
      </div>
      <VenuesIndex venues={venues} />
    </div>
  );
}
