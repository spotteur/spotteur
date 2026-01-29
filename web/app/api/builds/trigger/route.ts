import { NextResponse } from 'next/server'

import { triggerBuildApi } from '@/features/builds/actions'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const payload = await request.json()
  if (!payload.projectToken || !payload.projectId || !payload.buildIdentifier) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Field projectId, projectToken and buildIdentifier are required.',
      },
      { status: 400 },
    )
  }

  const build = await triggerBuildApi({
    projectId: payload.projectId,
    identifier: payload.buildIdentifier,
    token: payload.projectToken,
  })

  return build
}
