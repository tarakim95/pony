-- ============================================================
-- 0002: 공유 테이블 (user_id 없음)
--   - events        : 표면 사건 단위
--   - raw_data      : 수집 원본 (처리 전)
--   - llm_call_log  : LLM 비용 추적 전역 로그
--
-- + set_updated_at() 유틸리티 함수 (user_profile, notes에서 사용)
-- ============================================================

-- ============================================================
-- 유틸리티: updated_at 자동 갱신
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- events — 표면 사건 (다이어그램의 점)
-- ============================================================
create table public.events (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  date        date        not null,
  content     text        not null,
  source_url  text,
  source_name text,
  category    text,
  embedding   vector(1536)
);

create index idx_events_date
  on public.events (date desc);

create index idx_events_embedding
  on public.events using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- raw_data — 수집 원본
-- ============================================================
create table public.raw_data (
  id           uuid        primary key default gen_random_uuid(),
  collected_at timestamptz not null default now(),
  source       text        not null,  -- 'newsapi' | 'rss:nytimes' | ...
  content      jsonb       not null,
  processed    boolean     not null default false,
  processed_at timestamptz
);

create index idx_raw_data_unprocessed
  on public.raw_data (collected_at desc)
  where processed = false;

-- ============================================================
-- llm_call_log — LLM 비용 추적
-- ============================================================
create table public.llm_call_log (
  id             uuid          primary key default gen_random_uuid(),
  called_at      timestamptz   not null default now(),
  model          text          not null,
  input_tokens   int           not null default 0,
  output_tokens  int           not null default 0,
  estimated_cost numeric(10,6) not null default 0,  -- USD
  purpose        text          -- 'engine1' | 'engine2' | 'embedding'
);

create index idx_llm_call_log_called_at
  on public.llm_call_log (called_at desc);

create index idx_llm_call_log_purpose
  on public.llm_call_log (purpose, called_at desc);
