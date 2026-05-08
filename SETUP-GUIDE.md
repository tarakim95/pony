# Pony 프로젝트 셋업 가이드

## 0. 받아갈 파일들 (Claude.ai → 로컬)

이 zip 안의 모든 파일을 새 폴더(예: `~/dev/pony/`)에 복사:
```
pony/
├── CLAUDE.md
├── progress.md
├── README.md
├── .env.example
├── .gitignore
├── docs/
│   ├── SPEC.md
│   ├── learnings.md
│   ├── folder-structure.md
│   ├── flow-charts.md
│   └── persona-head-agent.md
└── supabase/
    └── migrations/
        └── 00001_initial_schema.sql
```

## 1. Claude.ai 채팅 페르소나 등록

**옵션 A (추천)**: 새 Claude Project 생성
1. Claude.ai → Projects → "New Project" → 이름: `Pony`
2. Project Knowledge에 다음 파일 업로드:
   - `CLAUDE.md`
   - `docs/SPEC.md`
   - `docs/persona-head-agent.md`
3. Custom Instructions 칸에 `persona-head-agent.md` 내용 붙여넣기
4. 이후 이 프로젝트 안에서 채팅 시작하면 페르소나 자동 적용

**옵션 B**: 매 채팅 시작 시 `persona-head-agent.md` 내용 + 현재 progress.md 붙여넣기

## 2. Claude Code 세팅

### 2-1. Claude Code 설치 (이미 있으면 스킵)
```bash
npm install -g @anthropic-ai/claude-code
```

### 2-2. 프로젝트 디렉토리에서 실행
```bash
cd ~/dev/pony
claude
```

### 2-3. CLAUDE.md 인식 확인
첫 명령:
```
"CLAUDE.md를 읽고 핵심 원칙 3개를 한 줄씩 말해줘."
```
정확히 답하면 OK.

### 2-4. 모델 설정 (Sonnet으로)
Claude Code 설정에서 기본 모델을 Sonnet 4.6 또는 4.7로. Opus는 채팅 전용.

## 3. Supabase 프로젝트 생성

### 3-1. Dev 프로젝트
1. https://supabase.com/dashboard → New Project
2. 이름: `pony-dev`
3. Region: 서울 가까운 곳 (Tokyo)
4. 비밀번호 강력하게 (1Password 등에 보관)
5. 생성 후 Project Settings → API에서:
   - `URL` 복사 → `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 복사 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` 키 복사 → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 비밀)

### 3-2. 마이그레이션 실행
SQL Editor → New query → `supabase/migrations/00001_initial_schema.sql` 내용 붙여넣고 실행.

### 3-3. Auth 설정
Authentication → Providers → Email 활성화 (테스트용).
나중에 multi-user 갈 때 Google OAuth 등 추가.

### 3-4. Prod 프로젝트는 Phase 2 끝에 만들기
처음부터 두 개 만들 필요 없음. 기능 안정화되면 그때.

## 4. Anthropic API 키 발급

1. https://console.anthropic.com → API Keys → Create Key
2. 이름: `pony-dev`
3. 키 복사 → `.env.local`의 `ANTHROPIC_API_KEY`
4. **Workspace 비용 한도 설정**: Settings → Limits → 월 $30 한도 설정

## 5. 데이터 소스 API 키

### NewsAPI (가장 쉬움)
1. https://newsapi.org → Get API Key (무료)
2. `.env.local`의 `NEWSAPI_KEY`
3. 무료 플랜: 일 100 요청, 개발용엔 충분

### RSS (키 불필요, Phase 1에서 결정)
한국어 소스 후보: 한경, 매경 RSS / 영문: NYT RSS, FT, The Atlantic 등.
Phase 1 시작 시 사용자와 협의해서 결정.

## 6. Vercel 연결 (Phase 1 끝에)

처음부터 배포할 필요 없음. 로컬에서 동작 확인 후 Phase 1 끝에:
1. https://vercel.com → New Project → GitHub 리포 연결
2. Environment Variables 전부 입력 (.env.local과 동일)
3. Deploy
4. Vercel Cron 설정 (`vercel.json` 추가)

## 7. 첫 작업 명령

Claude Code에서:
```
"Phase 0를 시작하자. progress.md를 갱신하면서 진행해줘.
- Next.js 15 + TypeScript + Tailwind 프로젝트 초기화
- Pretendard 폰트 CDN 추가
- src/lib/supabase/{client,server}.ts 골격 작성 (TDD)
- 테스트 통과 확인 후 다음 단계
모든 결정 사항은 progress.md에 기록해줘."
```

## 8. 위험 모니터링 (매 주말)

매 주말 체크:
- [ ] Anthropic 콘솔에서 비용 확인 ($X / $30)
- [ ] Supabase 사용량 확인 (행 수, 저장공간)
- [ ] 메모 백업 export (`pnpm tsx scripts/export-notes.ts`)
- [ ] progress.md 회고 1줄 추가

## 9. 흥미 식는 신호 (자가 진단)

다음 중 2개 이상이면 *즉시* Claude.ai 채팅으로 가서 점검:
- 3일 이상 코드 안 만짐
- 문서만 만지고 진짜 기능 진척 없음
- "이거 의미 있나" 자문
- 매일 들어가서 안 봄
- 메모 0개 (도구 자체 안 씀)

식는 게 정상이고 *조기 발견이 핵심*. 4주 끝까지 가는 게 중요.

## 10. 첫 주 리허설

오늘 (Phase 0) 끝나면 다음 답할 수 있어야:
- Supabase에 마이그레이션 완료됐나? 테이블 7개 보이나?
- `pnpm dev` 실행 시 빈 페이지라도 뜨나?
- `.env.local`에 시크릿 다 들어갔나?
- 첫 커밋 했나?

다 yes면 Phase 1 시작 OK.
