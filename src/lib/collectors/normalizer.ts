import { createHash } from 'crypto'
import { parse as parseHtml } from 'node-html-parser'

export type RawDataContent = {
  title: string
  url: string
  published_at: string
  summary: string | null
  body_text: string
  tags: string[]
  author: string | null
}

export type NormalizedItem = {
  external_id: string
  content: RawDataContent
}

// fast-xml-parser는 속성이 있는 태그를 객체로 반환
// 예: <guid isPermaLink="false">URL</guid> → { '#text': 'URL', '@_isPermaLink': 'false' }
type XmlNode = string | Record<string, unknown>

export type RssItemRaw = {
  title?: XmlNode
  link?: XmlNode
  guid?: XmlNode
  description?: string
  'content:encoded'?: string
  pubDate?: string
  category?: string | string[]
  'dc:creator'?: string
  author?: string
}

function extractTextValue(value: XmlNode | undefined): string | null {
  if (!value) return null
  if (typeof value === 'string') return value.trim() || null
  // 속성 있는 태그: { '#text': '...', '@_isPermaLink': 'false' }
  // Atom link:    { '@_href': '...', '@_rel': 'alternate' }
  const text = (value['#text'] ?? value['@_href'])
  return text ? String(text).trim() || null : null
}

export function extractExternalId(
  item: Pick<RssItemRaw, 'guid' | 'link' | 'title' | 'pubDate'>,
): string {
  const guid = extractTextValue(item.guid)
  if (guid) return guid

  const link = extractTextValue(item.link)
  if (link) return link

  const titleStr = typeof item.title === 'string' ? item.title : extractTextValue(item.title) ?? ''
  return createHash('sha256')
    .update(titleStr + (item.pubDate ?? ''))
    .digest('hex')
    .slice(0, 16)
}

function htmlToText(html: string): string {
  const root = parseHtml(html)
  root.querySelectorAll('script, style').forEach(el => el.remove())
  return root.textContent.replace(/\s+/g, ' ').trim()
}

export function normalizeItem(item: RssItemRaw): NormalizedItem {
  const title = extractTextValue(item.title)
  if (!title) throw new Error('RSS item missing title')

  const link = extractTextValue(item.link)
  if (!link) throw new Error('RSS item missing link')

  const encodedBody = typeof item['content:encoded'] === 'string' ? item['content:encoded'] : ''
  const descriptionRaw = typeof item.description === 'string' ? item.description : ''
  const body_text = htmlToText(encodedBody || descriptionRaw)

  const descriptionText = descriptionRaw ? htmlToText(descriptionRaw) : null
  const summary = descriptionText || (body_text ? body_text.slice(0, 200) : null)

  const published_at = item.pubDate
    ? new Date(item.pubDate).toISOString()
    : new Date().toISOString()

  const tags = item.category
    ? Array.isArray(item.category)
      ? item.category
      : [item.category]
    : []

  const author = item['dc:creator'] ?? item.author ?? null

  return {
    external_id: extractExternalId(item),
    content: {
      title,
      url: link,
      published_at,
      summary,
      body_text,
      tags,
      author,
    },
  }
}
