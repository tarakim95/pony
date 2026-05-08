import { NextRequest, NextResponse } from 'next/server'
import { collectAll } from '@/lib/collectors/collect'

export async function POST(req: NextRequest) {
  const expected = process.env.ENGINE_TRIGGER_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'ENGINE_TRIGGER_SECRET 환경변수가 설정되지 않았습니다' },
      { status: 500 },
    )
  }

  const provided = req.headers.get('x-engine-secret')
  if (provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sourceFilter = req.nextUrl.searchParams.get('source') ?? undefined

  const result = await collectAll(sourceFilter)
  return NextResponse.json(result)
}
