# Learnings

> 같은 실수 반복 방지. 매 작업 시작 시 빠르게 훑기.

형식:
```
### YYYY-MM-DD · 한 줄 제목
**무엇이 잘못됐나**: ...
**왜 그랬나**: ...
**다음에 어떻게 막을지**: ...
**관련 파일/커밋**: ...
```

---

### 2026-05-08 · 단위 테스트 mock 통과를 동작 검증으로 착각
**무엇이 잘못됐나**: callLLM 단위 테스트(mock) 통과 후 Phase 0 마감하려 했음. 실제 호출 경로(server-only + Next.js 런타임)를 한 번도 굴리지 않은 상태였음.
**왜 그랬나**: tsx 스크립트로 우회 검증하면서 "동일한 로직"이라고 합리화. mock 테스트와 실호출 테스트는 검증 범위가 완전히 다름. tsx 스크립트는 server-only + next/headers 체인을 아예 우회하므로 Next.js 런타임 경로를 검증하지 못함.
**다음에 어떻게 막을지**: Phase 마감 체크리스트에 "실제 호출 경로 한 번 굴렸는가" 항목 명시. 우회 검증(tsx 스크립트, 직접 SDK 호출 등)은 검증으로 치지 않음. server-only 모듈은 반드시 Next.js dev 서버 or 빌드 결과물로 검증.
**관련**: `src/lib/llm/client.ts`, `scripts/test-llm.ts` (삭제됨), `src/app/api/test-llm/route.ts` (삭제됨)

---

### 2026-05-08 · 마이그레이션 인덱스를 별도 파일로 분리했다가 중복 충돌
**무엇이 잘못됐나**: 0002/0003에 인덱스를 포함했어야 하는데 0004_indexes.sql을 별도로 만들어 인덱스가 이중 정의됨.
**왜 그랬나**: 파일 분리 설계 시 "인덱스는 별도 파일" 일반론을 따랐으나, `CREATE TABLE` 직후 `CREATE INDEX`를 두는 것이 PostgreSQL 관행이고 유지보수도 쉬움.
**다음에 어떻게 막을지**: SPEC.md 3-2에 명시한 규칙 따르기 — 인덱스는 해당 테이블 정의 파일에 함께. 인덱스 전용 파일 신규 생성 금지.
**관련**: `supabase/migrations/20260508000004_indexes.sql`, `0002_shared_tables.sql`, `0003_user_tables.sql`

---

### 2026-05-08 · .env가 git tracked 상태로 새 키 노출 직전
**무엇이 잘못됐나**: nasdaq_briefing/.env가 .gitignore에 있음에도 이미 tracked 상태라 무시되지 않았음. 새 키를 .env에 넣었다면 다음 commit에서 노출.
**왜 그랬나**: .gitignore는 이미 tracked된 파일에는 적용 안 됨. 과거에 .env가 tracked되어 commit된 적이 있었음.
**다음에 어떻게 막을지**: 새 프로젝트 시작 시 .gitignore 먼저 설정 후 .env 생성. 매 commit 전 `git status`와 `git diff --cached`로 .env 류 파일이 staging에 안 들어가는지 확인. 의심되면 `git ls-files | grep -i env`.
**관련**: Pony 새 리포는 처음부터 .gitignore가 .env 차단. 첫 커밋 검증으로 안전 확인.

---

### 2026-05-08 · 부모 git 리포에 Pony가 묶임
**무엇이 잘못됐나**: Claude_Tara/ 전체가 하나의 git 리포였고, 그 안에 nasdaq_briefing과 pony가 서브디렉토리로 들어가 있었음. Pony 작업 중 git 명령이 nasdaq_briefing 파일까지 영향 줄 수 있는 상태.
**왜 그랬나**: 과거 Claude_Tara에서 git init이 한 번 실행됐고, 이후 새 프로젝트들이 모두 그 리포 안으로 들어감.
**다음에 어떻게 막을지**: 새 프로젝트는 *반드시 독립 폴더*에 두고 *그 폴더에서 직접 git init*. 새 프로젝트 시작 전 `git rev-parse --show-toplevel`로 부모 리포 영향 없는지 확인.
**관련**: Pony를 ~/Desktop/pony로 이동 후 독립 git 리포로 시작.

---

### 2026-05-08 · Claude Code가 다른 프로젝트 파일 참조함
**무엇이 잘못됐나**: VS Code 워크스페이스가 잘못된 폴더로 열려, Claude Code가 형제 폴더 nasdaq_briefing의 CLAUDE.md를 읽음.
**왜 그랬나**: zip 풀면서 pony/pony_setup/ 으로 2단계 중첩됐고, 워크스페이스 루트가 부정확. CLAUDE.md를 못 찾자 상위로 올라가 형제 폴더에서 발견.
**다음에 어떻게 막을지**: 매 새 세션 시작 시 `pwd` + `ls`로 작업 디렉토리 확인. zip 풀 때 자동 중첩되는지 항상 체크.
**관련**: 폴더 평탄화 후 ~/Desktop/pony로 이동하여 해결.
