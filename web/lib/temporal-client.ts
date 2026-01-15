import { Client, Connection } from '@temporalio/client'

import { TEMPORAL_ADDRESS } from '@/constants/env'

const connection = Connection.lazy({
  address: TEMPORAL_ADDRESS,
})

export const temporalClient = new Client({ connection })
