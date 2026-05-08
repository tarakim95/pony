# Progress

> 매 작업 끝에 갱신. 다음 세션이 이 파일만 읽고 이어갈 수 있도록.

## 마지막 업데이트
2026-05-08 — 1A-0 (raw_data 스키마 정규화) 완료.

## 현재 Phase
**Phase 1**: 동작하는 골격 (시작 전)

## 직전 작업 (Phase 1A-0: raw_data 스키마 정규화)
- raw_data 컬럼 분리: source → (source_type, source_id, source_detail, external_id)
- dedup unique 인덱스: (source_type, source_id, external_id) WHERE external_id IS NOT NULL
- SPEC.md raw_data 섹션 + 명명 규칙 섹션(3-2) 갱신
- 무료 단일 DB 환경: Supabase SQL Editor에서 BEGIN/COMMIT 직접 적용 + dedup INSERT 테스트 통과
- feat/raw-data-normalize 브랜치 (커밋 555c1a0), main 머지 대기

## 지금 상태
- Next.js 15 + Tailwind v4 + Pretendard ✅
- Supabase 연결 + 마이그레이션 5개 (10 테이블) ✅
- LLM callLLM() — 한도/비용/로깅, Vitest 2/2 ✅
- 실 호출 경로 검증 완료 ✅
- main 브랜치 = phase-0-done tag ✅

## 다음 할 일 (우선순위 순)
1. [ ] Phase 1A-1: RSS 데이터 수집기 (트리거 방식/매체 URL 등 결정 후 명세화)
2. [ ] Phase 1A-2: 분류 (raw_data → events)
3. [ ] Phase 1A-3: 묶기 (events → streams) — 엔진 1 v0
4. [ ] Phase 1B: 피드 화면 v0 (1A 사용자 검증 통과 후)

## 참고: Tailwind v4 변경사항
- `tailwind.config.ts` 없음 → `globals.css`의 `@theme inline {}` 블록으로 대체
- `@import "tailwindcss"` 하나로 base/components/utilities 모두 포함
- 색상 접두사 예시: `bg-espresso`, `text-peony`, `bg-linen-warm`

## 막힌 곳 / 결정 미룬 항목
- 코사인 유사도 임계값: 실측 후 결정.
- 자동 실행 엔진 모델 (Haiku vs Sonnet): Phase 1 실측 후 결정.
- 영문 트렌드/문화 매체 추가: 1A 검증 통과 후 검토.
- **이메일 뉴스레터 수집 (캐릿 등 RSS 없는 매체용): 1A 검증 후 별도 Phase에서 검토. 가능 방식 = Gmail API or SendGrid Inbound. 1A 범위에 넣지 않음.**

## 다음 세션 시작 시 읽을 순서
1. `CLAUDE.md` (원칙)
2. 이 파일 (`progress.md`)
3. `docs/learnings.md` (실수 기록)
4. `docs/SPEC.md` (필요 시)
5. 작업 관련 코드

## Phase 1 진입 합의 (Claude.ai 채팅에서 결정)

- **진행 방식**: Phase 1A (수집 + 엔진 1) → 사용자 검증 → Phase 1B (화면 + 모바일) 로 분리. SPEC.md "7. 4주 작업 분해"의 Phase 1을 두 단계로 쪼갠 것.
- **분리 이유**: 화면 만들기 전에 흐름 감지 품질을 raw 데이터로 검증. 예쁜 쓰레기 방지.
- **데이터 소스 (RSS 2개, 한국 트렌드 결)**:
  - 디에디트 the-edit.co.kr/feed (라이프스타일/제품/공간)
  - 어피티 uppity.co.kr/feed (돈/커리어/생활경제)
  - 변경 사유: "분야 막힘 없음" → "한국 2030 도시 직장인 신호"로 결 재정의 (사용자 실제 소비 매체 기준)
  - 4개 → 2개 축소: 사용자가 실제로 매주 보는 매체 우선. 안 보는 매체로 4개 채우는 것보다 안전.
- **트리거 방식**: Vercel Cron 대신 수동 API Route + 헤더 시크릿(`ENGINE_TRIGGER_SECRET`). 프롬프트 튜닝 단계라 즉시 재실행 가능해야 함. Cron은 Phase 1B 마지막에 추가.
- **Phase 1A 끝 조건 (DoD)**:
  1. raw_data에 디에디트+어피티 1~2주치 데이터 누적 (목표: 기사 10건 이상). 두 매체 다 주간 발행이라 일간 누적 불가 — 건수 기준으로 변경.
  2. events 테이블에 표면 사건 추출됨
  3. streams 테이블에 흐름 카드 N개 생성 (N은 자연스럽게)
  4. 사용자가 Supabase Studio에서 streams row 5개 정도 읽고 다음 셋 중 하나로 판단:
     - "흐름이 보인다" → 1B 진입
     - "프롬프트 갈면 더 좋겠다" → 1회 갈고 재실행
     - "쓰레기다" → 멈추고 회고
  5. 흐름 그룹 매칭 (stream_groups)은 빼고 단발 실행만. Phase 2에서 추가.
- **1A 작업 분해**: 1A-1 (수집기) → 1A-2 (분류, raw_data → events) → 1A-3 (묶기, events → streams). 각 단계 사이에 사용자 검증 포인트.

## Phase별 진행률
- Phase 0: ██████████ 100% ✅
- Phase 1: ▱▱▱▱▱▱▱▱▱▱ 0%
- Phase 2: ▱▱▱▱▱▱▱▱▱▱ 0%
- Phase 3: ▱▱▱▱▱▱▱▱▱▱ 0%

---

## 변경 이력 (최신이 위)

### 2026-05-08 (밤) — 1A 매체 라인업 재정의
- "분야 막힘 없음" → "한국 2030 도시 직장인 신호"로 결 재정의
- 매체: 연합/한겨레/NYT/Verge → 디에디트/어피티 (RSS 조사 결과 + 사용자 실제 소비 매체 기준)
- 캐릿: RSS 없음 (이메일 뉴스레터만) → 1A 제외, 후속 Phase에서 검토
- DoD: "4개 매체 24시간치" → "2개 매체 10건 이상" (주간 매체 특성 반영)

### 2026-05-08 (밤) — 1A-0 raw_data 정규화
- raw_data: source 한 컬럼을 (source_type, source_id, source_detail, external_id) 4개로 분리
- dedup partial unique index 추가
- SPEC.md raw_data 섹션 + 명명 규칙 섹션 갱신
- 무료 단일 DB → BEGIN/COMMIT + 즉시 동작 테스트 패턴 확립 (learnings에 기록)
- feat/raw-data-normalize 브랜치, main 머지 대기

### 2026-05-08 (저녁)
- Phase 0 완료 (10 테이블 + RLS + LLM 클라이언트 + 실호출 검증 통과)
- main에 squash merge, phase-0-done 태그
- Phase 1 분리 결정: 1A (수집+엔진) / 1B (화면)
- RSS 4개 확정: 연합 / 한겨레 / NYT / The Verge

### 2026-05-08 (Phase 0 마감)
- GET /api/test-llm 실 호출 검증 → 통과 → 라우트 삭제
- SPEC.md Phase 0 항목 [x] 완료
- learnings.md 추가: mock 통과 ≠ 동작 검증
- feat/phase-0-init → main squash merge, tag phase-0-done

### 2026-05-08 (LLM 클라이언트 골격)
- callLLM() 한도 체크 + 비용 로깅 + Vitest 2/2 통과
- types.ts: Views/Functions 타입 수정 (GenericSchema never 버그)
- tsc --noEmit 클린

### 2026-05-08 (Phase 0 Step 1-4)
- Next.js 15.5.18 초기화 (npm, temp dir → pony/ 이관 방식)
  - npm 캐시 권한 오류 → `npm_config_cache=/tmp/npm-cache` 우회
  - 기존 파일(CLAUDE.md, docs/, supabase/) 보존
- Tailwind v4 색상 토큰: espresso/peony/linen/cream 계열 7색 + 시멘틱 변수
- Pretendard CDN, metadata 업데이트
- 디렉토리 구조 전체 생성

### 2026-05-08 (오후)
- 작업 디렉토리 평탄화 + Pony 폴더 ~/Desktop/pony로 이동
- 부모 git 리포(Claude_Tara) 영향에서 분리, 독립 git 리포 시작
- 보안: Anthropic 키 + Telegram 토큰 교체 (노출 발견 후 처리)
- CLAUDE.md/SPEC.md 정책 수정:
  - 자동 엔진 모델 → Phase 1 실측 후 결정
  - HARD RULE 추가: 작업 흐름 (설명 최소화, 브랜치 작업, .env 커밋 금지)
  - 순환 참조 금지 명시

### 2026-05-08
- 프로젝트 시작. 기획 합의 완료.
