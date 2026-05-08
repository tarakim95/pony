import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export type LLMPurpose = 'engine1' | 'engine2' | 'embedding' | 'test'

export interface CallLLMParams {
  model: string
  system?: string
  messages: Anthropic.MessageParam[]
  purpose: LLMPurpose
  maxTokens?: number
}

// 출처: https://platform.claude.com/docs/en/docs/about-claude/models/overview
// 단위: USD per token (= per MTok 가격 / 1_000_000)
const MODEL_PRICING: Record<string, { inputPerToken: number; outputPerToken: number }> = {
  'claude-haiku-4-5':          { inputPerToken: 1 / 1_000_000, outputPerToken:  5 / 1_000_000 },
  'claude-haiku-4-5-20251001': { inputPerToken: 1 / 1_000_000, outputPerToken:  5 / 1_000_000 },
  'claude-sonnet-4-6':         { inputPerToken: 3 / 1_000_000, outputPerToken: 15 / 1_000_000 },
}

const DAILY_CALL_LIMIT   = Number(process.env.LLM_DAILY_CALL_LIMIT ?? '100')
const MONTHLY_CALL_LIMIT = 2_000

function computeCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model]
  if (!pricing) return 0
  return inputTokens * pricing.inputPerToken + outputTokens * pricing.outputPerToken
}

async function checkLimits(): Promise<void> {
  const admin = createAdminSupabaseClient()
  const now = new Date()
  const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { count: dailyCount, error: dailyError } = await admin
    .from('llm_call_log')
    .select('*', { count: 'exact', head: true })
    .gte('called_at', todayStart)

  if (dailyError) throw new Error(`LLM 한도 조회 실패: ${dailyError.message}`)
  if ((dailyCount ?? 0) >= DAILY_CALL_LIMIT) {
    throw new Error(`LLM 일일 호출 한도 초과 (${DAILY_CALL_LIMIT}회/일)`)
  }

  const { count: monthlyCount, error: monthlyError } = await admin
    .from('llm_call_log')
    .select('*', { count: 'exact', head: true })
    .gte('called_at', monthStart)

  if (monthlyError) throw new Error(`LLM 한도 조회 실패: ${monthlyError.message}`)
  if ((monthlyCount ?? 0) >= MONTHLY_CALL_LIMIT) {
    throw new Error(`LLM 월 호출 한도 초과 (${MONTHLY_CALL_LIMIT}회/월)`)
  }
}

async function logCall(
  model: string,
  inputTokens: number,
  outputTokens: number,
  estimatedCost: number,
  purpose: LLMPurpose,
): Promise<void> {
  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('llm_call_log').insert({
    model,
    input_tokens:   inputTokens,
    output_tokens:  outputTokens,
    estimated_cost: estimatedCost,
    purpose,
  })
  if (error) throw new Error(`LLM 로그 기록 실패: ${error.message}`)
}

export async function callLLM({
  model,
  system,
  messages,
  purpose,
  maxTokens = 4096,
}: CallLLMParams): Promise<Anthropic.Message> {
  await checkLimits()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.')

  const anthropic = new Anthropic({ apiKey })

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages,
  })

  const { input_tokens: inputTokens, output_tokens: outputTokens } = response.usage
  await logCall(model, inputTokens, outputTokens, computeCost(model, inputTokens, outputTokens), purpose)

  return response
}
