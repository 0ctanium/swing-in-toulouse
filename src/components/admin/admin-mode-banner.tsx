"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";

import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { useAdminMode } from "@/components/admin/admin-mode-provider";
import { cn } from "@/lib/utils";

export function AdminModeBanner({ className }: { className?: string }) {
  const { isAdminMode } = useAdminMode();

  if (!isAdminMode) {
    return null;
  }

  return (
    <div
      className={cn(
        "border-b border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm">
        <div className="inline-flex items-center gap-2">
          <Settings2 className="size-4 shrink-0" />
          <span>Mode admin actif — corrections visibles sur le site.</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/events"
            className="rounded-md px-2 py-1 font-medium hover:bg-amber-500/15"
          >
            Calendrier admin
          </Link>
          <AdminLogoutButton />
        </div>
      </div>
    </div>
  );
}
