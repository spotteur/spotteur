import { eq } from 'drizzle-orm'
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { NextResponse, type NextRequest } from 'next/server'

import { DEFAULT_ERROR_MESSAGE } from '@/constants/app'
import db from '@/db/drizzle'
import { event as eventSchema } from '@/db/schema'

/**
 * Extension callback receiver
 * @param request
 * @returns
 */
export async function POST(request: NextRequest) {
  try {
    const { requestId, payload } = await request.json()
    const [event] = await db.select().from(eventSchema).where(eq(eventSchema.publicId, requestId))
    if (!event) {
      throw new Error(`Event with request ID does not exist: ${requestId}`)
    }
    const verifiedPayload = jwt.verify(payload, event.secret)
    await db.update(eventSchema).set({ payload: verifiedPayload }).where(eq(eventSchema.publicId, requestId))
    return NextResponse.json({ ok: true, message: 'Callback processed' })
  } catch (error: unknown) {
    if (error instanceof TokenExpiredError) {
      return NextResponse.json({ ok: false, message: 'TOKEN_EXPIRED' }, { status: 400 })
    }
    if (error instanceof JsonWebTokenError) {
      return NextResponse.json({ ok: false, message: 'INVALID_TOKEN' }, { status: 400 })
    }
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE },
      { status: 500 },
    )
  }
}
