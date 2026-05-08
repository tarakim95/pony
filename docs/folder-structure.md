# 폴더 구조

```
pony/
├── CLAUDE.md                       # 원칙. 매 세션 시작 시 읽음
├── progress.md                     # 진행 상태. 매 작업 끝에 갱신
├── README.md                       # 프로젝트 소개 (간단히)
├── .env.example                    # 환경변수 템플릿 (커밋됨)
├── .env.local                      # 실제 값 (커밋 안 됨)
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
│
├── docs/
│   ├── SPEC.md                     # 전체 기획안 (진실의 원천)
│   ├── learnings.md                # 실수 기록
│   ├── decisions/                  # 큰 결정 기록 (ADR 형식)
│   │   └── 0001-pwa-first.md
│   └── flow-charts/                # 플로우차트 (필요 시)
│
├── supabase/
│   ├── migrations/                 # SQL 마이그레이션
│   │   └── 00001_initial_schema.sql
│   └── seed.sql                    # 개발용 시드 데이터
│
├── src/
│   ├── app/                        # Next.js 15 App Router
│   │   ├── layout.tsx              # 루트 레이아웃 + 폰트
│   │   ├── page.tsx                # /  (FeedScreen)
│   │   ├── globals.css             # CSS 변수 + Tailwind
│   │   │
│   │   ├── stream/[id]/
│   │   │   └── page.tsx            # 디테일
│   │   ├── track/
│   │   │   ├── page.tsx
│   │   │   └── [groupId]/page.tsx
│   │   ├── saved/
│   │   │   ├── page.tsx
│   │   │   └── notes/page.tsx
│   │   ├── me/
│   │   │   ├── page.tsx
│   │   │   └── onboarding/page.tsx
│   │   │
│   │   └── api/
│   │       ├── cron/
│   │       │   ├── daily/route.ts  # 엔진 1
│   │       │   └── weekly/route.ts # 엔진 2
│   │       ├── notes/route.ts
│   │       └── saved/route.ts
│   │
│   ├── components/
│   │   ├── feed/                   # 피드 화면 컴포넌트
│   │   │   ├── GridCard.tsx
│   │   │   ├── FeatureCard.tsx
│   │   │   ├── StoriesStrip.tsx
│   │   │   └── DayDivider.tsx
│   │   ├── stream/                 # 디테일 컴포넌트
│   │   │   ├── PostHero.tsx
│   │   │   ├── DiagramCanvas.tsx
│   │   │   ├── ForYouBox.tsx
│   │   │   └── NoteSection.tsx
│   │   ├── track/
│   │   │   ├── StrengthChart.tsx
│   │   │   ├── EventTimeline.tsx
│   │   │   └── TrackCard.tsx
│   │   ├── saved/
│   │   │   ├── SavedCard.tsx
│   │   │   └── NoteCard.tsx
│   │   ├── shared/
│   │   │   ├── TabBar.tsx
│   │   │   ├── AppHeader.tsx
│   │   │   └── StatusBar.tsx
│   │   └── ui/                     # shadcn/ui 컴포넌트들
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # 클라이언트용
│   │   │   ├── server.ts           # 서버용
│   │   │   └── types.ts            # 자동 생성된 DB 타입
│   │   ├── llm/
│   │   │   ├── client.ts           # 모든 LLM 호출 게이트웨이 (비용 추적 포함)
│   │   │   ├── prompts/            # 프롬프트 모음 (정적, 캐싱)
│   │   │   │   ├── classify-event.ts
│   │   │   │   ├── form-stream.ts
│   │   │   │   ├── match-group.ts
│   │   │   │   └── for-you.ts
│   │   │   └── schemas.ts          # Zod 스키마 (응답 검증)
│   │   ├── engines/
│   │   │   ├── daily.ts            # 엔진 1
│   │   │   └── weekly.ts           # 엔진 2
│   │   ├── collectors/
│   │   │   ├── newsapi.ts
│   │   │   └── rss.ts
│   │   └── utils/
│   │       ├── date.ts
│   │       └── strength.ts
│   │
│   ├── hooks/                      # React 커스텀 훅
│   │   ├── useStreams.ts
│   │   ├── useNotes.ts
│   │   └── useSaved.ts
│   │
│   └── types/                      # 도메인 타입
│       ├── stream.ts
│       ├── event.ts
│       └── note.ts
│
├── tests/
│   ├── unit/                       # 단위 테스트
│   │   ├── llm/
│   │   ├── engines/
│   │   └── utils/
│   ├── integration/                # 통합 테스트
│   └── fixtures/                   # 테스트용 픽스처
│
└── scripts/
    ├── seed-dev.ts                 # 개발 DB 시드
    ├── export-notes.ts             # 메모 export
    └── cost-report.ts              # 비용 리포트
```

## 폴더 원칙

### `src/app/` - Next.js 라우팅
- 한 라우트 = 한 폴더
- `page.tsx`만 라우팅 진입점, 나머지는 `components/`에서 가져옴

### `src/components/` - 화면별로 분리
- 한 화면 = 한 폴더
- 여러 화면에서 쓰면 `shared/`로
- shadcn/ui 컴포넌트는 `ui/`로 격리

### `src/lib/` - 도메인 로직
- 화면과 분리. UI 변경에 영향 안 받음.
- LLM 호출은 *반드시* `lib/llm/client.ts`를 거침

### `tests/` - 테스트
- 코드와 1:1 미러 구조
- 픽스처는 `fixtures/`에 (LLM 응답 예시 등)
