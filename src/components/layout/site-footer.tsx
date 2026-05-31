import Link from "next/link";

import { CalendarSubscribeDialog } from "@/components/calendar/calendar-subscribe-dialog";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { emptyIcalPayload } from "@/lib/ical/payload";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground">
        <p>
          {siteConfig.name} — {siteConfig.description}
        </p>
        <p>
          Abonnez-vous au calendrier :{" "}
          <CalendarSubscribeDialog payload={emptyIcalPayload()}>
            <button
              type="button"
              className="text-foreground underline hover:no-underline"
            >
              Calendrier iCal (Tous les événements)
            </button>
          </CalendarSubscribeDialog>
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          <Link
            href="/evenements"
            className="text-foreground underline hover:no-underline"
          >
            Événements
          </Link>
          <Link
            href="/organisateurs"
            className="text-foreground underline hover:no-underline"
          >
            Organisateurs
          </Link>
          <Link
            href="/lieux"
            className="text-foreground underline hover:no-underline"
          >
            Lieux
          </Link>
          <Link
            href="/agenda"
            className="text-foreground underline hover:no-underline"
          >
            Agenda
          </Link>
          <Link
            href="/mentions-legales"
            className="text-foreground underline hover:no-underline"
          >
            Mentions légales
          </Link>
          <Link
            href="/confidentialite"
            className="text-foreground underline hover:no-underline"
          >
            Confidentialité
          </Link>
        </nav>
        <div className="flex items-center justify-between gap-3">
          <span className="text-foreground">Apparence</span>
          <ThemeSwitcher />
        </div>
      </div>
    </footer>
  );
}
