/**
 * swing-toulouse.fr on the shared Kapsule cluster: one namespace, one Postgres with backups,
 * the schema job, the web app, its Ingress and DNS. The cluster itself is
 * github.com/0ctanium/platform; its outputs arrive through a StackReference.
 */
import * as pulumi from '@pulumi/pulumi'

import { web } from './apps'
import { config } from './config'
import { records } from './dns'
import { ingress } from './ingress'
import { schemaJob } from './jobs'
import { namespace as namespaceResource } from './namespace'
import { platform } from './platform'
import { dbCluster, scheduledBackup } from './postgres'

export const namespace = namespaceResource.metadata.name
export const url = `https://${config.host}`
export const dns = records ? records.apex.name : 'not managed yet (swing:dns=false)'
export const imageTag = config.imageTag
export const schemaJobName = schemaJob.metadata.name
export const database = dbCluster.metadata.name
export const nightlyBackup = scheduledBackup.metadata.name
/** CI port-forwards to the database for the image build (`next build` prerenders from it). */
export const kubeconfig = pulumi.secret(platform.kubeconfig)

void [web, ingress]
