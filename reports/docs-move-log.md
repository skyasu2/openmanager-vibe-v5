# 문서 이동 로그

## 2025-08-15 루트 디렉토리 정리

### 삭제된 파일들

- `next.config.backup.mjs` - 백업 파일 삭제
- `CLAUDE.md.backup` - 백업 파일 삭제
- `CLAUDE.md.backup.20250814_182556` - 백업 파일 삭제
- `.eslintrc.ultrafast.json.tmp.9833.1754823887664` - 임시 파일 삭제

### 이동된 파일들

#### 분석 스크립트 → `scripts/analysis/`

- `analyze-supabase-db.js`
- `supabase-schema-analyzer.js`
- `supabase-simple-analyzer.js`
- `analyze_current_performance.js`

#### 테스트 파일 → `scripts/testing/`

- `test-*.js` (모든 테스트 스크립트)
- `test-*.sh` (모든 테스트 셸 스크립트)

#### 리포트 파일 → `reports/analysis/`

- `eslint-*.json`
- `lint-*.json`
- `playwright-*.json`

#### SQL 파일 → `sql/`

- 모든 `.sql` 파일들

#### 스크립트 파일 → `scripts/`

- `execute_*.js`
- `insert_*.js`
- `check_*.js`
- `vm-*.js`, `vm-*.ps1`
- `deploy-*.sh`, `deploy-*.ps1`
- `*-setup*.sh`, `*-setup*.ps1`

#### 문서 파일 → `docs/`

- `*.txt` 파일들

### 정책 준수 확인

- ✅ `AGENTS.md` 루트에 유지 (예외 규칙 적용)
- ✅ AI 가이드 파일들 (`CLAUDE.md`, `GEMINI.md`, `QWEN.md`) 루트 유지
- ✅ 설정 파일들 (`.eslintrc.*`, `package.json` 등) 루트 유지
- ✅ 백업/임시 파일들 삭제
- ✅ 분석/테스트 스크립트들 적절한 디렉토리로 이동

### 적용된 규칙

- 루트 파일 정책 (`.jbge-root-file-policy`) 준수
- 우선순위: 허용 화이트리스트 > 예외(AGENTS.md) > 자동 이동 규칙
- 백업 파일 삭제: `*.backup`, `*.tmp`
- 분석 스크립트: `*analysis*.js` → `/scripts/analysis/`
- 테스트 파일: `test-*` → `/scripts/testing/`
- 리포트 파일: `*report*.json`, `*.log` → `/reports/analysis/`

### 문서정리 Sub-Agent 작업 완료

- 총 처리 파일: 20+ 개
- 삭제: 4개 (백업/임시 파일)
- 이동: 16+ 개 (적절한 디렉토리로 분류)
- 루트 디렉토리 정리 완료
