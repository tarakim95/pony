import 'server-only'

export interface EmbedParams {
  text: string
  model?: string
}

// Phase 1에서 Voyage AI 또는 OpenAI text-embedding-3-small 결정 후 구현.
// SPEC.md 8 참조.
export async function embed(_params: EmbedParams): Promise<number[]> {
  throw new Error('not implemented yet — Phase 1에서 임베딩 공급자 결정 후 구현')
}
