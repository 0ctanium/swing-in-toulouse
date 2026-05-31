import { ArrowUpRight, BarChart3, Cloud, Database, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adminDashboardLinks,
  type AdminDashboardLink,
} from "@/lib/admin/dashboard-links";
import { cn } from "@/lib/utils";

const linkIcons: Record<string, LucideIcon> = {
  PostHog: BarChart3,
  "Google Search Console": Search,
  Neon: Database,
  Vercel: Cloud,
};

function AdminDashboardLinkCard({ link }: { link: AdminDashboardLink }) {
  const Icon = linkIcons[link.label] ?? ArrowUpRight;

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group/link focus-visible:ring-ring flex flex-col gap-3 rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="bg-muted text-muted-foreground inline-flex size-9 items-center justify-center rounded-lg">
          <Icon className="size-4" aria-hidden />
        </span>
        <ArrowUpRight
          className="text-muted-foreground size-4 shrink-0 opacity-0 transition-all group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 group-hover/link:opacity-100 group-focus-visible/link:opacity-100"
          aria-hidden
        />
      </div>
      <div className="min-w-0">
        <p className="font-medium">{link.label}</p>
        <p className="text-muted-foreground mt-1 text-sm leading-snug">
          {link.description}
        </p>
      </div>
    </a>
  );
}

export function AdminDashboardLinks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liens utiles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {adminDashboardLinks.map((link) => (
            <AdminDashboardLinkCard key={link.href} link={link} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
