import { describe, it, expect, vi, beforeEach } from 'vitest'

// server-only는 Node.js 환경에서 no-op
vi.mock('server-only', () => ({}))

// next/headers 포함 전체 서버 모듈 mock
vi.mock('@/lib/supabase/server', () => ({
  createAdminSupabaseClient: vi.fn(),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        usage: { input_tokens: 100, output_tokens: 50 },
        content: [{ type: 'text', text: 'ok' }],
        stop_reason: 'end_turn',
      }),
    }
  },
}))

import { callLLM } from '@/lib/llm/client'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

function makeAdminMock(dailyCount: number, monthlyCount = 0) {
  let callIdx = 0
  vi.mocked(createAdminSupabaseClient).mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockImplementation(() => {
          const count = callIdx++ === 0 ? dailyCount : monthlyCount
          return Promise.resolve({ count, error: null })
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  } as unknown as ReturnType<typeof createAdminSupabaseClient>)
}

describe('callLLM 한도 체크', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  it('일일 호출 수 >= 한도이면 API를 부르지 않고 throw한다', async () => {
    makeAdminMock(100) // 기본 한도 100 — 이미 가득 참

    await expect(
      callLLM({
        model: 'claude-haiku-4-5',
        messages: [{ role: 'user', content: 'test' }],
        purpose: 'test',
      }),
    ).rejects.toThrow('일일 호출 한도 초과')
  })

  it('월 호출 수 >= 한도이면 throw한다', async () => {
    makeAdminMock(0, 2000) // 일일 여유, 월 가득

    await expect(
      callLLM({
        model: 'claude-haiku-4-5',
        messages: [{ role: 'user', content: 'test' }],
        purpose: 'test',
      }),
    ).rejects.toThrow('월 호출 한도 초과')
  })
})
