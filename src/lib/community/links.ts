export type CommunityLink = {
  id: string;
  label: string;
  href: string;
  description?: string;
};

export type CommunityResourceCategory = {
  id: string;
  title: string;
  links: CommunityLink[];
};

/** Groupes WhatsApp par style — URLs modifiables ici. */
export const whatsappGroups: CommunityLink[] = [
  {
    id: "whatsapp-lindy",
    label: "Lindy Hop",
    href: "https://chat.whatsapp.com/LsP3IJoLQsR6g1Quook9vT?mode=gi_t",
    description: "Échanges, sorties et entraide Lindy",
  },
  {
    id: "whatsapp-balboa",
    label: "Balboa",
    href: "https://chat.whatsapp.com/K4wTnXQgrjZCcyYvCP98eG?mode=gi_t",
    description: "Communauté balboa toulousaine",
  },
  {
    id: "whatsapp-blues",
    label: "Blues",
    href: "https://chat.whatsapp.com/K4wTnXQgrjZCcyYvCP98eG?mode=gi_t",
    description: "Annonces et discussions blues",
  },
  {
    id: "whatsapp-boogie",
    label: "Boogie Woogie",
    href: "https://chat.whatsapp.com/F0DdBzZeYHf10xtaq9Wjcy?mode=gi_t",
    description: "Rock & boogie à Toulouse",
  },
];

/** Groupes Facebook — libellés à ajuster si besoin. */
export const facebookGroups: CommunityLink[] = [
  {
    id: "facebook-lindy-hop-and-swing-toulouse",
    label: "Lindy Hop et Swing sur Toulouse",
    href: "https://www.facebook.com/groups/20393438108",
  },
  {
    id: "facebook-blues-dance-toulouse",
    label: "Blues Dance à Toulouse",
    href: "https://www.facebook.com/groups/blues.dance.toulouse",
  },
  {
    id: "facebook-west-coast-swing-france",
    label: "West Coast Swing France",
    href: "https://www.facebook.com/groups/350290171682887",
  },
];

/** Festivals, calendriers et autres liens utiles hors du site. */
export const externalResourceCategories: CommunityResourceCategory[] = [
  {
    id: "festivals",
    title: "Festivals",
    links: [
      {
        id: "viensonswing",
        label: "Viens On Swing",
        href: "https://www.viensonswing.fr/",
        description: "Agenda des festivals en France",
      },
      {
        id: "swingplanit",
        label: "SwingPlanit",
        href: "https://www.swingplanit.com/",
        description: "Agenda des festivals dans le monde",
      },
    ],
  },
  {
    id: "calendars",
    title: "Autres calendriers",
    links: [
      {
        id: "toulouse-triple-swing",
        label: "Toulouse Triple Swing",
        href: "https://teamup.com/ksxbw7fp28sigfndvd",
      },
      {
        id: "swingspots",
        label: "Swingspots",
        href: "https://swingspots.studer.fr/#agenda",
      },
    ],
  },
];
