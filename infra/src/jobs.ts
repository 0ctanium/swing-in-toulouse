import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import { config, labels } from './config'
import { ns } from './namespace'
import { policies } from './network-policies'
import { platform, provider } from './platform'
import { dbCluster } from './postgres'
import { res } from './resources'
import { pullSecret, schemaSecret } from './secrets'

export const images = {
  web: pulumi.interpolate`${platform.registryEndpoint}/swing-in-toulouse:${config.imageTag}`,
  schema: pulumi.interpolate`${platform.registryEndpoint}/swing-in-toulouse-schema:${config.imageTag}`,
}

const tag12 = config.imageTag.slice(0, 12)

/**
 * `drizzle-kit push --force` against the cluster database, once per deploy. The Pulumi name is
 * fixed while the Kubernetes name carries the image tag: a new tag replaces the Job (create the
 * new one, wait for it to succeed, delete the old), and a redeploy of the same tag does nothing.
 * `pulumi up` fails if the Job does; the web Deployment then stays untouched.
 */
export const schemaJob = new k8s.batch.v1.Job(
  'schema',
  {
    metadata: {
      name: `swing-schema-${tag12}`,
      namespace: ns,
      annotations: { 'pulumi.com/timeoutSeconds': '600' },
    },
    spec: {
      backoffLimit: 2,
      ttlSecondsAfterFinished: 7 * 24 * 3600,
      template: {
        metadata: { labels: { 'app.kubernetes.io/name': 'schema', ...labels.app } },
        spec: {
          restartPolicy: 'Never',
          imagePullSecrets: [{ name: pullSecret.metadata.name }],
          priorityClassName: platform.priorityClasses.app,
          // The image runs as `node` (uid 1000); the kubelet needs the number to enforce runAsNonRoot.
          securityContext: { runAsNonRoot: true, runAsUser: 1000, runAsGroup: 1000 },
          containers: [
            {
              name: 'schema',
              image: images.schema,
              envFrom: [{ secretRef: { name: schemaSecret.metadata.name } }],
              resources: res.schema,
            },
          ],
        },
      },
    },
  },
  { provider, dependsOn: [dbCluster, ...policies] },
)
