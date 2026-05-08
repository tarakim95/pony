import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server')

import { insertItems } from '@/lib/collectors/insert'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import type { RssSource } from '@/lib/collectors/sources'
import type { NormalizedItem } from '@/lib/collectors/normalizer'

const source: RssSource = {
  source_type: 'rss',
  source_id: 'theedit',
  rss_url: 'https://the-edit.co.kr/feed',
  name: '디에디트',
}

const makeItem = (id: string): NormalizedItem => ({
  external_id: id,
  content: {
    title: 'Title ' + id,
    url: 'https://example.com/' + id,
    published_at: '2026-05-08T00:00:00Z',
    summary: null,
    body_text: 'body',
    tags: [],
    author: null,
  },
})

function makeAdminMock({
  existingIds = [] as string[],
  insertError = null as { message: string } | null,
  selectError = null as { message: string } | null,
} = {}) {
  const selectChain = {
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({
      data: existingIds.map(id => ({ external_id: id })),
      error: selectError,
    }),
  }

  const insertChain = {
    select: vi.fn().mockResolvedValue({
      data: insertError ? null : [{ id: 'new-id' }],
      error: insertError,
    }),
  }

  const fromMock = vi.fn((table: string) => {
    if (table === 'raw_data') {
      return {
        select: vi.fn().mockReturnValue(selectChain),
        insert: vi.fn().mockReturnValue(insertChain),
      }
    }
  })

  vi.mocked(createAdminSupabaseClient).mockReturnValue({ from: fromMock } as never)
  return fromMock
}

describe('insertItems', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns zero counts for empty items', async () => {
    makeAdminMock()
    const result = await insertItems([], source)
    expect(result).toEqual({ inserted: 0, skipped: 0 })
    expect(createAdminSupabaseClient).not.toHaveBeenCalled()
  })

  it('inserts new items and returns correct count', async () => {
    makeAdminMock({ existingIds: [] })
    const result = await insertItems([makeItem('a1')], source)
    expect(result.inserted).toBe(1)
    expect(result.skipped).toBe(0)
  })

  it('skips already-existing items (partial index dedup)', async () => {
    makeAdminMock({ existingIds: ['a1'] })
    const result = await insertItems([makeItem('a1')], source)
    expect(result.inserted).toBe(0)
    expect(result.skipped).toBe(1)
  })

  it('partially skips: inserts new, skips existing', async () => {
    makeAdminMock({ existingIds: ['a1'] })
    const result = await insertItems([makeItem('a1'), makeItem('a2')], source)
    expect(result.skipped).toBe(1)
    expect(result.inserted).toBe(1)
  })

  it('throws on SELECT error', async () => {
    makeAdminMock({ selectError: { message: 'db down' } })
    await expect(insertItems([makeItem('a1')], source)).rejects.toThrow('raw_data SELECT 실패')
  })

  it('throws on INSERT error', async () => {
    makeAdminMock({ insertError: { message: 'constraint violation' } })
    await expect(insertItems([makeItem('a1')], source)).rejects.toThrow('raw_data INSERT 실패')
  })
})
