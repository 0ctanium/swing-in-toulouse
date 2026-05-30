"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";

import { useAdminMode } from "@/components/admin/admin-mode-provider";
import { Badge } from "@/components/ui/badge";
import type { AdminEventMeta } from "@/lib/events/admin-meta";
import { cn } from "@/lib/utils";

type AdminEventActionsProps = {
  masterEventId: string;
  admin?: AdminEventMeta;
  className?: string;
  compact?: boolean;
};

export function AdminEventActions({
  masterEventId,
  admin,
  className,
  compact = false,
}: AdminEventActionsProps) {
  const { isAdminMode } = useAdminMode();

  if (!isAdminMode) {
    return null;
  }

  const hasOverrides = (admin?.overrideCount ?? 0) > 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        compact ? "text-xs" : "text-sm",
        className,
      )}
    >
      <Link
        href={`/admin/events/${masterEventId}`}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 font-medium text-amber-950 hover:bg-amber-500/20 dark:text-amber-100",
          compact && "px-1.5 py-0.5",
        )}
      >
        <Pencil className={compact ? "size-3" : "size-3.5"} />
        Corriger
      </Link>
      {hasOverrides ? (
        <Badge variant="outline" className="border-amber-500/40 text-[10px]">
          {admin?.overrideCount} override{admin && admin.overrideCount > 1 ? "s" : ""}
        </Badge>
      ) : null}
      {admin?.occurrenceOverridden ? (
        <Badge variant="outline" className="border-amber-500/40 text-[10px]">
          occurrence
        </Badge>
      ) : null}
      {admin?.masterOverridden ? (
        <Badge variant="outline" className="border-amber-500/40 text-[10px]">
          série
        </Badge>
      ) : null}
    </div>
  );
}
