import type { Metadata } from "next";

import { adminMetadata } from "@/lib/metadata";

export const metadata: Metadata = adminMetadata({
  title: "Connexion",
  description: "Connexion à l’interface d’administration.",
});

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
