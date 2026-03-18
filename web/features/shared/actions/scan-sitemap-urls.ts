'use server'
import { Parser } from 'xml2js'

const xmlParser = new Parser({ explicitArray: true })

/**
 * Recursively fetches URLs from a sitemap or sitemap index.
 * @todo Handle gzip sitemaps
 * @param sitemapUrl The URL of the sitemap or sitemap index.
 * @returns A promise that resolves to an array of URL strings.
 */
export async function scanSitemapUrls(sitemapUrl: string): Promise<string[]> {
  try {
    const response = await fetch(sitemapUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${sitemapUrl}: ${response.statusText}`)
    }

    const xml = await response.text()
    const result = await xmlParser.parseStringPromise(xml)

    const urls: string[] = []

    // Handle sitemap index (contains <sitemap> elements)
    if (result.sitemapindex && result.sitemapindex.sitemap) {
      const sitemapEntries = result.sitemapindex.sitemap
      for (const entry of sitemapEntries) {
        if (entry.loc && entry.loc[0]) {
          const nestedUrl = entry.loc[0]
          const nestedUrls = await scanSitemapUrls(nestedUrl) // recursion
          urls.push(...nestedUrls)
        }
      }
      return urls
    }

    // Handle single sitemap (contains <url> elements)
    if (result.urlset && result.urlset.url) {
      const urlEntries = result.urlset.url
      for (const entry of urlEntries) {
        if (entry.loc && entry.loc[0]) {
          urls.push(entry.loc[0])
        }
      }
      return urls
    }

    throw new Error(`Unrecognized sitemap format at ${sitemapUrl}`)
  } catch (err) {
    console.error(err)
    throw new Error(`Error fetching sitemap at ${sitemapUrl}`)
  }
}
