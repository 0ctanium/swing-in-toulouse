"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Show, UserButton } from "@clerk/nextjs";

export function AdminModeBanner({ className }: { className?: string }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith("/admin");

  if (isAdminPage) return null;

  return (
    <Show when="signed-in">
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
              href="/admin"
              className="rounded-md px-2 py-1 font-medium hover:bg-amber-500/15"
            >
              Admin
            </Link>
            <UserButton />
          </div>
        </div>
      </div>
    </Show>
  );
}
