import type { Metadata } from "next";

import { adminSectionRobots } from "@/lib/metadata";

export const metadata: Metadata = adminSectionRobots;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
