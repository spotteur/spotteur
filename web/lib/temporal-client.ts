import { Client, Connection } from '@temporalio/client'

export async function getTemporalClient() {
  return new Client({
    connection: await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS ?? 'temporal:7233',
    }),
  })
}
