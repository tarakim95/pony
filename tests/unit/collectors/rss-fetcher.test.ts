import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchRssItems } from '@/lib/collectors/rss-fetcher'

const VALID_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Article 1</title>
      <link>https://example.com/1</link>
      <guid>guid-1</guid>
      <description>Description 1</description>
      <content:encoded><![CDATA[<p>Body 1</p>]]></content:encoded>
      <pubDate>Thu, 08 May 2026 10:00:00 +0000</pubDate>
      <dc:creator>Author</dc:creator>
      <category>tech</category>
    </item>
  </channel>
</rss>`

describe('fetchRssItems', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns normalized items on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(VALID_RSS),
    }))
    const { items } = await fetchRssItems('https://example.com/feed')
    expect(items).toHaveLength(1)
    expect(items[0].content.title).toBe('Article 1')
    expect(items[0].external_id).toBe('guid-1')
    expect(items[0].content.body_text).toBe('Body 1')
  })

  it('throws on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    await expect(fetchRssItems('https://example.com/feed')).rejects.toThrow('Network error')
  })

  it('throws on non-200 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    await expect(fetchRssItems('https://example.com/feed')).rejects.toThrow('404')
  })

  it('throws on invalid XML', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('not xml {{{}'),
    }))
    await expect(fetchRssItems('https://example.com/feed')).rejects.toThrow()
  })

  it('skips items with missing title and adds warning', async () => {
    const rssWithBadItem = VALID_RSS.replace('<title>Article 1</title>', '')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(rssWithBadItem),
    }))
    const { items, warnings } = await fetchRssItems('https://example.com/feed')
    expect(items).toHaveLength(0)
    expect(warnings.length).toBeGreaterThan(0)
  })
})
