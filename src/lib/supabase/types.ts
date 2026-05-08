/**
 * 자동 생성 명령: npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts
 * 마이그레이션 후 재생성할 것. 그때까지는 아래 loose placeholder 유지.
 *
 * NOTE: any를 쓰는 이유 —
 *   Views/Functions를 Record<string, unknown>으로 두면
 *   supabase-js의 Schema extends GenericSchema 조건 타입이 never를 반환해
 *   from().insert() 등 모든 호출이 never[]로 추론된다.
 *   실제 스키마 타입 생성(npx supabase gen types) 후 any는 사라진다.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type TableDef    = { Row: any; Insert: any; Update: any; Relationships: any }
type FunctionDef = { Args: any; Returns: any }

export type Database = {
  public: {
    Tables:    Record<string, TableDef>
    Views:     Record<string, TableDef>
    Functions: Record<string, FunctionDef>
    Enums:     Record<string, unknown>
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
