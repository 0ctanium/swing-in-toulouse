import { ThemeSwitcher } from "@/components/theme-switcher";
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
          <a href="/agenda.ics" className="text-foreground underline">
            agenda.ics
          </a>
        </p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-foreground">Apparence</span>
          <ThemeSwitcher />
        </div>
      </div>
    </footer>
  );
}
