import { CalendarSubscribeDialog } from "@/components/calendar/calendar-subscribe-dialog";
import { OrganizationCategoryBadge } from "@/components/organizations/organization-category-badge";
import { OrganizationDanceBadges } from "@/components/organizations/organization-dance-badges";
import type { Organization } from "@/db/schema";
import { emptyIcalPayload } from "@/lib/ical/payload";
import { listOrganizationSocialLinks } from "@/lib/organizations/social-links";

type OrganizerHeaderProps = {
  organizer: Pick<
    Organization,
    | "name"
    | "description"
    | "website"
    | "slug"
    | "category"
    | "dances"
    | "socialLinks"
  >;
};

export function OrganizerHeader({ organizer }: OrganizerHeaderProps) {
  const socialLinks = listOrganizationSocialLinks(organizer.socialLinks);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {organizer.name}
        </h1>
        <OrganizationCategoryBadge category={organizer.category} />
      </div>

      <OrganizationDanceBadges dances={organizer.dances} />

      {organizer.description ? (
        <p className="text-muted-foreground max-w-2xl text-lg">
          {organizer.description}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {organizer.website ? (
          <a
            href={organizer.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Site web
          </a>
        ) : null}
        {socialLinks.map((link) => (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            {link.label}
          </a>
        ))}
        <CalendarSubscribeDialog
          payload={{ ...emptyIcalPayload(), org: [organizer.slug] }}
          feedName={`${organizer.name} | Swingin Toulouse`}
        >
          <button className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted">
            Calendrier iCal
          </button>
        </CalendarSubscribeDialog>
      </div>
    </section>
  );
}
