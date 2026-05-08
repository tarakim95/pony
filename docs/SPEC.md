# SPEC — Pony (흐름)

> 이 문서가 *진실의 원천*. 코드와 어긋나면 코드를 고친다.

## 1. 문제 정의

### 1-1. 풀려는 문제
현재 큐레이션 뉴스레터들이 못 채우는 갈증: *세상이 어떻게 연결되어 흐르는가*. 표면 사건들이 다 분리된 채로 오고, *밑에 흐르는 공통 흐름*이 안 보임. 시간 누적되면 *흐름의 흐름*(주기 단축, 속도 변화)도 잡고 싶음.

### 1-2. 다른 도구와의 차이
| 기존 큐레이션 뉴스레터 | Pony |
|---|---|
| 분야별 분리 | 분야 막힘 없이 |
| 사건 단위 | *흐름* 단위로 묶음 |
| 단발성 | 시간 누적 + 메타 분석 |
| 일반 대중 | 사용자 맥락 반영 (FOR YOU) |
| 수동적 소비 | 저장 + 메모로 사고 누적 |

### 1-3. 성공 기준
- 4주 후: 매일 1회 이상 들어가서 봄. 메모 누적 시작.
- 8주 후: PWA로 일상 도구화. 30개 이상 메모 누적.
- 12주 후: 메타 패턴 분석이 진짜 통찰을 줌. 마케팅 일에 직접 인용.

---

## 2. 아키텍처

### 2-1. 듀얼 엔진 구조

```
                    ┌─────────────────────┐
                    │   Data Sources      │
                    │  뉴스 / SNS / 검색   │
                    └──────────┬──────────┘
                               │
                ┌──────────────▼──────────────┐
                │    Engine 1 (매일)          │
                │   일일 흐름 감지            │
                │   - 표면 사건 분류           │
                │   - 흐름으로 묶기            │
                │   - 흐름 그룹 매칭           │
                │   - 사용자 함의 생성         │
                └──────────────┬──────────────┘
                               │
                       ┌───────▼───────┐
                       │   Database    │
                       │  (Supabase)   │
                       └───┬───────┬───┘
                           │       │
              ┌────────────┘       └────────────┐
              ▼                                 ▼
   ┌──────────────────┐              ┌──────────────────┐
   │  PWA (Frontend)  │              │  Engine 2 (주1회)│
   │  - 피드 / 디테일  │              │   메타 패턴 분석  │
   │  - 추적 / 저장    │              │  - 흐름의 주기    │
   │  - 메모          │              │  - 속도 변화      │
   └──────────────────┘              │  - 분야 분포      │
                                     └──────────────────┘
```

### 2-2. 엔진 1 (일일 흐름 감지)
- **트리거**: Vercel Cron, 매일 06:00 KST
- **입력**: 지난 24시간 수집 데이터 + 최근 7일 컨텍스트 + 활성 흐름 그룹 목록
- **처리**:
  1. 수집 데이터 → 표면 사건으로 분류 (Haiku)
  2. 사건들 → 흐름으로 묶기 (Haiku)
  3. 각 흐름을 기존 흐름 그룹과 매칭 시도 (벡터 검색 + Haiku 판단)
  4. 매칭되면 `stream_groups` 업데이트, 안 되면 새 그룹 생성
  5. 사용자 함의 생성 (Haiku, user_profile 참조)
- **출력**: `streams`, `events`, `stream_events`, `stream_groups` 테이블 갱신

### 2-3. 엔진 2 (메타 패턴 분석)
- **트리거**: 매주 일요일 22:00 KST
- **입력**: 최근 4주 모든 `stream_groups`의 변화 데이터
- **처리** (Sonnet):
  1. 흐름 그룹별 강도 변화 추세 분석
  2. 분야별 흐름 발생 빈도 변화
  3. 흐름의 평균 *first_detected → peak* 시간 추적 (트렌드 사이클)
  4. 사용자 메모 빈도와 흐름 강도 상관 분석
- **출력**: `meta_insights` 테이블에 주간 리포트 저장

### 2-4. 데이터 흐름

```
NewsAPI/RSS ──┐
SNS API ──────┼──> [Collector] ──> raw_data ──> [Engine 1] ──┐
검색 트렌드 ──┘                                              │
                                                            ▼
                                                    streams + events
                                                            │
                                                            ▼
                                                       PWA UI
                                                            │
                                                            ▼
                                                   사용자 (저장/메모)
                                                            │
                                                            ▼
                                                  saved_streams + notes
```

---

## 3. 데이터 모델

### 3-1. 핵심 테이블

#### `streams` (흐름 카드 한 장)
```sql
id              uuid PK
created_at      timestamptz
date            date              -- 어느 날의 흐름인지
title_ko        text              -- "조용한 이탈"
title_en        text              -- "The Great Quieting"
summary         text              -- 한 줄 요약
analysis_surface text             -- 표면 vs 심층의 표면
analysis_depth   text             -- 심층 분석
analysis_why_now text             -- 왜 지금
for_you         text              -- 사용자 맥락 함의
strength        int               -- 1~10
status          enum              -- 'new' | 'strengthening' | 'continuing' | 'weakening' | 'ended'
group_id        uuid FK -> stream_groups
embedding       vector(1536)      -- 매칭용
user_id         uuid FK -> auth.users
```

#### `events` (표면 사건, 다이어그램의 점)
```sql
id              uuid PK
created_at      timestamptz
date            date
content         text              -- "NYT 구독자 5% 감소"
source_url      text
source_name     text
category        text              -- "SNS" | "셀럽" | ...
embedding       vector(1536)
```

#### `stream_events` (다대다)
```sql
stream_id       uuid FK -> streams
event_id        uuid FK -> events
weight          float             -- 흐름에 대한 기여도
```

#### `stream_groups` (같은 흐름의 시간 묶음)
```sql
id              uuid PK
created_at      timestamptz
canonical_title_ko text            -- 그룹 대표 이름
canonical_title_en text
first_detected  timestamptz
last_active     timestamptz
peak_strength   int
current_strength int
status          enum               -- 'active' | 'dormant' | 'ended'
categories      text[]
embedding       vector(1536)       -- 매칭용
user_id         uuid FK
```

#### `saved_streams`
```sql
user_id         uuid FK
stream_id       uuid FK
saved_at        timestamptz
PRIMARY KEY (user_id, stream_id)
```

#### `notes` ⭐ 사용자 자산
```sql
id              uuid PK
user_id         uuid FK
stream_id       uuid FK -> streams
content         text
tags            text[]              -- "마케팅", "회고", "아이디어" 등
created_at      timestamptz
updated_at      timestamptz
```

#### `user_profile`
```sql
user_id         uuid PK FK
job_context     text                -- "마케터, 캠페인 기획"
interests       text[]
chatgpt_analysis text               -- 사용자 자기 분석
preferences     jsonb               -- 알림 설정 등
updated_at      timestamptz
```

#### `meta_insights` (엔진 2 출력)
```sql
id              uuid PK
created_at      timestamptz
week_start      date
insights        jsonb               -- 구조화된 메타 분석
narrative       text                -- 자연어 요약
user_id         uuid FK
```

#### `raw_data` (수집된 원본)
```sql
id              uuid PK
collected_at    timestamptz
source          text                -- 'newsapi' | 'rss:nytimes' | ...
content         jsonb               -- 원본 그대로
processed       boolean             -- 엔진 1이 처리했는지
```

#### `llm_call_log` (비용 추적)
```sql
id              uuid PK
called_at       timestamptz
model           text
input_tokens    int
output_tokens   int
estimated_cost  numeric(10,6)       -- USD
purpose         text                -- 'engine1' | 'engine2' | 'embedding'
```

### 3-2. 마이그레이션 규칙

- 테이블에 종속된 인덱스는 해당 테이블 정의 파일에 함께 둔다. 별도 인덱스 전용 마이그레이션 파일을 만들지 않는다.

### 3-3. RLS (Row Level Security)
- 모든 사용자 데이터 테이블에 RLS 활성화
- `user_id = auth.uid()` 정책
- `events`, `raw_data`는 공유 가능 (분리하면 비용 절감)

---

## 4. 화면 구조

### 4-1. 탭 구조 (4탭)
1. **피드** (홈) — 그리드 카드 누적
2. **추적** — 흐름 그룹의 시간 변화
3. **저장** — 저장한 흐름 + 내 메모 (토글)
4. **나** — 프로필, 설정, 데이터 export

### 4-2. 화면별 라우트

| 라우트 | 컴포넌트 | 설명 |
|---|---|---|
| `/` | FeedScreen | 그리드 피드 (인스타식) |
| `/stream/[id]` | StreamDetail | 디테일 + 다이어그램 + 메모 |
| `/track` | TrackList | 추적 중인 흐름 그룹 리스트 |
| `/track/[group_id]` | TrackDetail | 한 그룹의 시간 차트 + 이벤트 로그 |
| `/saved` | SavedScreen | 저장 + 메모 토글 |
| `/saved/notes` | NotesView | 메모만 |
| `/me` | ProfileScreen | 프로필, 설정 |
| `/me/onboarding` | Onboarding | 초기 설정 (user_profile 입력) |

### 4-3. 디자인 토큰
- 색: 위 CLAUDE.md 참조
- 폰트: Pretendard만, weight로 위계
- 간격: 4px 기반 grid (4, 8, 12, 16, 20, 24, 32, 48, 64)
- 반경: 8 / 14 / 20 / 100px(pill)

---

## 5. 핵심 기능 명세

### 5-1. 저장 (Save)
- 디테일 화면 우상단 북마크 토글
- 그리드에서 길게 누르기로도 저장 가능 (추후)
- 저장 시 `saved_streams`에 row 추가
- 저장 탭에서 분야별 필터링

### 5-2. 메모 (Note)
- 디테일 화면 하단에 메모 영역
- 한 흐름에 여러 메모 가능
- 메모 본문에 `**bold**` 마크다운 일부 지원
- 태그 추가 가능 (#마케팅, #회고 등)
- 메모 탭에서 전체 검색 + 시간 그룹화

### 5-3. 흐름 그룹 매칭 (어려운 부분)
- 새 흐름 생성 시 다음 순서로 매칭:
  1. 활성 그룹들의 embedding과 코사인 유사도 ≥ 0.85 후보 추리기
  2. 후보들 + 새 흐름을 LLM(Haiku)에 주고 "같은 흐름인가?" 판단
  3. 매칭되면 그룹에 추가 + 그룹 strength 업데이트
  4. 안 되면 새 그룹 생성
- 잘못된 매칭은 사용자가 수동으로 분리/병합 가능 (추후)

### 5-4. 사용자 함의 (FOR YOU)
- `user_profile` 참조해서 흐름 생성 시 함께 작성
- 빈 user_profile이면 함의 섹션 생략
- 온보딩에서 `chatgpt_analysis` 붙여넣기 받기

---

## 6. 비기능 요구사항

### 6-1. 성능
- 피드 화면 첫 페인트 < 1.5s
- 디테일 진입 < 800ms
- 엔진 1 실행 ≤ 5분

### 6-2. 비용
- 일일 LLM 비용 ≤ $1 (3만원/월)
- 월 LLM 비용 ≤ $30
- Supabase 무료 플랜 한도 내

### 6-3. 보안
- RLS로 멀티유저 격리
- 시크릿 환경변수만
- API 라우트는 인증 체크

### 6-4. 백업
- Supabase 자동 일일 백업 (유료 시)
- 무료 플랜이면 주 1회 수동 export
- 메모는 별도 export 가능 (Markdown 변환)

---

## 7. 4주 작업 분해

### Phase 0 (반나절): 골격
- [x] 기획 문서 작성
- [x] 프로젝트 초기화 (Next.js + Tailwind + Supabase)
- [x] `.env.example`, `.gitignore`, `CLAUDE.md`, `progress.md` 배치
- [x] DB 스키마 마이그레이션 1차
- [x] Supabase 연결 확인 (간단한 read 테스트)
- [x] LLM 클라이언트 골격 (callLLM + 한도 + 비용 추적)
- [x] 실제 호출 경로 검증 (GET /api/test-llm → Haiku 4.5 → llm_call_log)

### Phase 1 (Week 1): 동작하는 골격
- [ ] 데이터 수집 1개 소스 (NewsAPI 또는 RSS)
- [ ] 엔진 1 v0 (단순 버전, 흐름 그룹 매칭 빼고)
- [ ] 피드 화면 v0 (그리드 카드만)
- [ ] 모바일에서 한 번 확인
- [ ] **Phase 1 끝: 핸드폰에서 매일 브리핑 받기 시작**

### Phase 2 (Week 2~3): 본 기능
- [ ] 디테일 화면 + 다이어그램
- [ ] 흐름 그룹 매칭 로직
- [ ] 저장 기능
- [ ] 메모 기능 (작성, 조회, 시간 그룹화)
- [ ] 추적 화면 (차트 + 이벤트 로그)
- [ ] 사용자 함의 (FOR YOU)
- [ ] 온보딩 (user_profile 입력)
- [ ] PWA 설정 (홈 화면 추가)

### Phase 3 (Week 4): 정리 + 메타
- [ ] 엔진 2 v1 (데이터 부족해도 인프라만)
- [ ] 디자인 폴리싱
- [ ] 비용 모니터링 대시보드
- [ ] 백업/Export 기능
- [ ] CLAUDE.md, SPEC.md 재검토 및 업데이트

### Phase 4+ (8주차 이후, 검증되면)
- [ ] 흐름 그룹 매칭 정교화
- [ ] 알림 (강한 흐름 발생 시 푸시)
- [ ] React Native 전환 검토 (CLAUDE.md 기준 충족 시)

---

## 8. 결정 미룬 항목 (보류)

- [ ] 데이터 소스 최종 리스트 (Phase 1 시작 시 결정)
- [ ] 흐름 그룹 매칭의 코사인 유사도 임계값 (실측 후 튜닝)
- [ ] 푸시 알림 정책 (Phase 4 검토)
- [ ] 다른 사용자 추가 시점 (8주차 검토)
- [ ] 유료화 여부 (12주차 이후)

---

## 9. 폐기된 아이디어 (참고용)

브레인스토밍 단계에서 검토했으나 채택하지 않은 것들:
- 트렌드 해석 AI (수동 입력 의존 → 동력 부족)
- 가치관 패널 캐릭터 7명 (시각 확장 도구) — 사용 동기 약함으로 판단
- 직감 검증기 — 자기인식 도구 과잉 + 실용 부족
- 가상 SNS 캐릭터 우주 — 흥미로우나 *생산성*과 거리 큼
- 페르소나 토론 — 분석 도구의 보조로는 가능, 메인은 아님

---

## 10. 글로벌 결정 사항

### "왜 PWA 먼저인가"
RN으로 바로 가면 *세팅에 시간 다 씀*. PWA는 1주차에 동작 가능. 전환 기준은 CLAUDE.md 참조.

### "왜 Supabase인가"
- 무료 플랜으로 충분 (개인용)
- pgvector 내장 (별도 벡터 DB 필요 없음)
- RN 클라이언트 있음 (전환 안전)
- RLS로 멀티유저 보안 자동

### "Phase 1에서 모델 확정"
일일 엔진과 메타 엔진의 모델은 Phase 1에서 실측 후 결정. Haiku를 먼저 시도하고 흐름 감지 품질이 충분하면 채택, 부족하면 Sonnet으로 올림. 비용 차이는 있지만 품질이 우선이며, 차이 미미하면 비용 우선.
