import * as k8s from '@pulumi/kubernetes'

import { labels } from './config'
import { images, schemaJob } from './jobs'
import { ns } from './namespace'
import { platform, provider } from './platform'
import { res } from './resources'
import { appSecret, pullSecret } from './secrets'

const webLabels = {
  'app.kubernetes.io/name': 'web',
  'app.kubernetes.io/part-of': 'swing-toulouse',
  ...labels.app,
}

export const webService = new k8s.core.v1.Service(
  'web',
  {
    metadata: { name: 'swing-web', namespace: ns, labels: webLabels },
    spec: { selector: webLabels, ports: [{ name: 'http', port: 3000, targetPort: 'http' }] },
  },
  { provider },
)

export const web = new k8s.apps.v1.Deployment(
  'web',
  {
    metadata: { name: 'swing-web', namespace: ns, labels: webLabels },
    spec: {
      replicas: 1,
      selector: { matchLabels: webLabels },
      strategy: { type: 'RollingUpdate', rollingUpdate: { maxSurge: 1, maxUnavailable: 0 } },
      template: {
        metadata: { labels: webLabels },
        spec: {
          imagePullSecrets: [{ name: pullSecret.metadata.name }],
          priorityClassName: platform.priorityClasses.app,
          // The image runs as `node` (uid 1000); the kubelet needs the number to enforce runAsNonRoot.
          securityContext: { runAsNonRoot: true, runAsUser: 1000, runAsGroup: 1000 },
          containers: [
            {
              name: 'web',
              image: images.web,
              ports: [{ name: 'http', containerPort: 3000 }],
              envFrom: [{ secretRef: { name: appSecret.metadata.name } }],
              resources: res.web,
              startupProbe: {
                httpGet: { path: '/api/health', port: 'http' },
                periodSeconds: 2,
                failureThreshold: 30,
              },
              readinessProbe: {
                httpGet: { path: '/api/ready', port: 'http' },
                periodSeconds: 10,
                timeoutSeconds: 3,
              },
              livenessProbe: {
                httpGet: { path: '/api/health', port: 'http' },
                periodSeconds: 20,
                timeoutSeconds: 3,
              },
            },
          ],
        },
      },
    },
  },
  { provider, dependsOn: [schemaJob] },
)
