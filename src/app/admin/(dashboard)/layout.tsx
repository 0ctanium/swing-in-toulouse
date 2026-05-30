import { redirect } from "next/navigation";

import { isAdminConfigured } from "@/env";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAdminConfigured()) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-10">
        <h1 className="font-heading text-2xl font-semibold">Administration</h1>
        <p className="text-muted-foreground">
          Définissez <code>ADMIN_SECRET</code> dans votre fichier{" "}
          <code>.env.local</code> pour activer l&apos;interface admin.
        </p>
      </div>
    );
  }

  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-4">
      {children}
    </div>
  );
}
