-- ============================================================
-- 0003: 사용자 테이블 (모두 user_id 필수)
--   생성 순서 (FK 의존):
--   stream_groups → streams → stream_events
--                           → saved_streams
--                           → notes
--   auth.users    → user_profile
--   auth.users    → meta_insights
-- ============================================================

-- ============================================================
-- Enums
-- ============================================================
create type public.stream_status as enum (
  'new',
  'strengthening',
  'continuing',
  'weakening',
  'ended'
);

create type public.group_status as enum (
  'active',
  'dormant',
  'ended'
);

-- ============================================================
-- stream_groups — 같은 흐름의 시간 묶음 (추적 모드 핵심)
-- streams.group_id → stream_groups.id 이므로 먼저 생성
-- ============================================================
create table public.stream_groups (
  id                 uuid                primary key default gen_random_uuid(),
  created_at         timestamptz         not null default now(),
  user_id            uuid                not null references auth.users on delete cascade,
  canonical_title_ko text                not null,
  canonical_title_en text,
  first_detected     timestamptz         not null default now(),
  last_active        timestamptz         not null default now(),
  peak_strength      int                 not null default 1 check (peak_strength between 1 and 10),
  current_strength   int                 not null default 1 check (current_strength between 1 and 10),
  status             public.group_status not null default 'active',
  categories         text[]              not null default '{}',
  embedding          vector(1536)
);

create index idx_stream_groups_user_status
  on public.stream_groups (user_id, status, last_active desc);

create index idx_stream_groups_embedding
  on public.stream_groups using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- streams — 흐름 카드 한 장
-- ============================================================
create table public.streams (
  id               uuid                 primary key default gen_random_uuid(),
  created_at       timestamptz          not null default now(),
  user_id          uuid                 not null references auth.users on delete cascade,
  date             date                 not null,
  title_ko         text                 not null,
  title_en         text,
  summary          text                 not null,
  analysis_surface text,
  analysis_depth   text,
  analysis_why_now text,
  for_you          text,
  strength         int                  not null default 1 check (strength between 1 and 10),
  status           public.stream_status not null default 'new',
  group_id         uuid                 references public.stream_groups on delete set null,
  embedding        vector(1536)
);

create index idx_streams_user_date
  on public.streams (user_id, date desc);

create index idx_streams_group_id
  on public.streams (group_id);

create index idx_streams_user_status
  on public.streams (user_id, status);

create index idx_streams_embedding
  on public.streams using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- stream_events — streams ↔ events 다대다
-- ============================================================
create table public.stream_events (
  stream_id uuid  not null references public.streams on delete cascade,
  event_id  uuid  not null references public.events  on delete cascade,
  weight    float not null default 1.0,
  primary key (stream_id, event_id)
);

create index idx_stream_events_event_id
  on public.stream_events (event_id);

-- ============================================================
-- saved_streams — 사용자 북마크
-- ============================================================
create table public.saved_streams (
  user_id   uuid        not null references auth.users     on delete cascade,
  stream_id uuid        not null references public.streams on delete cascade,
  saved_at  timestamptz not null default now(),
  primary key (user_id, stream_id)
);

create index idx_saved_streams_stream_id
  on public.saved_streams (stream_id);

-- ============================================================
-- notes — 사용자 메모 ⭐ (사용자 자산, export 가능 구조)
-- ============================================================
create table public.notes (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id    uuid        not null references auth.users     on delete cascade,
  stream_id  uuid        not null references public.streams on delete cascade,
  content    text        not null,
  tags       text[]      not null default '{}'
);

create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

create index idx_notes_user_created
  on public.notes (user_id, created_at desc);

create index idx_notes_stream_id
  on public.notes (stream_id);

create index idx_notes_tags
  on public.notes using gin (tags);

-- ============================================================
-- user_profile — 사용자 맥락 (FOR YOU 생성용)
-- ============================================================
create table public.user_profile (
  user_id          uuid        primary key references auth.users on delete cascade,
  updated_at       timestamptz not null default now(),
  job_context      text,
  interests        text[]      not null default '{}',
  chatgpt_analysis text,
  preferences      jsonb       not null default '{}'
);

create trigger user_profile_updated_at
  before update on public.user_profile
  for each row execute function public.set_updated_at();

-- ============================================================
-- meta_insights — 엔진 2 주간 리포트
-- 쓰기는 service role(엔진 2), 읽기는 해당 user
-- ============================================================
create table public.meta_insights (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id    uuid        not null references auth.users on delete cascade,
  week_start date        not null,
  insights   jsonb       not null,
  narrative  text
);

create index idx_meta_insights_user_week
  on public.meta_insights (user_id, week_start desc);
