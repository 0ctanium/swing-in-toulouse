"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/events", label: "Événements", prefix: "/admin/events" },
  { href: "/admin/venues", label: "Lieux", prefix: "/admin/venues" },
  {
    href: "/admin/organizations",
    label: "Organisateurs",
    prefix: "/admin/organizations",
  },
  { href: "/admin/sources", label: "Sources", prefix: "/admin/sources" },
  { href: "/admin/settings", label: "Réglages", prefix: "/admin/settings" },
] as const;

export function AdminSubNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections admin"
      className="flex flex-wrap gap-1 border-b pb-px"
    >
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.prefix}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
