/**
 * Supabase 연결 테스트 스크립트
 * 실행: npx tsx scripts/test-connection.ts
 *
 * .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * SUPABASE_SERVICE_ROLE_KEY가 설정된 후 실행.
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function check(label: string, value: string | undefined): void {
  if (!value || value.startsWith('your-') || value.startsWith('https://your-')) {
    console.error(`  ✗ ${label}: 미설정 (placeholder 값)`)
    process.exitCode = 1
  } else {
    console.log(`  ✓ ${label}: 설정됨`)
  }
}

async function testAnonConnection(supabaseUrl: string, key: string): Promise<void> {
  const client = createClient(supabaseUrl, key)
  // auth.getSession()은 DB 연결 없이 Supabase 서버에 닿는 가장 가벼운 호출
  const { error } = await client.auth.getSession()
  if (error) throw error
  console.log('  ✓ anon 연결 성공')
}

async function testAdminConnection(supabaseUrl: string, key: string): Promise<void> {
  const admin = createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  // 존재하지 않는 테이블 조회 → 연결은 되지만 테이블 없음 에러 반환 → DB 도달 확인
  const { error } = await admin.from('streams').select('id').limit(1)
  // PGRST116, PGRST205 = 테이블/뷰 미존재 → DB에는 도달한 것
  const tableNotFound =
    error?.code === 'PGRST116' ||
    error?.code === 'PGRST205' ||
    error?.message.includes('relation') === true
  if (error && !tableNotFound) {
    throw error
  }
  console.log('  ✓ service_role 연결 성공 (테이블은 마이그레이션 후 생성됩니다)')
}

async function main(): Promise<void> {
  console.log('\n🐎 Pony — Supabase 연결 테스트\n')

  console.log('[1] 환경변수 확인')
  check('NEXT_PUBLIC_SUPABASE_URL', url)
  check('NEXT_PUBLIC_SUPABASE_ANON_KEY', anonKey)
  check('SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey)

  if (process.exitCode === 1) {
    console.log('\n  → .env.local 파일을 먼저 채워주세요.\n')
    return
  }

  console.log('\n[2] anon 연결 테스트')
  try {
    await testAnonConnection(url!, anonKey!)
  } catch (err) {
    console.error('  ✗ anon 연결 실패:', err)
    process.exitCode = 1
  }

  console.log('\n[3] service_role 연결 테스트')
  try {
    await testAdminConnection(url!, serviceRoleKey!)
  } catch (err) {
    console.error('  ✗ service_role 연결 실패:', err)
    process.exitCode = 1
  }

  console.log(process.exitCode === 1 ? '\n❌ 일부 테스트 실패\n' : '\n✅ 모두 통과\n')
}

main()
