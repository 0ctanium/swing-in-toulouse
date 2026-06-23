import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminDashboardStats } from "@/lib/admin/dashboard-stats";
import { adminVenuesPendingFilterHref } from "@/lib/venues/admin-venues-params";
import { cn } from "@/lib/utils";
import { Protect } from "../admin-protect";

type StatCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  href?: string;
  variant?: "default" | "warning" | "muted";
  protect?: boolean;
};

function StatCard({
  label,
  value,
  detail,
  href,
  variant = "default",
  protect = false,
}: StatCardProps) {
  let content = (
    <>
      <p
        className={cn(
          "font-heading text-3xl font-semibold tabular-nums tracking-tight",
          variant === "warning" && "text-amber-700 dark:text-amber-300",
          variant === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </p>
      <p className="font-medium">{label}</p>
      {detail ? (
        <p className="text-muted-foreground text-sm leading-snug">{detail}</p>
      ) : null}
    </>
  );

  if (!href) {
    content = (
      <div className="flex flex-col gap-1 rounded-xl bg-muted/30 p-4 ring-1 ring-foreground/10">
        {content}
      </div>
    );
  } else {
    content = (
      <Link
        href={href}
        className="hover:bg-muted/40 focus-visible:ring-ring flex flex-col gap-1 rounded-xl bg-muted/30 p-4 ring-1 ring-foreground/10 outline-none transition-colors focus-visible:ring-2"
      >
        {content}
      </Link>
    );
  }

  if (protect) {
    content = <Protect>{content}</Protect>;
  }

  return content;
}

function buildStatCards(stats: AdminDashboardStats): StatCardProps[] {
  const lastSync = stats.lastSyncDisplay;

  const cards: StatCardProps[] = [
    {
      label: "Événements à confirmer",
      value: stats.pendingEvents,
      detail:
        stats.pendingEvents > 0
          ? "Synchronisés, en attente de validation"
          : "File de confirmation vide",
      href: "/admin/events/confirm",
      variant: stats.pendingEvents > 0 ? "warning" : "default",
    },
    {
      label: "Événements à venir",
      value: stats.upcomingEventCount,
      detail: "Occurrences publiées sur les 12 prochains mois",
      href: "/admin/events",
    },
    {
      label: "Sources iCal actives",
      value: stats.activeSources,
      detail:
        stats.inactiveSources > 0
          ? `${stats.inactiveSources} source${stats.inactiveSources > 1 ? "s" : ""} inactive${stats.inactiveSources > 1 ? "s" : ""}`
          : "Toutes les sources sont actives",
      href: "/admin/sources",
    },
    {
      label: "Dernière synchronisation",
      value: lastSync.value,
      detail: lastSync.detail,
      href: "/admin/sources",
      variant: lastSync.variant,
    },
    {
      label: "Syncs en échec (24 h)",
      value: stats.recentFailedSyncs,
      detail:
        stats.recentFailedSyncs > 0
          ? "Synchronisations partielles ou en échec"
          : "Aucun problème récent",
      href: "/admin/sources",
      variant: stats.recentFailedSyncs > 0 ? "warning" : "default",
    },
  ];

  if (stats.showPlatformStats) {
    cards.splice(1, 0, {
      label: "Lieux à confirmer",
      value: stats.pendingVenues,
      detail:
        stats.pendingVenues > 0
          ? "Adresses Google à valider"
          : "Tous les lieux actifs sont confirmés",
      href: adminVenuesPendingFilterHref(),
      variant: stats.pendingVenues > 0 ? "warning" : "default",
      protect: true,
    });
    cards.splice(4, 0, {
      label: "Organisateurs actifs",
      value: stats.activeOrganizers,
      detail: "Avec au moins un événement à venir",
      href: "/admin/organizations",
      protect: true,
    });
  }

  return cards;
}

export function AdminDashboardStats({ stats }: { stats: AdminDashboardStats }) {
  const cards = buildStatCards(stats);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vue d&apos;ensemble</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
