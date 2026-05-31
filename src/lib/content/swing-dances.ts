import type { OrganizationDance } from "@/lib/organizations/dances";

export type SwingDanceContent = {
  dance: OrganizationDance;
  era: string;
  description: string;
};

export const swingDancesContent: SwingDanceContent[] = [
  {
    dance: "Lindy Hop",
    era: "Harlem, années 1920",
    description:
      "La danse swing par excellence, née au Savoy Ballroom. Joyeuse, rebondie, conversation entre partenaires — le Lindy Hop anime la plupart des soirées et bals toulousains.",
  },
  {
    dance: "Blues",
    era: "Sud des États-Unis, lent et expressif",
    description:
      "Danse intime aux racines afro-américaines, fondée sur l'écoute et l'ancrage. Les soirées Blues à Toulouse se déroulent souvent en fin de soirée ou lors de bals dédiés.",
  },
  {
    dance: "Balboa",
    era: "Californie, années 1930",
    description:
      "Né dans les ballrooms bondés de la côte ouest. Position rapprochée, jeu de pieds raffiné, tempos vertigineux — le Balboa séduit par son élégance et sa technicité.",
  },
  {
    dance: "West Coast Swing",
    era: "Californie, années 1940",
    description:
      "Cousin moderne du Lindy Hop, adaptable à tous les styles musicaux contemporains. Une scène toulousaine active, avec pratiques régulières et événements dédiés.",
  },
  {
    dance: "Rock & Boogie",
    era: "Années 1950, Europe",
    description:
      "Héritiers directs des danses swing, le rock à six temps et le boogie woogie occupent une place singulière sur les pistes toulousaines, entre tradition et virtuosité.",
  },
];

export const homeHero = {
  kicker: "Agenda · communauté · écoles",
  title: ["Tout ce qui swingue", "à Toulouse"],
  lead:
    "Soirées Lindy Hop, bals Blues, pratiques Balboa, West Coast Swing, rock & boogie — l'agenda recense en temps réel ce qui se passe sur la scène toulousaine et en Occitanie.",
  followUp:
    "Que vous cherchiez votre prochaine sortie ou une école pour débuter, tout est là.",
} as const;
