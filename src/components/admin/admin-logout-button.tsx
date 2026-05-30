"use client";

import { useAdminLogout } from "@/lib/admin/use-auth";
import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const logout = useAdminLogout();

  return (
    <Button
      variant="outline"
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
    >
      {logout.isPending ? "Déconnexion…" : "Déconnexion"}
    </Button>
  );
}
