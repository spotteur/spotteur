import { NativeConnection, Worker } from '@temporalio/worker'

import { TEMPORAL_ADDRESS } from '@/constants/env'
import { TEMPORAL_QUEUE_NAME } from '@/constants/temporal'
import { logger } from '@/lib/logger'
import * as activities from '@/temporal/activities'

async function run() {
  const worker = await Worker.create({
    connection: await NativeConnection.connect({
      address: TEMPORAL_ADDRESS,
    }),
    workflowsPath: require.resolve('./workflows/index'),
    activities,
    taskQueue: TEMPORAL_QUEUE_NAME,
  })

  await worker.run()
}

run().catch((err) => {
  logger.error(err)
  process.exit(1)
})
