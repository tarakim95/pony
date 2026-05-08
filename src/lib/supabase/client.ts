import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 .env.local에 없습니다.'
    )
  }

  return createBrowserClient<Database>(url, key)
}
