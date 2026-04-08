import { NativeConnection, Worker } from '@temporalio/worker'

import { TEMPORAL_ADDRESS } from '@/constants/env'
import { TEMPORAL_QUEUE_NAME } from '@/constants/temporal'
import { logger } from '@/lib/logger'
import * as buildActivities from '@/temporal/activities/build'
import * as projectActivities from '@/temporal/activities/project'
import * as snapshotActivities from '@/temporal/activities/snapshot'

async function run() {
  const worker = await Worker.create({
    connection: await NativeConnection.connect({
      address: TEMPORAL_ADDRESS,
    }),
    workflowsPath: require.resolve('./workflows/index'),
    activities: {
      ...buildActivities,
      ...projectActivities,
      ...snapshotActivities,
    },
    taskQueue: TEMPORAL_QUEUE_NAME,
  })

  await worker.run()
}

run().catch((err) => {
  logger.error(err)
  process.exit(1)
})
