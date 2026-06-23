import { defineConfig } from "vitest/config";

const sharedSetup = ["./tests/setup/env.ts"];

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/*.integration.test.ts",
        "src/lib/**/use-*.ts",
        "src/lib/**/query-keys.ts",
        // Infra / static config — not meaningful to cover in lib tests
        "src/lib/posthog-server.ts",
        "src/lib/qstash.ts",
        "src/lib/metadata.ts",
        "src/lib/calendar-subscribe-handle.ts",
        "src/lib/site-nav.ts",
        "src/lib/admin/dashboard-links.ts",
        "src/lib/community/links.ts",
        "src/lib/content/swing-dances.ts",
        "src/lib/seo/admin-robots.ts",
        "src/lib/og/assets.ts",
        "src/lib/og/palette.ts",
        "src/lib/query/get-query-client.ts",
        "src/lib/events/prefetch-agenda-queries.ts",
        "src/lib/admin/events-query-edit-key.types.ts",
        "src/lib/ical/types.ts",
        "src/lib/events/overrides.types.ts",
        "src/lib/sources/blob.ts",
        // External APIs and very heavy matching heuristics
        "src/lib/google/places.ts",
        "src/lib/google/cached-media.ts",
        "src/lib/google/cached-place.ts",
        "src/lib/google/place-display.ts",
        "src/lib/venues/duplicate-candidates.ts",
        "src/lib/events/admin-events-table.ts",
        // Large admin-only venue merge UI; bulk/assign flows covered in integration tests
        "src/lib/venues/matching.ts",
        "src/lib/sources/file-source.ts",
        "src/lib/sources/ical-file.ts",
        // Client/page loaders and external Clerk API wrappers
        "src/lib/events/calendar.ts",
        "src/lib/events/event-query-options.ts",
        "src/lib/event-category-tags/dance-pages.ts",
        "src/lib/venues/admin.ts",
        "src/lib/venues/assignments.ts",
        "src/lib/organizations/clerk-sync.ts",
      ],
      reporter: ["text", "html"],
      // Advisory target ~70%; not enforced in CI yet.
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: [
            "src/**/*.integration.test.ts",
            "src/**/*.test.tsx",
          ],
          setupFiles: [...sharedSetup, "./tests/setup/vitest.setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: [
            "src/**/*.integration.test.ts",
            "tests/integration/**/*.test.ts",
          ],
          setupFiles: [
            ...sharedSetup,
            "./tests/setup/vitest.setup.ts",
            "./tests/setup/integration-db.ts",
            "./tests/setup/integration-mocks.ts",
            "./tests/setup/integration.setup.ts",
          ],
          pool: "forks",
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: [
            ...sharedSetup,
            "./tests/setup/vitest.setup.ts",
            "./tests/setup/component.setup.tsx",
          ],
        },
      },
    ],
  },
});
