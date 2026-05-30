import type { Metadata } from "next";

import { adminMetadata } from "@/lib/metadata";

export const metadata: Metadata = adminMetadata({
  title: "Administration",
  description: "Tableau de bord admin Swing in Toulouse.",
});

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-3xl font-semibold">Administration</h1>
      <p className="text-muted-foreground max-w-2xl">
        Le tableau de bord (statistiques et indicateurs) sera ajouté ici.
      </p>
    </div>
  );
}
