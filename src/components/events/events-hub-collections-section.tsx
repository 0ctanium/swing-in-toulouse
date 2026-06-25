import Link from "next/link";

import { listEvenementsHubCollections } from "@/lib/event-collections/queries";

export async function EventsHubCollectionsSection() {
  const { timePresets, eventTags } = await listEvenementsHubCollections();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Parcourir</h2>
        <p className="text-muted-foreground mt-2">
          Retrouvez les prochains événements par période ou par type.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-medium">Par période</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {timePresets.map((preset) => (
              <li key={preset.slug}>
                <Link
                  href={preset.path}
                  className="bg-muted hover:bg-muted/80 inline-flex rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  {preset.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {eventTags.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium">Par type</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {eventTags.map((tag) => (
                <li key={tag.slug}>
                  <Link
                    href={tag.path}
                    className="bg-muted hover:bg-muted/80 inline-flex rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                  >
                    {tag.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
