import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'
import * as random from '@pulumi/random'

import { config } from './config'
import { icalBucket, icalKey } from './ical-bucket'
import { ns } from './namespace'
import { platform, provider, registryHost } from './platform'

/** Generated once, kept in the encrypted state. `special: false` keeps it URL-safe. */
const dbPassword = new random.RandomPassword('pg-swing', { length: 48, special: false }).result

/** CloudNativePG reads the owner's credentials from a `basic-auth` secret. */
export const dbOwnerSecret = new k8s.core.v1.Secret(
  'db-owner',
  {
    metadata: { name: 'swing-db-owner', namespace: ns },
    type: 'kubernetes.io/basic-auth',
    stringData: { username: 'swing', password: dbPassword },
  },
  { provider },
)

export const databaseUrl = pulumi.interpolate`postgresql://swing:${dbPassword}@swing-db-rw:5432/swing`

/** The app's whole environment: the stack's `swing:env`, plus what the program decides. */
export const appSecret = new k8s.core.v1.Secret(
  'app-env',
  {
    metadata: { name: 'swing-app-env', namespace: ns },
    stringData: pulumi
      .all([
        config.env,
        databaseUrl,
        icalBucket.apiEndpoint,
        icalBucket.name,
        icalKey.accessKey,
        icalKey.secretKey,
      ])
      .apply(([env, dbUrl, s3Endpoint, bucket, accessKey, secretKey]) => ({
        ...env,
        NODE_ENV: 'production',
        NEXT_PUBLIC_SITE_URL: `https://${config.host}`,
        DATABASE_URL: dbUrl,
        DATABASE_DRIVER: 'node-postgres',
        S3_ENDPOINT: s3Endpoint,
        S3_REGION: config.region,
        S3_BUCKET: bucket,
        S3_ACCESS_KEY_ID: accessKey,
        S3_SECRET_ACCESS_KEY: secretKey,
      })),
  },
  { provider },
)

/** The schema job needs only the database. */
export const schemaSecret = new k8s.core.v1.Secret(
  'schema-env',
  {
    metadata: { name: 'swing-schema-env', namespace: ns },
    stringData: { DATABASE_URL: databaseUrl, SKIP_ENV_VALIDATION: '1' },
  },
  { provider },
)

/** Lets the node pull from the shared registry. Scaleway's registry takes any username. */
export const pullSecret = new k8s.core.v1.Secret(
  'registry-pull',
  {
    metadata: { name: 'scw-registry', namespace: ns },
    type: 'kubernetes.io/dockerconfigjson',
    stringData: {
      '.dockerconfigjson': pulumi
        .all([registryHost, platform.registryPullSecretKey])
        .apply(([host, key]) =>
          JSON.stringify({
            auths: {
              [host]: {
                username: 'nologin',
                password: key,
                auth: Buffer.from(`nologin:${key}`).toString('base64'),
              },
            },
          }),
        ),
    },
  },
  { provider },
)

/** Credentials CloudNativePG uses for the platform's backups bucket. */
export const backupsSecret = new k8s.core.v1.Secret(
  'backups-s3',
  {
    metadata: { name: 'swing-backups-s3', namespace: ns },
    stringData: {
      ACCESS_KEY_ID: platform.backups.accessKey,
      ACCESS_SECRET_KEY: platform.backups.secretKey,
      REGION: platform.backups.region,
    },
  },
  { provider },
)
