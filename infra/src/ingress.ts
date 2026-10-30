import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import { webService } from './apps'
import { config } from './config'
import { ns } from './namespace'
import { platform, provider } from './platform'

const hsts = new k8s.apiextensions.CustomResource(
  'hsts',
  {
    apiVersion: 'traefik.io/v1alpha1',
    kind: 'Middleware',
    metadata: { name: 'hsts', namespace: ns },
    spec: {
      headers: {
        stsSeconds: 31536000,
        stsIncludeSubdomains: true,
        customResponseHeaders: { Server: '' },
      },
    },
  },
  { provider },
)

/** `www.` → apex, one certificate covering both. */
const wwwRedirect = new k8s.apiextensions.CustomResource(
  'www-redirect',
  {
    apiVersion: 'traefik.io/v1alpha1',
    kind: 'Middleware',
    metadata: { name: 'www-redirect', namespace: ns },
    spec: {
      redirectRegex: {
        regex: `^https://www\\.${config.host.replaceAll('.', '\\.')}/(.*)`,
        replacement: `https://${config.host}/\${1}`,
        permanent: true,
      },
    },
  },
  { provider },
)

const middlewares = pulumi.interpolate`${ns}-${wwwRedirect.metadata.name}@kubernetescrd,${ns}-${hsts.metadata.name}@kubernetescrd`

const rule = (host: string) => ({
  host,
  http: {
    paths: [
      {
        path: '/',
        pathType: 'Prefix',
        backend: { service: { name: webService.metadata.name, port: { name: 'http' } } },
      },
    ],
  },
})

export const ingress = new k8s.networking.v1.Ingress(
  'web',
  {
    metadata: {
      name: 'swing-web',
      namespace: ns,
      annotations: {
        'cert-manager.io/cluster-issuer': platform.issuerHttp01,
        'traefik.ingress.kubernetes.io/router.entrypoints': 'websecure',
        'traefik.ingress.kubernetes.io/router.middlewares': middlewares,
      },
    },
    spec: {
      ingressClassName: platform.ingressClass,
      tls: [{ hosts: [config.host, `www.${config.host}`], secretName: 'swing-web-tls' }],
      rules: [rule(config.host), rule(`www.${config.host}`)],
    },
  },
  { provider },
)
