"use client";

import { useClerk } from "@clerk/nextjs";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const { signOut } = useClerk();
  const [isPending, setIsPending] = useState(false);

  return (
    <Button
      variant="outline"
      onClick={() => {
        setIsPending(true);
        void signOut({ redirectUrl: "/admin/login" });
      }}
      disabled={isPending}
    >
      {isPending ? "Déconnexion…" : "Déconnexion"}
    </Button>
  );
}
