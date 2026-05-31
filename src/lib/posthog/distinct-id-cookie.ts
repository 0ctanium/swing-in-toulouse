/** Nom du cookie — importable côté client et serveur. */
export const POSTHOG_DISTINCT_ID_COOKIE = "ph_distinct_id";

/** En-tête interne (middleware → Server Components) pour la première visite. */
export const POSTHOG_DISTINCT_ID_HEADER = "x-ph-distinct-id";

export const POSTHOG_DISTINCT_ID_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2;

export const postHogDistinctIdCookieOptions = {
  path: "/",
  maxAge: POSTHOG_DISTINCT_ID_MAX_AGE_SECONDS,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
