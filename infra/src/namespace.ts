import * as k8s from '@pulumi/kubernetes'

import { config } from './config'
import { provider } from './platform'
import { res } from './resources'

export const namespace = new k8s.core.v1.Namespace(
  'namespace',
  {
    metadata: {
      name: config.namespace,
      labels: {
        'pod-security.kubernetes.io/enforce': 'baseline',
        'pod-security.kubernetes.io/warn': 'restricted',
      },
    },
  },
  { provider },
)

export const ns = namespace.metadata.name

/** A leak here cannot push another project's pods off the node. */
export const quota = new k8s.core.v1.ResourceQuota(
  'quota',
  {
    metadata: { name: 'swing-toulouse', namespace: ns },
    spec: {
      hard: {
        'requests.memory': res.quota.requestsMemory,
        'limits.memory': res.quota.limitsMemory,
        'requests.cpu': res.quota.requestsCpu,
        pods: res.quota.pods,
        persistentvolumeclaims: '2',
      },
    },
  },
  { provider },
)

/** Defaults for any container that forgets to declare resources (the quota rejects it otherwise). */
export const limitRange = new k8s.core.v1.LimitRange(
  'limits',
  {
    metadata: { name: 'swing-toulouse', namespace: ns },
    spec: {
      limits: [
        {
          type: 'Container',
          defaultRequest: { cpu: '50m', memory: '64Mi' },
          default: { memory: '256Mi' },
        },
      ],
    },
  },
  { provider },
)
