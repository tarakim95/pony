import { XMLParser } from 'fast-xml-parser'
import { normalizeItem } from './normalizer'
import type { NormalizedItem, RssItemRaw } from './normalizer'

const FETCH_TIMEOUT_MS = 10_000

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'item' || name === 'category',
  parseTagValue: false,
  trimValues: true,
})

type FetchResult = {
  items: NormalizedItem[]
  warnings: string[]
}

export async function fetchRssItems(url: string): Promise<FetchResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  let text: string
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`RSS fetch failed: HTTP ${res.status}`)
    text = await res.text()
  } finally {
    clearTimeout(timer)
  }

  const parsed = xmlParser.parse(text)

  const channel = parsed?.rss?.channel
  if (!channel) throw new Error('RSS XML에 <channel>이 없습니다')

  const rawItems: RssItemRaw[] = channel.item ?? []

  const items: NormalizedItem[] = []
  const warnings: string[] = []

  for (const raw of rawItems) {
    try {
      items.push(normalizeItem(raw))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      warnings.push(`item skipped — ${msg}`)
    }
  }

  return { items, warnings }
}
