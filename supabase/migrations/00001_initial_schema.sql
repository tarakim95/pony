-- Pony — Initial Schema
-- 2026-05-08

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- ============================================================
-- USER PROFILE
-- ============================================================
create table public.user_profile (
  user_id uuid primary key references auth.users on delete cascade,
  job_context text,
  interests text[] default '{}',
  chatgpt_analysis text,
  preferences jsonb default '{}',
  updated_at timestamptz default now()
);

alter table public.user_profile enable row level security;
create policy "users see own profile" on public.user_profile
  for all using (auth.uid() = user_id);

-- ============================================================
-- RAW DATA (수집된 원본)
-- ============================================================
create table public.raw_data (
  id uuid primary key default uuid_generate_v4(),
  collected_at timestamptz default now(),
  source text not null,
  content jsonb not null,
  processed boolean default false,
  processed_at timestamptz
);

create index idx_raw_data_unprocessed on public.raw_data(collected_at) where processed = false;

-- ============================================================
-- EVENTS (표면 사건)
-- ============================================================
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  date date not null,
  content text not null,
  source_url text,
  source_name text,
  category text,
  embedding vector(1536)
);

create index idx_events_date on public.events(date desc);
create index idx_events_embedding on public.events using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ============================================================
-- STREAM GROUPS (시간 묶음)
-- ============================================================
create table public.stream_groups (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  user_id uuid references auth.users on delete cascade not null,
  canonical_title_ko text not null,
  canonical_title_en text,
  first_detected timestamptz default now(),
  last_active timestamptz default now(),
  peak_strength int default 1,
  current_strength int default 1,
  status text check (status in ('active', 'dormant', 'ended')) default 'active',
  categories text[] default '{}',
  embedding vector(1536)
);

create index idx_stream_groups_user_active on public.stream_groups(user_id, status, last_active desc);
create index idx_stream_groups_embedding on public.stream_groups using ivfflat (embedding vector_cosine_ops) with (lists = 50);

alter table public.stream_groups enable row level security;
create policy "users see own groups" on public.stream_groups
  for all using (auth.uid() = user_id);

-- ============================================================
-- STREAMS (흐름 카드)
-- ============================================================
create table public.streams (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  title_ko text not null,
  title_en text,
  summary text not null,
  analysis_surface text,
  analysis_depth text,
  analysis_why_now text,
  for_you text,
  strength int check (strength between 1 and 10) default 1,
  status text check (status in ('new', 'strengthening', 'continuing', 'weakening', 'ended')) default 'new',
  group_id uuid references public.stream_groups on delete set null,
  embedding vector(1536)
);

create index idx_streams_user_date on public.streams(user_id, date desc);
create index idx_streams_group on public.streams(group_id);
create index idx_streams_embedding on public.streams using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table public.streams enable row level security;
create policy "users see own streams" on public.streams
  for all using (auth.uid() = user_id);

-- ============================================================
-- STREAM ↔ EVENTS (다대다)
-- ============================================================
create table public.stream_events (
  stream_id uuid references public.streams on delete cascade,
  event_id uuid references public.events on delete cascade,
  weight float default 1.0,
  primary key (stream_id, event_id)
);

create index idx_stream_events_event on public.stream_events(event_id);

-- ============================================================
-- SAVED STREAMS
-- ============================================================
create table public.saved_streams (
  user_id uuid references auth.users on delete cascade,
  stream_id uuid references public.streams on delete cascade,
  saved_at timestamptz default now(),
  primary key (user_id, stream_id)
);

alter table public.saved_streams enable row level security;
create policy "users manage own saves" on public.saved_streams
  for all using (auth.uid() = user_id);

-- ============================================================
-- NOTES (사용자 자산 ⭐)
-- ============================================================
create table public.notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  stream_id uuid references public.streams on delete cascade not null,
  content text not null,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_notes_user_created on public.notes(user_id, created_at desc);
create index idx_notes_stream on public.notes(stream_id);
create index idx_notes_tags on public.notes using gin(tags);

alter table public.notes enable row level security;
create policy "users manage own notes" on public.notes
  for all using (auth.uid() = user_id);

-- ============================================================
-- META INSIGHTS (엔진 2 출력)
-- ============================================================
create table public.meta_insights (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  user_id uuid references auth.users on delete cascade not null,
  week_start date not null,
  insights jsonb not null,
  narrative text
);

create index idx_meta_insights_user_week on public.meta_insights(user_id, week_start desc);

alter table public.meta_insights enable row level security;
create policy "users see own meta" on public.meta_insights
  for all using (auth.uid() = user_id);

-- ============================================================
-- LLM CALL LOG (비용 추적)
-- ============================================================
create table public.llm_call_log (
  id uuid primary key default uuid_generate_v4(),
  called_at timestamptz default now(),
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  estimated_cost numeric(10,6) not null default 0,
  purpose text,
  user_id uuid references auth.users on delete set null
);

create index idx_llm_log_called on public.llm_call_log(called_at desc);
create index idx_llm_log_user_day on public.llm_call_log(user_id, called_at desc);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_profile_updated before update on public.user_profile
  for each row execute function public.set_updated_at();

create trigger notes_updated before update on public.notes
  for each row execute function public.set_updated_at();
