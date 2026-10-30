import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import { config } from './config'
import { ns } from './namespace'
import { platform, provider } from './platform'
import { res } from './resources'
import { backupsSecret, dbOwnerSecret } from './secrets'

export const dbName = 'swing-db'
const objectStoreName = 'swing-backups'

/** Where base backups and WAL go: the platform's bucket, under this project's prefix. */
export const objectStore = new k8s.apiextensions.CustomResource(
  'db-backups',
  {
    apiVersion: 'barmancloud.cnpg.io/v1',
    kind: 'ObjectStore',
    metadata: { name: objectStoreName, namespace: ns },
    spec: {
      configuration: {
        destinationPath: pulumi.interpolate`s3://${platform.backups.bucket}/swing-toulouse/${config.stack}/`,
        endpointURL: platform.backups.endpoint,
        s3Credentials: {
          accessKeyId: { name: backupsSecret.metadata.name, key: 'ACCESS_KEY_ID' },
          secretAccessKey: { name: backupsSecret.metadata.name, key: 'ACCESS_SECRET_KEY' },
          region: { name: backupsSecret.metadata.name, key: 'REGION' },
        },
        wal: { compression: 'gzip' },
        data: { compression: 'gzip' },
      },
      retentionPolicy: '30d',
    },
  },
  { provider },
)

/**
 * One Postgres, one database `swing` owned by the role `swing` (the app connects as the owner:
 * drizzle-kit push needs it). Point-in-time recovery from the object store above.
 */
export const dbCluster = new k8s.apiextensions.CustomResource(
  'db',
  {
    apiVersion: 'postgresql.cnpg.io/v1',
    kind: 'Cluster',
    metadata: {
      name: dbName,
      namespace: ns,
      annotations: {
        'pulumi.com/waitFor': 'jsonpath={.status.phase}=Cluster in healthy state',
        'pulumi.com/timeoutSeconds': '900',
      },
    },
    spec: {
      instances: 1,
      imageName: 'ghcr.io/cloudnative-pg/postgresql:18.6-minimal-trixie',
      priorityClassName: platform.priorityClasses.database,
      storage: {
        size: `${config.postgres.storageGi}Gi`,
        storageClass: platform.storageClassRetain,
      },
      resources: res.postgres,
      postgresql: {
        parameters: {
          max_connections: String(config.postgres.maxConnections),
          shared_buffers: res.postgresSharedBuffers,
          work_mem: '4MB',
          maintenance_work_mem: '64MB',
          log_min_duration_statement: '500',
        },
      },
      bootstrap: {
        initdb: {
          database: 'swing',
          owner: 'swing',
          secret: { name: dbOwnerSecret.metadata.name },
        },
      },
      plugins: [
        {
          name: 'barman-cloud.cloudnative-pg.io',
          isWALArchiver: true,
          parameters: { barmanObjectName: objectStoreName },
        },
      ],
      enableSuperuserAccess: false,
    },
  },
  { provider, dependsOn: [objectStore, dbOwnerSecret], protect: true },
)

/** Nightly base backup at 02:30 UTC; WAL is archived continuously. */
export const scheduledBackup = new k8s.apiextensions.CustomResource(
  'db-nightly-backup',
  {
    apiVersion: 'postgresql.cnpg.io/v1',
    kind: 'ScheduledBackup',
    metadata: { name: 'swing-db-nightly', namespace: ns },
    spec: {
      schedule: '0 30 2 * * *',
      immediate: true,
      backupOwnerReference: 'self',
      method: 'plugin',
      pluginConfiguration: { name: 'barman-cloud.cloudnative-pg.io' },
      cluster: { name: dbName },
    },
  },
  { provider, dependsOn: [dbCluster] },
)
