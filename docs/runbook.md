# Running swing-toulouse.fr on the Kapsule cluster

The site runs on the Scaleway Kapsule cluster shared with the operator's other projects. The
cluster and what every project relies on are the `platform` repository
(github.com/0ctanium/platform, with its own runbook); `infra/` here is the site's namespace, one
stack: `prod`. Every merge to `main` builds the images and deploys with `pulumi up`.

What stays outside the cluster: Clerk (sign-in), QStash (the hourly sync and the daily
projection, calling the public URL), PostHog, Resend, Google Maps, WhatsApp. Only environment
variables.

## 1. One-time setup, by hand

The platform runbook comes first: Scaleway organization, Pulumi IAM keys, state bucket,
passphrase. Then:

1. **Scaleway project** `swing-toulouse` (the iCal bucket). Give the `pulumi-deploy` and
   `pulumi-preview` applications of the platform access to it.
2. **Cloudflare.** Add the zone `swing-toulouse.fr` (free plan), note its zone id, and at OVH
   replace the nameservers by the two Cloudflare gives. Import the existing records first (the
   Cloudflare wizard does it); Vercel's `A`/`CNAME` stay until the cut-over. The platform's API
   token must cover this zone (`Zone:DNS:Edit`, `Zone:Read`).
3. **GitHub.** Environment `production` (no reviewer: deploys are automatic; add one later if
   wanted) with secrets `SCW_ACCESS_KEY`, `SCW_SECRET_KEY` (the deploy key). Repository secrets:
   `PULUMI_CONFIG_PASSPHRASE`, `SCW_DEFAULT_ORGANIZATION_ID`, `SCW_REGISTRY_PUSH_SECRET_KEY`
   (`pulumi stack output registryPushSecretKey --show-secrets` in the platform),
   `POSTHOG_API_KEY` (source maps at build), `BUILD_DATABASE_URL` (Neon's connection string:
   the first image build prerenders from it, see § 4; remove it after the cut-over). Repository
   variables: `SCW_REGISTRY`
   (`pulumi stack output registryEndpoint` in the platform; setting it turns the image push and
   the deploy on), `NEXT_PUBLIC_SITE_URL=https://swing-toulouse.fr`,
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`,
   `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` (inlined into the client bundle at build time).
4. **Local shell.** As in the platform runbook: `pulumi`, `kubectl`, the `SCW_*` / `AWS_*`
   variables and `PULUMI_CONFIG_PASSPHRASE`.

## 2. First deploy

### 2.1 Stack configuration

```bash
cd infra && pnpm install
pulumi stack init prod
pulumi config set scaleway:projectId <swing-toulouse project id>
pulumi config set swing:cloudflareZoneId <zone id>
pulumi config set --secret cloudflare:apiToken <token>
```

The app's environment is one secret object, `swing:env`, with the same keys as `.env.local` on
Vercel minus what the program sets itself (`DATABASE_URL`, `DATABASE_DRIVER`, `S3_*`,
`NEXT_PUBLIC_SITE_URL`, `NODE_ENV`) and minus the Neon and Vercel Blob variables:

```bash
pulumi config set --secret --path 'env.CLERK_SECRET_KEY' …
pulumi config set --secret --path 'env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY' …
pulumi config set --secret --path 'env.QSTASH_URL' https://qstash.upstash.io
pulumi config set --secret --path 'env.QSTASH_TOKEN' …
pulumi config set --secret --path 'env.QSTASH_CURRENT_SIGNING_KEY' …
pulumi config set --secret --path 'env.QSTASH_NEXT_SIGNING_KEY' …
pulumi config set --secret --path 'env.GOOGLE_MAPS_API_KEY' …
pulumi config set --secret --path 'env.RESEND_API_KEY' …
pulumi config set --secret --path 'env.CONTACT_EMAIL_FROM' 'Swingin Toulouse <contact@swing-toulouse.fr>'
pulumi config set --secret --path 'env.CONTACT_EMAIL_TO' …
pulumi config set --secret --path 'env.CONTACT_PHONE' …
pulumi config set --secret --path 'env.CONTACT_NOTIFY_PHONE' …
pulumi config set --secret --path 'env.WHATSAPP_ACCESS_TOKEN' …
pulumi config set --secret --path 'env.WHATSAPP_PHONE_NUMBER_ID' …
pulumi config set --secret --path 'env.WHATSAPP_TEMPLATE_NAME' …
pulumi config set --secret --path 'env.WHATSAPP_TEMPLATE_LANGUAGE' fr
pulumi config set --secret --path 'env.NEXT_PUBLIC_POSTHOG_HOST' …
pulumi config set --secret --path 'env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN' …
```

Keep `BLOB_READ_WRITE_TOKEN` out: it is only needed on your laptop for step 3.3.

### 2.2 Apply

Merge to `main` with `SCW_REGISTRY` set, or by hand:

```bash
pulumi preview -c swing:imageTag=<commit sha on main>
pulumi up -c swing:imageTag=<commit sha on main>
```

About 25 resources; no DNS record yet (`swing:dns` is false). Postgres reports healthy after
2–3 minutes; the schema Job (`drizzle-kit push`) runs, then the web Deployment. The site answers
on the cluster's IP before DNS moves:
`curl -sk --resolve swing-toulouse.fr:443:<lbIp> https://swing-toulouse.fr/api/ready` →
`{"ok":true}`. The certificate is issued once DNS points at the cluster (step 3.4); until then
the Ingress serves Traefik's default certificate, hence `-k`.

Check: `kubectl -n swing-toulouse get pods,jobs,cluster,backup`.

## 3. Cut-over from Vercel

Order matters: data first, DNS last. Lower the TTL of the Vercel records to 300 s a day before.

1. **Freeze writes.** In Vercel, pause the QStash schedules (Upstash console) and avoid admin
   edits for the duration (about 15 minutes).
2. **Database.** From the Neon connection string (`DATABASE_URL` on Vercel):

   ```bash
   pg_dump --format=custom --no-owner --no-privileges "$NEON_URL" > swing.dump
   kubectl -n swing-toulouse port-forward svc/swing-db-rw 5433:5432 &
   SWING_URL="postgresql://swing:$(kubectl -n swing-toulouse get secret swing-db-owner -o jsonpath='{.data.password}' | base64 -d)@localhost:5433/swing"
   pg_restore --clean --if-exists --no-owner --no-privileges -d "$SWING_URL" swing.dump
   ```

   `--clean` drops what the schema Job created; the restore brings Neon's schema and data. The
   next deploy's `drizzle-kit push` then finds nothing to change.

3. **iCal files.** With `.env.local` holding Neon's `DATABASE_URL` replaced by `$SWING_URL`,
   `DATABASE_DRIVER=node-postgres`, the old `BLOB_READ_WRITE_TOKEN` and the new `S3_*` (from
   `pulumi stack output` on the `ical` key, or the Scaleway console):
   `pnpm tsx scripts/migrate-blobs-to-s3.ts`. It copies every file still on Vercel Blob and
   stores the object key in `sources.ical_blob_url`.
4. **DNS.** In Cloudflare, delete Vercel's `A swing-toulouse.fr` and `CNAME www` (imported in
   step 1.2). Then `pulumi config set swing:dns true` and `pulumi up` (or commit the stack file
   and let the Deploy job run): Pulumi creates the `A` and `CNAME` records on the cluster IP.
   Within minutes: `dig +short swing-toulouse.fr` = the cluster IP,
   `kubectl -n swing-toulouse get certificate` Ready, `curl -sI https://swing-toulouse.fr/` → 200.
5. **QStash.** Resume the schedules. Their destination is `https://swing-toulouse.fr/api/cron/…`,
   unchanged. Check the next hourly run in the Upstash console and
   `kubectl -n swing-toulouse logs deploy/swing-web | grep sync`.
6. **Vercel.** Keep the project a week in case of rollback (point DNS back), then delete it and
   the Blob store. Neon: keep a final branch or dump for a month.

## 4. Routine deploys

Every merge to `main`: tests, the `web` and `schema` images tagged with the commit SHA, then
`pulumi up` with that tag. The schema Job runs `drizzle-kit push --force` before the web pod
changes: a failed push fails the run and leaves the previous release running.

**The build reads the database.** `next build` prerenders the agenda, the tag pages, the sitemap
and more from Postgres (Cache Components), as it did on Vercel with Neon. The images job
port-forwards to `swing-db` with the kubeconfig the stack exports, and hands the URL to the
build as a BuildKit secret; before the stack exists it falls back to `BUILD_DATABASE_URL`. Two
consequences: a schema change the new code depends on must be in the database before the build,
so run `pnpm db:push` against production (port-forward as in § 3.2) before merging it, the
schema Job being the safety net; and the build fails while the database is down.

`push --force` applies destructive changes without asking. Review `pnpm db:generate`'s diff
before merging a schema change that drops or narrows a column; moving to `drizzle-kit migrate`
(and a `__drizzle_migrations` table) is the way to make this safe later.

Rollback: Actions → CI → re-run the `deploy` job of the previous green commit, or by hand
`pulumi up -c swing:imageTag=<previous sha>` from `infra/`.

## 5. Operations

| Task                 | Command                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Status               | `kubectl -n swing-toulouse get pods,jobs`                                                 |
| Logs                 | `kubectl -n swing-toulouse logs -f deploy/swing-web`                                      |
| Restart              | `kubectl -n swing-toulouse rollout restart deploy/swing-web`                              |
| Database shell       | `kubectl -n swing-toulouse exec -it swing-db-1 -- psql -U postgres swing`                 |
| Run the sync by hand | `curl -X POST https://swing-toulouse.fr/api/cron/sync` is refused (QStash signature); trigger the schedule from the Upstash console |
| What changed by hand | `cd infra && pnpm preview -c swing:imageTag=<current sha>`                               |

Changes made with `kubectl` are overwritten by the next deploy.

## 6. Backups

CloudNativePG archives WAL continuously and takes a base backup every night at 02:30 UTC to the
platform's bucket (`nl-ams`), under `swing-toulouse/prod/`, kept 30 days. Check:
`kubectl -n swing-toulouse get backup`. Restore drill: a `bootstrap.recovery` cluster in a
scratch namespace from that path, as described in Paselio's `docs/runbooks/kapsule.md` § 5.
