import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground">
        <p>{siteConfig.name} — {siteConfig.description}</p>
        <p>
          Abonnez-vous au calendrier :{" "}
          <a href="/agenda.ics" className="text-foreground underline">
            agenda.ics
          </a>
        </p>
      </div>
    </footer>
  );
}
