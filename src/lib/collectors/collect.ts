import 'server-only'
import { SOURCES } from './sources'
import { fetchRssItems } from './rss-fetcher'
import { insertItems } from './insert'

export type SourceResult = {
  fetched: number
  inserted: number
  skipped: number
  errors: string[]
}

export type CollectResult = {
  ok: boolean
  summary: {
    total_fetched: number
    inserted: number
    skipped_duplicates: number
    warnings: number
    errors: number
  }
  by_source: Record<string, SourceResult>
  warnings: string[]
  errors: string[]
}

export async function collectAll(sourceFilter?: string): Promise<CollectResult> {
  const sources = sourceFilter
    ? SOURCES.filter(s => s.source_id === sourceFilter)
    : SOURCES

  const bySource: Record<string, SourceResult> = {}
  const allWarnings: string[] = []
  const allErrors: string[] = []

  for (const source of sources) {
    bySource[source.source_id] = { fetched: 0, inserted: 0, skipped: 0, errors: [] }

    let fetchResult: Awaited<ReturnType<typeof fetchRssItems>>
    try {
      fetchResult = await fetchRssItems(source.rss_url)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      bySource[source.source_id].errors.push(msg)
      allErrors.push(`${source.source_id}: ${msg}`)
      continue
    }

    bySource[source.source_id].fetched = fetchResult.items.length
    for (const w of fetchResult.warnings) {
      allWarnings.push(`${source.source_id}: ${w}`)
    }

    try {
      const { inserted, skipped } = await insertItems(fetchResult.items, source)
      bySource[source.source_id].inserted = inserted
      bySource[source.source_id].skipped = skipped
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      bySource[source.source_id].errors.push(msg)
      allErrors.push(`${source.source_id}: ${msg}`)
    }
  }

  const totalFetched = Object.values(bySource).reduce((s, r) => s + r.fetched, 0)
  const totalInserted = Object.values(bySource).reduce((s, r) => s + r.inserted, 0)
  const totalSkipped = Object.values(bySource).reduce((s, r) => s + r.skipped, 0)

  return {
    ok: allErrors.length === 0,
    summary: {
      total_fetched: totalFetched,
      inserted: totalInserted,
      skipped_duplicates: totalSkipped,
      warnings: allWarnings.length,
      errors: allErrors.length,
    },
    by_source: bySource,
    warnings: allWarnings,
    errors: allErrors,
  }
}
