# Pony (흐름)

분야 막힘 없이 뉴스/SNS 데이터를 수집해 *밑에 흐르는 공통 흐름*으로 연결하는 도구.

## 빠른 시작

### 1. 의존성 설치
```bash
pnpm install   # 또는 npm install
```

### 2. 환경변수 설정
```bash
cp .env.example .env.local
# .env.local 열어서 실제 값 채우기
```

### 3. Supabase 설정
1. https://supabase.com 에서 새 프로젝트 생성 (`pony-dev`)
2. SQL Editor에서 `supabase/migrations/00001_initial_schema.sql` 실행
3. URL과 anon key를 `.env.local`에 입력

### 4. 개발 서버 실행
```bash
pnpm dev
```

### 5. Vercel Cron 테스트 (로컬)
```bash
# 일일 엔진 수동 트리거
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/daily
```

## Claude Code로 작업할 때

매 세션 시작 시:
1. `CLAUDE.md` 읽기 (원칙)
2. `progress.md` 읽기 (현재 상태)
3. `docs/learnings.md` 빠르게 훑기 (실수 회피)
4. 작업 시작

매 세션 끝에:
1. `progress.md` 갱신
2. 새 실수 있으면 `learnings.md`에 기록
3. 커밋 + 푸시

## 문서

- [기획안 (SPEC)](./docs/SPEC.md)
- [폴더 구조](./docs/folder-structure.md)
- [플로우차트](./docs/flow-charts.md)
- [실수 기록](./docs/learnings.md)

## 큰 결정이 필요할 때

`CLAUDE.md`의 "막힐 때" 참조. 30분 시도 후 안 풀리면 Claude.ai 채팅(Opus)으로 가져오기.
