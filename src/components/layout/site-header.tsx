import Link from "next/link";

import { CalendarSubscribeDialog } from "@/components/calendar/calendar-subscribe-dialog";
import { cn } from "@/lib/utils";
import { emptyIcalPayload } from "@/lib/ical/payload";

const navItems = [
  { href: "/", label: "Accueil" },
  { href: "/agenda", label: "Agenda" },
];

type SiteHeaderProps = {
  isAdminMode?: boolean;
};

export function SiteHeader({ isAdminMode = false }: SiteHeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex flex-col gap-0.5">
          <span className="font-heading text-xl font-semibold tracking-tight">
            Swing in Toulouse
          </span>
          <span className="text-muted-foreground text-xs">
            Lindy Hop · Boogie · Bal swing
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
          <CalendarSubscribeDialog payload={emptyIcalPayload()}>
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Calendrier iCal
            </button>
          </CalendarSubscribeDialog>
          {isAdminMode ? (
            <Link
              href="/admin"
              className="rounded-lg bg-amber-500/15 px-3 py-1.5 text-sm font-medium text-amber-950 hover:bg-amber-500/25 dark:text-amber-100"
            >
              Admin
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
