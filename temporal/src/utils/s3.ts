import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3'
import { S3_ACCESS_KEY, S3_ENDPOINT, S3_REGION, S3_SECRET_KEY } from '../constants/env.ts'

const config: S3ClientConfig = {
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true,
}

export const s3Client = new S3Client(config)
