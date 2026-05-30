"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={logout}>
      Déconnexion
    </Button>
  );
}
