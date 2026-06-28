Object.assign(process.env, {
  NODE_ENV: "test",
  SKIP_ENV_VALIDATION: "true",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
});
process.env.CLERK_SECRET_KEY ??= "sk_test_integration";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??= "pk_test_integration";
process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
process.env.QSTASH_URL ??= "https://qstash.test";
process.env.QSTASH_TOKEN ??= "qstash-test-token";
process.env.QSTASH_CURRENT_SIGNING_KEY ??= "qstash-current-key";
process.env.QSTASH_NEXT_SIGNING_KEY ??= "qstash-next-key";
process.env.PROJECTION_MONTHS_AHEAD ??= "18";
