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

  ### Valeurs par défaut (lieu et catégories)

  Si un calendrier iCal omet souvent le lieu ou les catégories, vous pouvez définir des défauts **par source** :

  - **Interface admin** — `/admin/sources` (lieu `location_raw` et catégories)
  - **Seed** — champs optionnels `defaultLocationRaw` et `defaultCategories` dans `seedSources`

  Les défauts s'appliquent à la synchronisation uniquement quand l'événement iCal n'a pas déjà ces champs. Relancez `pnpm run sync` après modification.

  ## Lieux : comment ça marche ?

  **Oui, les lieux sont créés automatiquement pendant la sync.**

  Lors de l'import iCal, si un événement contient un champ `LOCATION` :

  1. le texte brut est stocké sur l'événement (`location_raw`) ;
  2. le **nom** est extrait avant la première virgule, l'**adresse** après ;
  3. un lieu est trouvé ou créé par **slug du nom** (ex. `studio-hop`) — pas par l'adresse complète ;
  4. l'événement est lié au lieu → page `/lieu/[slug]`.

  Exemple : `LOCATION:Studio Hop, 4 avenue de Rangueil, 31400 Toulouse` → lieu **Studio Hop**, slug `studio-hop`, adresse `4 avenue de Rangueil, 31400 Toulouse`.

  **Pourquoi le nom et pas l'adresse pour le slug ?** Deux événements au même endroit avec des variantes d'adresse dans iCal retombaient sur des lieux différents. Le slug sur le nom regroupe naturellement ; les doublons restants se fusionnent via `/admin/venues`.

  La sync **ne réécrit pas** un lieu existant (nom, adresse). Les corrections se font sur `/admin/venues/confirm` (Google Places + GPS) ou en base — **pas besoin d'un système d'override** comme pour les événements.

  ### Confirmer les adresses (Google)

  Sur `/admin/venues/confirm`, recherchez chaque lieu via Google Places, validez l'adresse et les coordonnées GPS. Un lieu actif est « confirmé » quand `address_confirmed_at` et les coordonnées sont renseignés.

  Variable d'environnement : `GOOGLE_MAPS_API_KEY` (Places API + Geocoding API). La clé reste côté serveur — l'autocomplete admin passe par `/api/admin/places/*`.

  La page `/admin/venues` (fusion) affiche une alerte si des lieux restent à confirmer.

  ## Événements récurrents (RRULE)

  Les événements récurrents sont stockés **une seule fois** en base avec leur `RRULE`.

  - **Affichage web** : expansion à la volée (12 prochains mois)
  - **Export iCal** (`/agenda.ics`, `/organisateur/[slug].ics`) : règle de récurrence conservée

  ## Overrides admin

  Les données iCal restent la source synchronisée. Les corrections manuelles sont stockées dans `event_overrides` et appliquées à l'affichage sans être écrasées par la sync.

  | Scope | Usage |
  |---|---|
  | **Série** (`occurrence_start_at` null) | Corrige toutes les occurrences (organisateur, lieu, tags, titre…) |
  | **Occurrence** | Corrige ou masque une seule date d'un événement récurrent |

  ### Activer l'admin

  1. Ajoutez dans `.env.local` : `ADMIN_SECRET="…"` (16 caractères minimum)
  2. `pnpm run db:push` pour créer la table `event_overrides`
  3. Connectez-vous sur `/admin/login`

  **Mode admin sur le site public** : une fois connecté, une bannière apparaît sur toutes les pages. Sur l'agenda et les fiches événement, un bouton **Corriger** mène vers les overrides (avec le nombre d'overrides actifs).

  **`/admin`** affiche le même calendrier que l'agenda public — la liste d'événements a été retirée au profit de cette vue contextuelle.

  Champs overrideables : titre, description, dates, lieu, venue, organisateur, catégories, statut, URL externe, masquage d'occurrence.

  ## Doublons (fusion d'événements)

  Le même événement peut apparaître dans plusieurs calendriers iCal (sources différentes). Swing Toulouse les importe séparément.

  Depuis `/admin/events/[id]`, section **Doublons** :

  - **Utiliser comme principal** — l'événement courant devient doublon du candidat (disparaît de l'agenda, slug redirigé)
  - **Marquer comme doublon** — le candidat est lié à l'événement courant
  - **Délier** — annule la fusion

  Les doublons restent synchronisés en base (`canonical_event_id` sur l'événement secondaire) mais n'apparaissent plus dans l'agenda, le sitemap ni les exports. Leur URL `/evenement/[slug]` redirige vers l'événement principal.

  Candidats détectés automatiquement : même créneau ±1 h, titre proche, source différente.

  ## Lieux : correction en masse

  Sur `/admin/venues` :

  - **Réassignation manuelle** — sélectionnez des lieux sources et un lieu cible ; les événements concernés reçoivent un override `venueId`
  - **Lieux similaires** — regroupements par nom proche (ex. variantes d'orthographe)
  - **LOCATION iCal incohérentes** — même texte `LOCATION` rattaché à plusieurs venues

  La sync iCal continue de mettre à jour `events.venue_id` depuis le flux ; les overrides de lieu restent prioritaires à l'affichage.

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
