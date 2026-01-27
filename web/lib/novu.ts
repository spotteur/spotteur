import { Novu } from '@novu/api'
import { Client } from '@novu/framework'

import { NOVU_BACKEND_URL, NOVU_SECRET_KEY } from '@/constants/env'

const novu = new Novu({
  secretKey: NOVU_SECRET_KEY,
  serverURL: NOVU_BACKEND_URL,
})

export const novuFrameworkClient = new Client({
  apiUrl: NOVU_BACKEND_URL,
  secretKey: NOVU_SECRET_KEY,
})

export default novu
