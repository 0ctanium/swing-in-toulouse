  # Données : organisateurs, sources et lieux

  Ce guide explique comment alimenter Swing Toulouse avec de nouveaux événements.

  ## Concepts

  | Concept | Rôle |
  |---|---|
  | **Organisateur** | École, asso, collectif ou organisateur d'événements (page publique `/organisateur/[slug]`) |
  | **Source** | Point de synchronisation — aujourd'hui un flux **iCal** |
  | **Lieu** | Endroit où se déroule un événement (salle, adresse…) |
  | **Événement** | Importé depuis une source, rattaché optionnellement à un organisateur |

  Un **organisateur** et une **source** sont distincts :

  - une école peut avoir **plusieurs sources** (Google Calendar + HelloAsso + site perso) ;
  - une source peut exister **sans organisateur** (événements communautaires, calendrier public).

  ```text
  Source (iCal URL) ──sync──► Événements ──optionnel──► Organisateur
                                    │
                                    └──► Lieu (auto depuis iCal LOCATION)
  ```

  ## Ajouter un organisateur

  1. Ouvrez `scripts/seed-data.ts`
  2. Ajoutez une entrée dans `seedOrganizers` :

    ```typescript
    {
      name: "Swing Cats Toulouse",
      description: "École de Lindy Hop et Balboa",
      website: "https://example.com",
    },
    ```

  3. Lancez :

    ```bash
    pnpm run db:seed
    ```

  L'organisateur apparaît sur la page d'accueil et à `/organisateur/swing-cats-toulouse` (slug auto-généré).

  ## Ajouter une source iCal

  1. Récupérez l'URL publique du calendrier (Google Calendar → Paramètres → Intégrer → URL secrète se terminant par `.ics`)
  2. Ajoutez une entrée dans `seedSources` :

    ```typescript
    {
      name: "Swing Cats — Google Calendar",
      url: "https://calendar.google.com/calendar/ical/….ics",
      type: "ical",
      organizerSlug: "swing-cats-toulouse", // optionnel
    },
    ```

  3. Seed + sync :

    ```bash
    pnpm run db:seed
    pnpm run sync
    ```

  ### Source sans organisateur

  Omettez `organizerSlug` — les événements seront affichés avec le nom de la source :

    ```typescript
    {
      name: "Calendrier swing Toulouse Métropole",
      url: "https://….ics",
      type: "ical",
    },
    ```

  ## Lieux : comment ça marche ?

  **Oui, les lieux sont créés automatiquement pendant la sync.**

  Lors de l'import iCal, si un événement contient un champ `LOCATION` :

  1. le texte brut est stocké sur l'événement (`location_raw`) ;
  2. un lieu est **trouvé ou créé** à partir de ce texte (slug dérivé du nom) ;
  3. l'événement est lié au lieu → page `/lieu/[slug]`.

  Exemple : `LOCATION:Cave Poésie, 22 rue…, Toulouse` crée ou réutilise le lieu **Cave Poésie**.

  Aucune saisie manuelle n'est nécessaire. Pour corriger un lieu mal nommé, modifiez-le en base (Drizzle Studio : `pnpm run db:studio`) — la prochaine sync ne renommera pas un lieu existant tant que le slug correspond.

  ## Événements récurrents (RRULE)

  Les événements récurrents sont stockés **une seule fois** en base avec leur `RRULE`.

  - **Affichage web** : expansion à la volée (12 prochains mois)
  - **Export iCal** (`/agenda.ics`, `/organisateur/[slug].ics`) : règle de récurrence conservée

  ## Commandes utiles

  | Commande | Action |
  |---|---|
  | `pnpm run db:seed` | Crée organisateurs et sources depuis `scripts/seed-data.ts` |
  | `pnpm run sync` | Synchronise toutes les sources actives |
  | `pnpm run db:studio` | Interface visuelle pour inspecter / corriger les données |

  ## Migration depuis l'ancien modèle

  Si vous aviez des `calendar_url` directement sur les organisateurs :

  1. `pnpm run db:push` — validez les prompts Drizzle (création de `sources`, retrait de `calendar_url`)
  2. Si Drizzle demande de tronquer `events` (ajout de `source_id` obligatoire), acceptez puis relancez la sync
  3. `pnpm run db:seed` puis `pnpm run sync`

  Les anciennes URLs `/association/*` redirigent vers `/organisateur/*`.
