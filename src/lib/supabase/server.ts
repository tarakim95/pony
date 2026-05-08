import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.')
  return url
}

/**
 * Server Component / Route Handler 용 — 쿠키 기반 세션.
 * 인증이 필요한 서버 코드에서 사용.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.')

  return createServerClient<Database>(getSupabaseUrl(), anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      },
    },
  })
}

/**
 * 서버 전용 어드민 클라이언트 — RLS 우회, 크론/엔진에서만 사용.
 * 절대 클라이언트 컴포넌트에서 import 하지 말 것.
 */
export function createAdminSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.')

  return createClient<Database>(getSupabaseUrl(), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
