import "@/load-env";

import { eq } from "drizzle-orm";

import { closeDb, db } from "@/db";
import { organizations, sources } from "@/db/schema";
import { generateOrganizationSlug, generateSourceSlug } from "@/lib/slug";

type SeedOrganizer = {
  name: string;
  description?: string;
  website?: string;
};

type SeedSource = {
  name: string;
  url: string;
  type?: "ical";
  organizerSlug?: string;
  defaultLocationRaw?: string;
  defaultCategories?: string[];
};

const seedOrganizers: SeedOrganizer[] = [
  {
    name: "TRAC",
    description:
      "École et communauté swing à Toulouse — Lindy Hop, Balboa et plus.",
    website: "https://www.trac-ecole.fr",
  },
  {
    name: "Toulouse Tripe Swing",
    description:
      "Toulouse Tripe Swing est une association qui organise des événements de tripe swing à Toulouse.",
    website: "https://www.toulousetripleswing.fr",
  },
  {
    name: "Studio Hop",
    description:
      "Studio Hop est une école de danse qui propose des cours de danse à Toulouse.",
    website: "https://www.studiohop.com/",
  },
];

const seedSources: SeedSource[] = [
  {
    name: "TRAC — Calendrier soirées",
    url: "https://calendar.google.com/calendar/ical/isa2a0r8gba8117gt13l9hr9b8%40group.calendar.google.com/public/basic.ics",
    type: "ical",
    organizerSlug: "trac",
    defaultLocationRaw:
      "TRAC L'Ecole, 43 Rue Alfred Dumeril, 31400 Toulouse, France",
    defaultCategories: ["Lindy Hop", "Rock", "Blues", "Swing", "Boogie"],
  },
  {
    name: "Toulouse Tripe Swing — Balboa",
    url: "https://ics.teamup.com/feed/ksxbw7fp28sigfndvd/4916134.ics",
    type: "ical",
    organizerSlug: "toulouse-tripe-swing",
  },
  {
    name: "Toulouse Tripe Swing — Blues",
    url: "https://ics.teamup.com/feed/ksxbw7fp28sigfndvd/4916052.ics",
    type: "ical",
    organizerSlug: "toulouse-tripe-swing",
  },
  {
    name: "Toulouse Tripe Swing — Swing",
    url: "https://ics.teamup.com/feed/ksxbw7fp28sigfndvd/4916051.ics",
    type: "ical",
    organizerSlug: "toulouse-tripe-swing",
  },
];

async function upsertOrganizer(organizer: SeedOrganizer) {
  const slug = generateOrganizationSlug(organizer.name);

  const existing = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });

  if (existing) {
    console.log(`Organisateur déjà présent : ${organizer.name}`);
    return existing;
  }

  const [created] = await db
    .insert(organizations)
    .values({
      slug,
      name: organizer.name,
      description: organizer.description,
      website: organizer.website,
    })
    .returning();

  console.log(`Organisateur créé : ${organizer.name}`);
  return created;
}

async function upsertSource(source: SeedSource) {
  const slug = generateSourceSlug(source.name);

  const existing = await db.query.sources.findFirst({
    where: eq(sources.slug, slug),
  });

  if (existing) {
    console.log(`Source déjà présente : ${source.name}`);
    return;
  }

  let organizationId: string | null = null;

  if (source.organizerSlug) {
    const organizer = await db.query.organizations.findFirst({
      where: eq(organizations.slug, source.organizerSlug),
    });

    if (!organizer) {
      throw new Error(
        `Organisateur introuvable pour la source ${source.name}: ${source.organizerSlug}`,
      );
    }

    organizationId = organizer.id;
  }

  await db.insert(sources).values({
    slug,
    name: source.name,
    type: source.type ?? "ical",
    url: source.url,
    organizationId,
    defaultLocationRaw: source.defaultLocationRaw ?? null,
    defaultCategories: source.defaultCategories ?? null,
  });

  console.log(`Source créée : ${source.name}`);
}

async function main() {
  for (const organizer of seedOrganizers) {
    await upsertOrganizer(organizer);
  }

  for (const source of seedSources) {
    await upsertSource(source);
  }
}

main()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await closeDb();
    process.exit(1);
  });
