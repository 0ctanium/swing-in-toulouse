import * as pulumi from '@pulumi/pulumi'

const swing = new pulumi.Config('swing')
const scaleway = new pulumi.Config('scaleway')

interface PostgresConfig {
  storageGi: number
  maxConnections: number
}

export const config = {
  stack: pulumi.getStack(),
  namespace: 'swing-toulouse',
  projectId: scaleway.require('projectId'),
  region: scaleway.get('region') ?? 'fr-par',
  platformStack: swing.require('platformStack'),
  /** Apex host; `www.` redirects to it. */
  host: swing.require('host'),
  cloudflareZoneId: swing.require('cloudflareZoneId'),
  cloudflareProxied: swing.getBoolean('cloudflareProxied') ?? false,
  /** Off until the cut-over: the records would take the names away from Vercel. */
  dns: swing.getBoolean('dns') ?? false,
  /** Commit SHA of the images to run. Never committed to the stack file. */
  imageTag: swing.require('imageTag'),
  /** The app's runtime environment, verbatim (see Pulumi.prod.yaml). */
  env: swing.requireSecretObject<Record<string, string>>('env'),
  postgres: swing.getObject<PostgresConfig>('postgres') ?? { storageGi: 10, maxConnections: 30 },
}

export const labels = {
  /** Pods allowed to reach Postgres. */
  app: { 'swing.io/role': 'app' },
}
