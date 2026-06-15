import "@/load-env";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { organizations, sources } from "@/db/schema";
import type { OrganizationCategory } from "@/db/schema";
import type { OrganizationDance } from "@/lib/organizations/dances";
import type { OrganizationSocialLinks } from "@/lib/organizations/social-links";
import { normalizeOrganizationSocialLinks } from "@/lib/organizations/social-links";
import { normalizeOrganizationWebsite } from "@/lib/organizations/schemas";
import { generateOrganizationSlug, generateSourceSlug } from "@/lib/slug";

type SeedOrganizer = {
  name: string;
  description?: string;
  website?: string;
  category?: OrganizationCategory;
  dances?: OrganizationDance[];
  socialLinks?: OrganizationSocialLinks;
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
    category: "school",
    dances: ["Lindy Hop", "Balboa", "Blues", "Rock & Boogie"],
  },
  {
    name: "Toulouse Tripe Swing",
    description:
      "Toulouse Tripe Swing est une association qui organise des événements de tripe swing à Toulouse.",
    website: "https://www.toulousetripleswing.fr",
    category: "association",
    dances: ["Lindy Hop", "Blues", "Balboa"],
  },
  {
    name: "Studio Hop",
    description:
      "Studio Hop est une école de danse qui propose des cours de danse à Toulouse.",
    website: "https://www.studiohop.com/",
    category: "school",
    dances: ["Lindy Hop"],
  },
  {
    name: "La Candela",
    description:
      "La Candela est une association qui organise des événements et propose de cours de swing à Toulouse.",
    website: "https://www.lacandelatoulouse.com",
    category: "association",
    dances: ["Lindy Hop"],
  },
  {
    name: "144 Dance Avenue",
    description:
      "144 Dance Avenue est une école de danse qui propose des cours de danse à Toulouse.",
    website: "https://www.144danceavenue.com",
    category: "school",
    dances: ["Lindy Hop", "West Coast Swing", "Rock & Boogie"],
  },
  {
    name: "King Louis Club",
    description:
      "King Louis Club est un club de swing qui propose des cours de swing à Toulouse.",
    website: "https://www.kinglouisclub.com",
    category: "school",
    dances: ["Lindy Hop", "Rock & Boogie"],
  },
  {
    name: "Funky Swing Dancers",
    description:
      "Funky Swing Dancers est une association qui organise des événements et propose des cours de swing à Toulouse.",
    website: "https://www.funkyswingdancers.com",
    category: "association",
    dances: ["West Coast Swing"],
  },
  {
    name: "L'apéro Balboa",
    description:
      "Collectif spontané et enthousiaste dédié à la danse sociale Balboa. Soirées dansantes festives mensuelles ouvertes à toustes avec cours d'initiation inclus ! Et toujours gratuit!",
    category: "association",
    dances: ["Balboa"],
    socialLinks: {
      facebook: "https://www.facebook.com/profile.php?id=61558037978729",
    },
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
    defaultCategories: ["Lindy Hop", "Rock", "Boogie", "Swing", "Blues"],
  },
  {
    name: "Toulouse Tripe Swing — Balboa",
    url: "https://ics.teamup.com/feed/ksxbw7fp28sigfndvd/4916134.ics",
    type: "ical",
    defaultCategories: ["Balboa"],
    // organizerSlug: "toulouse-tripe-swing",
  },
  {
    name: "Toulouse Tripe Swing — Blues",
    url: "https://ics.teamup.com/feed/ksxbw7fp28sigfndvd/4916052.ics",
    type: "ical",
    defaultCategories: ["Blues"],
    // organizerSlug: "toulouse-tripe-swing",
  },
  {
    name: "Toulouse Tripe Swing — Swing",
    url: "https://ics.teamup.com/feed/ksxbw7fp28sigfndvd/4916051.ics",
    type: "ical",
    defaultCategories: ["Swing", "Lindy Hop"],
    // organizerSlug: "toulouse-tripe-swing",
  },
];

async function upsertOrganizer(organizer: SeedOrganizer) {
  const slug = generateOrganizationSlug(organizer.name);
  const website = normalizeOrganizationWebsite(organizer.website);
  const socialLinks =
    normalizeOrganizationSocialLinks(organizer.socialLinks) ?? null;

  const [created] = await db
    .insert(organizations)
    .values({
      slug,
      name: organizer.name,
      description: organizer.description,
      website,
      category: organizer.category ?? null,
      dances: organizer.dances ?? null,
      socialLinks,
    })
    .onConflictDoUpdate({
      target: [organizations.slug],
      set: {
        name: organizer.name,
        description: organizer.description,
        website,
        category: organizer.category ?? null,
        dances: organizer.dances ?? null,
        socialLinks,
      },
    })
    .returning();

  console.info(`Organisateur créé : ${organizer.name}`);
  return created;
}

async function upsertSource(source: SeedSource) {
  const slug = generateSourceSlug(source.name);

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

  await db
    .insert(sources)
    .values({
      slug,
      name: source.name,
      type: source.type ?? "ical",
      url: source.url,
      organizationId,
      defaultLocationRaw: source.defaultLocationRaw ?? null,
      defaultCategories: source.defaultCategories ?? null,
    })
    .onConflictDoUpdate({
      target: [sources.slug],
      set: {
        name: source.name,
        type: source.type ?? "ical",
        url: source.url,
        organizationId,
        defaultLocationRaw: source.defaultLocationRaw ?? null,
        defaultCategories: source.defaultCategories ?? null,
      },
    });

  console.info(`Source créée : ${source.name}`);
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
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  });
