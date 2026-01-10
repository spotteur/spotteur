import { S3Client } from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@smithy/node-http-handler'

import { S3_ACCESS_KEY, S3_ENDPOINT, S3_REGION, S3_SECRET_KEY } from '@/constants/env'

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // Must be enabled for RustFS compatibility
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 3000,
    socketTimeout: 5000,
  }),
})

export default s3
