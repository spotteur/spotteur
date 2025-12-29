// proxy.ts
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const hasSessionCookie = await auth.api.getSession({
    headers: await headers(),
  })

  if (!hasSessionCookie && !request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!auth|api|_next/static|_next/image|favicon.ico).*)'],
}
