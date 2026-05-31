import Link from "next/link";
import { addDays } from "date-fns";
import { cacheLife, cacheTag } from "next/cache";

import { CompactPlanningView } from "@/components/events/compact-planning-view";
import { SwingDancesSection } from "@/components/home/swing-dances-section";
import { CommunityLinksSection } from "@/components/community/community-links-section";
import { OrganizationsByDance } from "@/components/organizations/organizations-by-dance";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { PUBLIC_PAGE_REVALIDATE } from "@/lib/cache/revalidate";
import {
  getUpcomingEventsUncached,
  listOrganizersUncached,
} from "@/lib/events/queries";
import { getDefaultFromDate } from "@/lib/ical/recurrence";

export async function HomePageEventsSection() {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.events, CACHE_TAGS.organizers);

  const from = getDefaultFromDate();
  const [events, organizers] = await Promise.all([
    getUpcomingEventsUncached({
      from,
      to: addDays(from, 14),
    }),
    listOrganizersUncached(),
  ]);

  return (
    <>
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <h2 className="font-heading text-2xl font-semibold">
              Prochains événements
            </h2>
            <p className="text-muted-foreground text-sm">
              Lindy Hop, Blues, Balboa, West Coast Swing, rock & boogie — les 14
              prochains jours
            </p>
          </div>
          <Link href="/agenda" className="text-sm font-medium underline">
            Tout voir
          </Link>
        </div>
        <CompactPlanningView events={events} />
      </section>

      <SwingDancesSection />

      <CommunityLinksSection />

      <OrganizationsByDance organizers={organizers} />
    </>
  );
}
