/** Default cache lifetime for event-heavy public data (5 minutes). */
export const PUBLIC_PAGE_REVALIDATE = 300;

/** Cache lifetime for sitemap and slow-changing entity lists (1 hour). */
export const SITEMAP_REVALIDATE = 3600;

/** @see {@link import("./google").GOOGLE_MAPS_CACHE_SECONDS} */
export { GOOGLE_MAPS_CACHE_SECONDS } from "./google";
