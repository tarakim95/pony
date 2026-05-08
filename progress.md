# Progress

> 매 작업 끝에 갱신. 다음 세션이 이 파일만 읽고 이어갈 수 있도록.

## 마지막 업데이트
2026-05-08 — Phase 0 시작 직전. 기획/세팅 문서 작성 완료, 코드 작성 전.

## 현재 Phase
**Phase 0**: 골격 (반나절 예상)

## 직전 작업
- `CLAUDE.md` 작성 (개발 원칙)
- `docs/SPEC.md` 작성 (기획안)
- `docs/learnings.md` 빈 템플릿 생성
- 폴더 구조 문서화

## 지금 상태
- 코드 미작성
- 의존성 미설치
- Supabase 프로젝트 미생성
- Vercel 배포 미연결

## 다음 할 일 (우선순위 순)
1. [ ] Supabase 프로젝트 생성 (`pony-dev` 먼저)
2. [ ] Next.js 15 + TypeScript 프로젝트 초기화
3. [ ] Tailwind 설정 + Pretendard CDN 추가
4. [ ] Supabase 클라이언트 연결 + 환경변수 설정
5. [ ] 첫 마이그레이션: 핵심 테이블 7개 생성
6. [ ] `lib/llm/client.ts` 골격 (비용 추적 포함)
7. [ ] Phase 0 완료 → Phase 1 시작

## 막힌 곳 / 결정 미룬 항목
- 데이터 소스 1순위 후보: NewsAPI? RSS? Phase 1 시작 시 결정.
- 코사인 유사도 임계값: 실측 후 결정.

## 다음 세션 시작 시 읽을 순서
1. `CLAUDE.md` (원칙)
2. 이 파일 (`progress.md`)
3. `docs/learnings.md` (실수 기록)
4. `docs/SPEC.md` (필요 시)
5. 작업 관련 코드

## Phase별 진행률
- Phase 0: ▱▱▱▱▱▱▱▱▱▱ 0% (시작 직전)
- Phase 1: ▱▱▱▱▱▱▱▱▱▱ 0%
- Phase 2: ▱▱▱▱▱▱▱▱▱▱ 0%
- Phase 3: ▱▱▱▱▱▱▱▱▱▱ 0%

---

## 변경 이력 (최신이 위)

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
