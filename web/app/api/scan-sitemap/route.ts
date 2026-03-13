import { NextResponse, type NextRequest } from 'next/server'

import { scanSitemapUrls } from '@/features/shared/actions/scan-sitemap-urls'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const sitemapUrl = request.nextUrl.searchParams.get('url')
  if (!sitemapUrl) {
    return NextResponse.json({ message: 'No sitemap URL' }, { status: 422 })
  }
  try {
    const urls = await scanSitemapUrls(sitemapUrl)
    return NextResponse.json({ urls })
  } catch (err) {
    logger.error(err)
    return NextResponse.json({ message: 'Unknown error' }, { status: 500 })
  }
}
