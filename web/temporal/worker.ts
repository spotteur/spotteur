import { NativeConnection, Worker } from '@temporalio/worker'

import { TEMPORAL_ADDRESS } from '@/constants/env'
import * as buildActivities from '@/temporal/activities/build'
import * as projectActivities from '@/temporal/activities/project'

async function run() {
  const worker = await Worker.create({
    connection: await NativeConnection.connect({
      address: TEMPORAL_ADDRESS,
    }),
    workflowsPath: require.resolve('./workflows/index'),
    activities: {
      ...buildActivities,
      ...projectActivities,
    },
    taskQueue: 'spotteur',
  })

  await worker.run()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
