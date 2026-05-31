import Link from "next/link";

import {
  buildArchiveMonthPath,
  formatArchiveMonthLabel,
  type ArchiveMonth,
} from "@/lib/events/hub";

type EventArchiveSectionProps = {
  months: ArchiveMonth[];
};

export function EventArchiveSection({ months }: EventArchiveSectionProps) {
  if (months.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Archives</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Parcourez les événements passés mois par mois.
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        {months.map(({ year, month, key }) => (
          <li key={key}>
            <Link
              href={buildArchiveMonthPath(year, month)}
              className="bg-card text-card-foreground block rounded-lg border px-4 py-3 text-sm font-medium capitalize transition-colors hover:bg-muted/60"
            >
              {formatArchiveMonthLabel(year, month)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
