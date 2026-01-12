import { Novu } from '@novu/api'

import { NOVU_BACKEND_URL, NOVU_SECRET_KEY } from '@/constants/env'

const novu = new Novu({
  secretKey: NOVU_SECRET_KEY,
  serverURL: NOVU_BACKEND_URL,
})

export default novu
