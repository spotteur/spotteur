import { Client, Connection } from '@temporalio/client'

const connection = Connection.lazy({
  address: process.env.TEMPORAL_ADDRESS ?? 'temporal:7233',
})

export const temporalClient = new Client({ connection })
