-- ============================================================
-- 0005: Row Level Security
--
-- 원칙:
--   - 모든 테이블에 RLS 활성화
--   - 사용자 테이블: user_id = auth.uid() 정책
--   - 공유 테이블(events): 인증 사용자 읽기 허용, 쓰기는 service role만
--   - 서버 전용(raw_data, llm_call_log): 사용자 정책 없음 → service role만 접근
--   - stream_events: stream_id → streams.user_id 경로로 소유권 확인
--   - meta_insights: 사용자는 읽기만, 쓰기는 엔진 2(service role)
-- ============================================================

-- ============================================================
-- 공유 테이블
-- ============================================================

-- events: 인증 사용자 읽기 허용 / 쓰기는 service role
alter table public.events enable row level security;

create policy "authenticated users can read events"
  on public.events
  for select
  to authenticated
  using (true);

-- raw_data: service role 전용 (사용자 정책 없음)
alter table public.raw_data enable row level security;

-- llm_call_log: service role 전용 (사용자 정책 없음)
alter table public.llm_call_log enable row level security;

-- ============================================================
-- stream_groups
-- ============================================================
alter table public.stream_groups enable row level security;

create policy "users manage own stream_groups"
  on public.stream_groups
  for all
  to authenticated
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- streams
-- ============================================================
alter table public.streams enable row level security;

create policy "users manage own streams"
  on public.streams
  for all
  to authenticated
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- stream_events (직접 user_id 없음 → stream 소유권 경유)
-- ============================================================
alter table public.stream_events enable row level security;

create policy "users manage own stream_events"
  on public.stream_events
  for all
  to authenticated
  using (
    exists (
      select 1 from public.streams
      where id = stream_events.stream_id
        and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.streams
      where id = stream_events.stream_id
        and user_id = auth.uid()
    )
  );

-- ============================================================
-- saved_streams
-- ============================================================
alter table public.saved_streams enable row level security;

create policy "users manage own saved_streams"
  on public.saved_streams
  for all
  to authenticated
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- notes
-- ============================================================
alter table public.notes enable row level security;

create policy "users manage own notes"
  on public.notes
  for all
  to authenticated
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- user_profile
-- ============================================================
alter table public.user_profile enable row level security;

create policy "users manage own profile"
  on public.user_profile
  for all
  to authenticated
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- meta_insights (읽기만, 쓰기는 엔진 2 service role)
-- ============================================================
alter table public.meta_insights enable row level security;

create policy "users can read own meta_insights"
  on public.meta_insights
  for select
  to authenticated
  using (auth.uid() = user_id);
