import { NativeConnection, Worker } from '@temporalio/worker'
import { URL, fileURLToPath } from 'url'
import path from 'path'
import * as screenshotActivities from './activities/screenshot.ts'

// TODO: Implement dynamic workflow path to include all workflow automatically
const workflowsPathUrl = new URL(`./workflows/index${path.extname(import.meta.url)}`, import.meta.url)

const worker = await Worker.create({
  connection: await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'temporal:7233',
  }),
  workflowsPath: fileURLToPath(workflowsPathUrl),
  activities: {
    ...screenshotActivities,
  },
  taskQueue: 'spotteur',
})

await worker.run()
