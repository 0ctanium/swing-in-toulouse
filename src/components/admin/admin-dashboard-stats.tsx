import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  AdminDashboardLastSync,
  AdminDashboardStats,
} from "@/lib/admin/dashboard-stats";
import { adminVenuesPendingFilterHref } from "@/lib/venues/admin-venues-params";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  href?: string;
  variant?: "default" | "warning" | "muted";
};

function formatLastSync(lastSync: AdminDashboardLastSync | null) {
  if (!lastSync) {
    return {
      value: "—",
      detail: "Aucune synchronisation enregistrée",
      variant: "muted" as const,
    };
  }

  const relativeTime = formatDistanceToNow(lastSync.createdAt, {
    addSuffix: true,
    locale: fr,
  });

  const statusLabel =
    lastSync.status === "success"
      ? "OK"
      : lastSync.status === "partial"
        ? "Partielle"
        : "Échec";

  const changes = [
    lastSync.eventsCreated > 0 ? `${lastSync.eventsCreated} créé(s)` : null,
    lastSync.eventsUpdated > 0 ? `${lastSync.eventsUpdated} modifié(s)` : null,
    lastSync.eventsCancelled > 0
      ? `${lastSync.eventsCancelled} retiré(s)`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const sourceLabel = lastSync.sourceName ?? "Source inconnue";
  const detail = changes
    ? `${sourceLabel} · ${changes} · ${relativeTime}`
    : `${sourceLabel} · ${relativeTime}`;

  return {
    value: statusLabel,
    detail,
    variant:
      lastSync.status === "success" ? ("default" as const) : ("warning" as const),
  };
}

function StatCard({ label, value, detail, href, variant = "default" }: StatCardProps) {
  const content = (
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
    return (
      <div className="flex flex-col gap-1 rounded-xl bg-muted/30 p-4 ring-1 ring-foreground/10">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="hover:bg-muted/40 focus-visible:ring-ring flex flex-col gap-1 rounded-xl bg-muted/30 p-4 ring-1 ring-foreground/10 outline-none transition-colors focus-visible:ring-2"
    >
      {content}
    </Link>
  );
}

function buildStatCards(stats: AdminDashboardStats): StatCardProps[] {
  const lastSync = formatLastSync(stats.lastSync);

  return [
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
      label: "Lieux à confirmer",
      value: stats.pendingVenues,
      detail:
        stats.pendingVenues > 0
          ? "Adresses Google à valider"
          : "Tous les lieux actifs sont confirmés",
      href: adminVenuesPendingFilterHref(),
      variant: stats.pendingVenues > 0 ? "warning" : "default",
    },
    {
      label: "Événements à venir",
      value: stats.upcomingEventCount,
      detail: "Occurrences publiées sur les 12 prochains mois",
      href: "/admin/events",
    },
    {
      label: "Organisateurs actifs",
      value: stats.activeOrganizers,
      detail: "Avec au moins un événement à venir",
      href: "/admin/organizations",
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
