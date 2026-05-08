# Progress

> 매 작업 끝에 갱신. 다음 세션이 이 파일만 읽고 이어갈 수 있도록.

## 마지막 업데이트
2026-05-08 — Phase 0 완료. main merge + tag 완료.

## 현재 Phase
**Phase 1**: 동작하는 골격 (시작 전)

## 직전 작업 (Phase 0 마감)
- `GET /api/test-llm` 검증 라우트로 실 호출 경로 확인 → 통과 후 삭제
  - callLLM → Haiku 4.5 → 응답 "ok", llm_call_log row 확인 ($0.00004)
- SPEC.md Phase 0 항목 전체 [x] 체크
- learnings.md: mock 통과 ≠ 동작 검증 교훈 기록
- feat/phase-0-init → main squash merge → git tag phase-0-done

## 지금 상태
- Next.js 15 + Tailwind v4 + Pretendard ✅
- Supabase 연결 + 마이그레이션 5개 (10 테이블) ✅
- LLM callLLM() — 한도/비용/로깅, Vitest 2/2 ✅
- 실 호출 경로 검증 완료 ✅
- main 브랜치 = phase-0-done tag ✅

## 다음 할 일 (우선순위 순)
1. [ ] Phase 1 시작: 데이터 수집기 1개 소스 (NewsAPI 또는 RSS 결정 필요)
2. [ ] 엔진 1 v0 (단순 버전, 흐름 그룹 매칭 제외)
3. [ ] 피드 화면 v0

## 참고: Tailwind v4 변경사항
- `tailwind.config.ts` 없음 → `globals.css`의 `@theme inline {}` 블록으로 대체
- `@import "tailwindcss"` 하나로 base/components/utilities 모두 포함
- 색상 접두사 예시: `bg-espresso`, `text-peony`, `bg-linen-warm`

## 막힌 곳 / 결정 미룬 항목
- 데이터 소스 1순위 후보: NewsAPI? RSS? Phase 1 시작 시 결정.
- 코사인 유사도 임계값: 실측 후 결정.
- 자동 실행 엔진 모델 (Haiku vs Sonnet): Phase 1 실측 후 결정.

## 다음 세션 시작 시 읽을 순서
1. `CLAUDE.md` (원칙)
2. 이 파일 (`progress.md`)
3. `docs/learnings.md` (실수 기록)
4. `docs/SPEC.md` (필요 시)
5. 작업 관련 코드

## Phase별 진행률
- Phase 0: ██████████ 100% ✅
- Phase 1: ▱▱▱▱▱▱▱▱▱▱ 0%
- Phase 2: ▱▱▱▱▱▱▱▱▱▱ 0%
- Phase 3: ▱▱▱▱▱▱▱▱▱▱ 0%

---

## 변경 이력 (최신이 위)

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
