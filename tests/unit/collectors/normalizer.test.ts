import { describe, it, expect } from 'vitest'
import { extractExternalId, normalizeItem } from '@/lib/collectors/normalizer'

describe('extractExternalId', () => {
  it('uses guid string when present', () => {
    const id = extractExternalId({ guid: 'guid-001', link: 'https://example.com', title: 'T', pubDate: 'D' })
    expect(id).toBe('guid-001')
  })

  it('uses #text from guid object (isPermaLink attribute case)', () => {
    const id = extractExternalId({
      guid: { '#text': 'https://the-edit.co.kr/?p=85444', '@_isPermaLink': 'false' },
      link: 'https://example.com',
      title: 'T',
      pubDate: 'D',
    })
    expect(id).toBe('https://the-edit.co.kr/?p=85444')
  })

  it('uses link when guid is absent', () => {
    const id = extractExternalId({ link: 'https://example.com/article', title: 'T', pubDate: 'D' })
    expect(id).toBe('https://example.com/article')
  })

  it('uses sha256 fallback when guid and link both absent', () => {
    const id = extractExternalId({ title: 'Hello', pubDate: '2026-01-01' })
    expect(id).toMatch(/^[0-9a-f]{16}$/)
  })


  it('sha256 is deterministic for same input', () => {
    const a = extractExternalId({ title: 'Same', pubDate: '2026-01-01' })
    const b = extractExternalId({ title: 'Same', pubDate: '2026-01-01' })
    expect(a).toBe(b)
  })

  it('sha256 differs for different input', () => {
    const a = extractExternalId({ title: 'A', pubDate: '2026-01-01' })
    const b = extractExternalId({ title: 'B', pubDate: '2026-01-01' })
    expect(a).not.toBe(b)
  })
})

describe('normalizeItem', () => {
  const baseItem = {
    title: 'Test Title',
    link: 'https://example.com/test',
    guid: 'guid-001',
    description: 'Short description',
    'content:encoded': '<p>Full <b>body</b> content here</p>',
    pubDate: 'Thu, 08 May 2026 10:00:00 +0000',
    category: ['tech', 'culture'],
    'dc:creator': 'Author Name',
  }

  it('maps all fields correctly', () => {
    const result = normalizeItem(baseItem)
    expect(result.content.title).toBe('Test Title')
    expect(result.content.url).toBe('https://example.com/test')
    expect(result.external_id).toBe('guid-001')
    expect(result.content.author).toBe('Author Name')
    expect(result.content.tags).toEqual(['tech', 'culture'])
    expect(result.content.body_text).toBe('Full body content here')
  })

  it('sets summary from description when present', () => {
    const result = normalizeItem(baseItem)
    expect(result.content.summary).toBe('Short description')
  })

  it('falls back to first 200 chars of body_text when description absent', () => {
    const longBody = '<p>' + 'x'.repeat(300) + '</p>'
    const item = { ...baseItem, description: undefined, 'content:encoded': longBody }
    const result = normalizeItem(item)
    expect(result.content.summary).not.toBeNull()
    expect(result.content.summary!.length).toBeLessThanOrEqual(200)
  })

  it('handles single category string (not array)', () => {
    const result = normalizeItem({ ...baseItem, category: 'tech' })
    expect(result.content.tags).toEqual(['tech'])
  })

  it('returns empty tags array when category absent', () => {
    const result = normalizeItem({ ...baseItem, category: undefined })
    expect(result.content.tags).toEqual([])
  })

  it('returns null author when dc:creator absent', () => {
    const result = normalizeItem({ ...baseItem, 'dc:creator': undefined })
    expect(result.content.author).toBeNull()
  })

  it('parses pubDate to ISO 8601', () => {
    const result = normalizeItem(baseItem)
    expect(() => new Date(result.content.published_at)).not.toThrow()
    expect(result.content.published_at).toContain('2026')
  })

  it('extracts external_id from object-style guid (isPermaLink attribute)', () => {
    const item = {
      ...baseItem,
      guid: { '#text': 'https://the-edit.co.kr/?p=85444', '@_isPermaLink': 'false' },
    }
    const result = normalizeItem(item)
    expect(result.external_id).toBe('https://the-edit.co.kr/?p=85444')
  })

  it('throws when title absent', () => {
    expect(() => normalizeItem({ ...baseItem, title: undefined })).toThrow()
  })

  it('throws when link absent', () => {
    expect(() => normalizeItem({ ...baseItem, link: undefined })).toThrow()
  })
})
