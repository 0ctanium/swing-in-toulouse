import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import { config } from './config'

/** Outputs of the platform stack (infra/platform/src/index.ts). */
const ref = new pulumi.StackReference(config.platformStack)

const str = (name: string) => ref.requireOutput(name) as pulumi.Output<string>

export const platform = {
  kubeconfig: str('kubeconfig'),
  lbIp: str('lbIp'),
  registryEndpoint: str('registryEndpoint'),
  registryPullSecretKey: str('registryPullSecretKey'),
  backups: {
    bucket: str('backupsBucketName'),
    endpoint: str('backupsBucketEndpoint'),
    region: str('backupsBucketRegion'),
    accessKey: str('backupsAccessKey'),
    secretKey: str('backupsSecretKey'),
  },
  ingressClass: str('ingressClass'),
  traefikNamespace: str('traefikNamespace'),
  cnpgNamespace: str('cnpgNamespace'),
  issuerHttp01: str('issuerHttp01Name'),
  storageClassRetain: str('storageClassRetain'),
  priorityClasses: ref.requireOutput('priorityClasses') as pulumi.Output<{
    database: string
    app: string
    bestEffort: string
  }>,
  /** Required so that a preview against an unapplied platform fails with a clear message. */
  releases: ref.requireOutput('releases'),
}

/** Registry host, for the pull secret: `rg.fr-par.scw.cloud/<ns>` → `rg.fr-par.scw.cloud`. */
export const registryHost = platform.registryEndpoint.apply((e) => e.split('/')[0]!)

export const provider = new k8s.Provider('kapsule', {
  kubeconfig: platform.kubeconfig,
  enableServerSideApply: true,
})
