import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createAdminSupabaseClient: vi.fn() }))
vi.mock('@/lib/collectors/rss-fetcher')
vi.mock('@/lib/collectors/insert')

import { collectAll } from '@/lib/collectors/collect'
import { fetchRssItems } from '@/lib/collectors/rss-fetcher'
import { insertItems } from '@/lib/collectors/insert'

const makeItem = (id: string) => ({
  external_id: id,
  content: {
    title: 'T',
    url: 'https://example.com/' + id,
    published_at: '2026-05-08T00:00:00Z',
    summary: null,
    body_text: 'body',
    tags: [] as string[],
    author: null,
  },
})

describe('collectAll', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('continues when one source fails, other succeeds', async () => {
    vi.mocked(fetchRssItems)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ items: [makeItem('u1')], warnings: [] })
    vi.mocked(insertItems).mockResolvedValue({ inserted: 1, skipped: 0 })

    const result = await collectAll()

    expect(result.by_source['theedit'].errors).toHaveLength(1)
    expect(result.by_source['uppity'].inserted).toBe(1)
    expect(result.summary.errors).toBe(1)
    expect(result.summary.inserted).toBe(1)
  })

  it('reflects skipped_duplicates count', async () => {
    vi.mocked(fetchRssItems).mockResolvedValue({ items: [makeItem('e1')], warnings: [] })
    vi.mocked(insertItems).mockResolvedValue({ inserted: 0, skipped: 1 })

    const result = await collectAll()

    expect(result.summary.skipped_duplicates).toBe(2)
    expect(result.summary.inserted).toBe(0)
  })

  it('filters to single source when sourceFilter provided', async () => {
    vi.mocked(fetchRssItems).mockResolvedValue({ items: [makeItem('e1')], warnings: [] })
    vi.mocked(insertItems).mockResolvedValue({ inserted: 1, skipped: 0 })

    const result = await collectAll('theedit')

    expect(Object.keys(result.by_source)).toEqual(['theedit'])
    expect(vi.mocked(fetchRssItems)).toHaveBeenCalledTimes(1)
  })

  it('propagates item-level warnings from fetcher', async () => {
    vi.mocked(fetchRssItems).mockResolvedValue({
      items: [],
      warnings: ['theedit: item skipped — missing title'],
    })
    vi.mocked(insertItems).mockResolvedValue({ inserted: 0, skipped: 0 })

    const result = await collectAll()

    expect(result.warnings.some(w => w.includes('missing title'))).toBe(true)
  })

  it('returns ok: false when any error occurred', async () => {
    vi.mocked(fetchRssItems).mockRejectedValue(new Error('fail'))
    const result = await collectAll()
    expect(result.ok).toBe(false)
  })

  it('returns ok: true when all succeed', async () => {
    vi.mocked(fetchRssItems).mockResolvedValue({ items: [], warnings: [] })
    vi.mocked(insertItems).mockResolvedValue({ inserted: 0, skipped: 0 })
    const result = await collectAll()
    expect(result.ok).toBe(true)
  })
})
