import { swingDancesContent } from "@/lib/content/swing-dances";

function DanceCard({
  title,
  era,
  description,
}: {
  title: string;
  era: string;
  description: string;
}) {
  return (
    <article className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border p-4 shadow-sm">
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {era}
      </p>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </article>
  );
}

export function SwingDancesSection() {
  return (
    <section
      id="danses"
      aria-labelledby="dances-heading"
      className="flex scroll-mt-6 flex-col gap-6"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="dances-heading"
          className="font-heading text-2xl font-semibold tracking-tight md:text-3xl"
        >
          Les danses swing à Toulouse
        </h2>
        <div
          className="bg-primary/30 mx-auto mt-4 h-px w-16"
          role="presentation"
          aria-hidden
        />
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed md:text-base">
          De Harlem aux ballrooms californiens, la grande famille des danses
          swing rayonne sur les pistes toulousaines.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {swingDancesContent.map(({ dance, era, description }) => (
          <DanceCard
            key={dance}
            title={dance}
            era={era}
            description={description}
          />
        ))}
      </div>
    </section>
  );
}
