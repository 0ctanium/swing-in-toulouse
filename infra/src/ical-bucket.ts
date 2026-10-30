import * as pulumi from '@pulumi/pulumi'
import * as scaleway from '@pulumiverse/scaleway'

import { config } from './config'

/** Uploaded iCal files (`src/lib/sources/blob.ts`). Private; the app reads them server side. */
export const icalBucket = new scaleway.object.Bucket(
  'ical',
  {
    name: 'swing-toulouse-ical',
    region: config.region,
    projectId: config.projectId,
  },
  { protect: true },
)

const application = new scaleway.iam.Application('ical', {
  name: 'swing-toulouse-ical',
  description: 'swing-toulouse.fr: iCal files bucket',
})

new scaleway.iam.Policy('ical', {
  name: 'swing-toulouse-ical',
  applicationId: application.id,
  rules: [
    {
      projectIds: [config.projectId],
      permissionSetNames: [
        'ObjectStorageBucketsRead',
        'ObjectStorageObjectsRead',
        'ObjectStorageObjectsWrite',
        'ObjectStorageObjectsDelete',
      ],
    },
  ],
})

const apiKey = new scaleway.iam.ApiKey('ical', {
  applicationId: application.id,
  description: 'swing-toulouse.fr: iCal files bucket',
  defaultProjectId: config.projectId,
})

export const icalKey = { accessKey: apiKey.accessKey, secretKey: pulumi.secret(apiKey.secretKey) }
