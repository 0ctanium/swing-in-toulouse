import * as cloudflare from '@pulumi/cloudflare'

import { config } from './config'
import { platform } from './platform'

const common = {
  zoneId: config.cloudflareZoneId,
  ttl: config.cloudflareProxied ? 1 : 300,
  proxied: config.cloudflareProxied,
  comment: 'swing-toulouse.fr on the shared cluster (Pulumi)',
}

/** Created once `swing:dns` is true (docs/runbook.md § 3.4). */
export const records = config.dns
  ? {
      apex: new cloudflare.DnsRecord('apex', {
        ...common,
        name: config.host,
        type: 'A',
        content: platform.lbIp,
      }),
      www: new cloudflare.DnsRecord('www', {
        ...common,
        name: `www.${config.host}`,
        type: 'CNAME',
        content: config.host,
      }),
    }
  : undefined
