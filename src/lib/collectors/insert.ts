import 'server-only'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import type { NormalizedItem } from './normalizer'
import type { RssSource } from './sources'

export async function insertItems(
  items: NormalizedItem[],
  source: RssSource,
): Promise<{ inserted: number; skipped: number }> {
  if (items.length === 0) return { inserted: 0, skipped: 0 }

  const admin = createAdminSupabaseClient()

  const externalIds = items.map(i => i.external_id)

  // 이미 존재하는 external_id 조회 (partial unique index가 ON CONFLICT를 지원 안 함)
  const { data: existing, error: selectError } = await admin
    .from('raw_data')
    .select('external_id')
    .eq('source_type', source.source_type)
    .eq('source_id', source.source_id)
    .in('external_id', externalIds)

  if (selectError) throw new Error(`raw_data SELECT 실패: ${selectError.message}`)

  const existingIds = new Set(
    ((existing ?? []) as Array<{ external_id: string }>).map(r => r.external_id),
  )
  const newItems = items.filter(i => !existingIds.has(i.external_id))
  const skipped = items.length - newItems.length

  if (newItems.length === 0) return { inserted: 0, skipped }

  const rows = newItems.map(item => ({
    source_type: source.source_type,
    source_id: source.source_id,
    source_detail: null as string | null,
    external_id: item.external_id,
    content: item.content,
    processed: false,
  }))

  const { data, error } = await admin
    .from('raw_data')
    .insert(rows)
    .select('id')

  if (error) throw new Error(`raw_data INSERT 실패: ${error.message}`)

  const inserted = data?.length ?? 0
  return { inserted, skipped }
}
