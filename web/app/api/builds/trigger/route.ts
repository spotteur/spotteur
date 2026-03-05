import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { $ZodError } from 'zod/v4/core'

import { DEFAULT_ERROR_MESSAGE } from '@/constants/app'
import { triggerBuildApi } from '@/features/builds/actions'
import { InvalidProjectTokenError } from '@/features/projects/errors'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const { build } = await triggerBuildApi({ payload })

    return NextResponse.json({ ok: true, data: build })
  } catch (error: unknown) {
    if (error instanceof InvalidProjectTokenError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 401 })
    }

    if (error instanceof $ZodError) {
      return NextResponse.json(
        { ok: false, message: z.prettifyError(error), errors: z.treeifyError(error) },
        { status: 400 },
      )
    }

    logger.error(error)

    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE },
      { status: 500 },
    )
  }
}
