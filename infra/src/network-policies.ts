import * as k8s from '@pulumi/kubernetes'
import type * as pulumi from '@pulumi/pulumi'

import { labels } from './config'
import { ns } from './namespace'
import { platform, provider } from './platform'

const postgresPods = { 'cnpg.io/cluster': 'swing-db' }

function policy(name: string, spec: pulumi.Input<k8s.types.input.networking.v1.NetworkPolicySpec>) {
  return new k8s.networking.v1.NetworkPolicy(
    name,
    { metadata: { name, namespace: ns }, spec },
    { provider },
  )
}

const namespaceSelector = (name: pulumi.Input<string>) => ({
  namespaceSelector: { matchLabels: { 'kubernetes.io/metadata.name': name } },
})

/**
 * Deny by default, then open exactly what the site needs: DNS, the internet (Clerk, QStash,
 * PostHog, Resend, Google, object storage, the Kubernetes API), Traefik to the web pod, the
 * web pod and the operator to Postgres. Nothing here reaches another project's database.
 */
export const policies = [
  policy('default-deny', { podSelector: {}, policyTypes: ['Ingress', 'Egress'] }),

  policy('allow-dns', {
    podSelector: {},
    policyTypes: ['Egress'],
    egress: [
      {
        to: [
          {
            ...namespaceSelector('kube-system'),
            podSelector: { matchLabels: { 'k8s-app': 'kube-dns' } },
          },
        ],
        ports: [
          { protocol: 'UDP', port: 53 },
          { protocol: 'TCP', port: 53 },
        ],
      },
    ],
  }),

  policy('allow-internet', {
    podSelector: {},
    policyTypes: ['Egress'],
    egress: [
      {
        to: [
          {
            ipBlock: {
              cidr: '0.0.0.0/0',
              except: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
            },
          },
        ],
      },
    ],
  }),

  policy('allow-web-from-traefik', {
    podSelector: { matchLabels: { 'app.kubernetes.io/name': 'web' } },
    policyTypes: ['Ingress'],
    ingress: [
      {
        from: [
          {
            ...namespaceSelector(platform.traefikNamespace),
            podSelector: { matchLabels: { 'app.kubernetes.io/name': 'traefik' } },
          },
        ],
        ports: [{ protocol: 'TCP', port: 3000 }],
      },
    ],
  }),

  policy('allow-postgres', {
    podSelector: { matchLabels: postgresPods },
    policyTypes: ['Ingress'],
    ingress: [
      {
        from: [{ podSelector: { matchLabels: labels.app } }],
        ports: [{ protocol: 'TCP', port: 5432 }],
      },
      {
        from: [namespaceSelector(platform.cnpgNamespace)],
        ports: [
          { protocol: 'TCP', port: 5432 },
          { protocol: 'TCP', port: 8000 },
        ],
      },
      { from: [{ podSelector: { matchLabels: postgresPods } }] },
    ],
  }),

  policy('allow-app-to-postgres', {
    podSelector: { matchLabels: labels.app },
    policyTypes: ['Egress'],
    egress: [
      {
        to: [{ podSelector: { matchLabels: postgresPods } }],
        ports: [{ protocol: 'TCP', port: 5432 }],
      },
    ],
  }),

  policy('allow-postgres-egress', {
    podSelector: { matchLabels: postgresPods },
    policyTypes: ['Egress'],
    egress: [{ to: [{ podSelector: { matchLabels: postgresPods } }] }],
  }),
]
