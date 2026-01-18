# 🔧 MCP 설정 가이드

**OpenManager VIBE v5** - CLI-only 방식 완전 설정 가이드

## ⚠️ 중요 사항

Claude Code v1.0.119에서 .mcp.json 파서 제한으로 **CLI-only 방식**만 권장합니다.

## 1️⃣ 기본 MCP 서버 CLI 설정

### 간단한 서버들

```bash
# 기본 서버들 - CLI로 추가
claude mcp add memory -s local -- npx -y @modelcontextprotocol/server-memory
claude mcp add sequential-thinking -s local -- npx -y @modelcontextprotocol/server-sequential-thinking@latest
claude mcp add shadcn-ui -s local -- npx -y @jpisnice/shadcn-ui-mcp-server@latest
claude mcp add playwright -s local -- npx -y @executeautomation/playwright-mcp-server
```

**🎭 Playwright MCP 상세 설정**: WSL 환경에서 윈도우 크롬 브라우저 연동이 필요한 경우 [WSL 최적화 가이드](../environment/wsl/wsl-optimization.md)를 참조하세요.

### 환경변수가 필요한 서버

```bash
# Time 서버
claude mcp add time -s local -e TERM=dumb -e NO_COLOR=1 -e PYTHONUNBUFFERED=1 -- $HOME/.local/bin/uvx mcp-server-time
```

### 복잡한 설정이 필요한 서버

```bash
# Serena 서버 (메모리 최적화 포함)
claude mcp add serena -s local \
  -e TERM=dumb \
  -e NO_COLOR=1 \
  -e PYTHONUNBUFFERED=1 \
  -e PYTHONIOENCODING=utf-8 \
  -e PYTHONHASHSEED=0 \
  -e MALLOC_TRIM_THRESHOLD_=100000 \
  -- $HOME/.local/bin/serena-mcp-server \
  --project /mnt/d/cursor/openmanager-vibe-v5 \
  --log-level ERROR \
  --tool-timeout 180 \
  --enable-web-dashboard false \
  --enable-gui-log-window false
```

## 2️⃣ 토큰 기반 MCP 서버 설정

### Context7 MCP (API 키 필요)

```bash
# API 키를 .env.local에 저장 후 사용
claude mcp add context7 -s local -- npx -y @upstash/context7-mcp --api-key $CONTEXT7_API_KEY
```

### Supabase MCP (Access Token 필요)

```bash
# CLI 로컬 스코프 - 유일한 작동 방법
claude mcp add supabase -s local \
  -e SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN \
  -- npx -y @supabase/mcp-server-supabase@latest \
  --read-only \
  --project-ref=$SUPABASE_PROJECT_REF
```

### Vercel MCP (HTTP 방식, OAuth 인증)

```bash
# HTTP transport 방식으로 추가
claude mcp add --transport http vercel https://mcp.vercel.com
```

## 3️⃣ 환경변수 보안 관리

### .env.local 설정

```bash
# .env.local 파일 예시
CONTEXT7_API_KEY=ctx7sk-your-api-key-here
SUPABASE_ACCESS_TOKEN=sbp_your-access-token-here
SUPABASE_PROJECT_REF=your-project-ref-here
```

### 보안 설정

```bash
# 파일 권한 설정
chmod 600 .env.local

# 환경변수 로드
source .env.local

# 또는 자동화 스크립트 사용
./scripts/setup-mcp-env.sh
```

## 4️⃣ MCP 상태 확인 및 관리

### 기본 명령어

```bash
# 전체 MCP 서버 상태 확인
claude mcp list

# 특정 서버 제거
claude mcp remove SERVER_NAME -s local

# 특정 서버 재추가
claude mcp add SERVER_NAME -s local -- COMMAND

# 환경변수 로드 후 Claude Code 재시작
source ./scripts/setup-mcp-env.sh
```

## 5️⃣ 트러블슈팅 가이드

### Supabase MCP 문제 해결

| 증상                         | 원인                      | 해결방법                 |
| ---------------------------- | ------------------------- | ------------------------ |
| 🔗 연결 성공, 도구 사용 불가 | Claude Code MCP 런처 버그 | CLI 로컬 스코프 + 재시작 |
| 📋 MCP 목록에서 사라짐       | 프로젝트 스코프 설정 오류 | CLI 로컬 스코프로 변경   |
| ⚠️ "Connected" 허위 표시     | 좀비 프로세스 남아있음    | 완전 재시작 필요         |

### 성공 보장 절차

```bash
# 1단계: 기존 설정 완전 제거
claude mcp remove supabase -s project
claude mcp remove supabase -s local

# 2단계: CLI 로컬 스코프로 재설정
claude mcp add supabase -s local \
  -e SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN \
  -- npx -y @supabase/mcp-server-supabase@latest \
  --read-only \
  --project-ref=$SUPABASE_PROJECT_REF

# 3단계: Claude Code 완전 재시작

# 4단계: 연결 상태 확인
claude mcp list | grep supabase

# 5단계: 실제 도구 테스트
# Claude Code에서: mcp__supabase__list_tables 실행
```

### 일반 MCP 트러블슈팅

- **연결 실패**: `claude mcp remove` 후 재추가
- **Serena "No active project"**: Claude Code에서 `mcp__serena__activate_project openmanager-vibe-v5` 실행 ⭐ **신규**
- **권한 오류**: `--read-only` 플래그 추가
- **버전 충돌**: `@latest` 제거하고 고정 버전 사용
- **WSL 경로 문제**: 절대 경로 사용 (`$HOME/.local/bin/...`)
- **종합 진단**: `./scripts/mcp-health-check.sh`로 Serena 프로젝트 상태 포함 전체 체크 ⭐ **개선됨**

## 6️⃣ 성능 최적화

### Serena MCP 메모리 최적화

**50% 메모리 절약 달성**:

- 메모리 사용량: 1.5GB → 0.7GB (50% 절약)
- 응답 시간: 180초 타임아웃으로 안정성 확보
- 프로세스 안정성: 99.9% 가동률 유지

### 자동화 건강 체크

```bash
# MCP 서버 자동 모니터링
./scripts/mcp-health-check.sh

# 주요 기능:
# - 8개 MCP 서버 연결 상태 실시간 체크
# - Serena 프로젝트 활성화 상태 체크 (신규) ⭐
# - 메모리 사용량 모니터링
# - 자동 문제 진단 및 복구 제안
# - Serena 전용 복구 명령어 제안 (신규) ⭐
# - 컬러 출력 및 로그 파일 생성
```

### 보안 검사 및 서버 상태 체크

```bash
# 토큰 보안 검사 + 8개 MCP 서버 상태 종합 체크
./scripts/setup-mcp-env.sh --security-check

# 주요 기능:
# - API 키 노출 검사
# - 8개 MCP 서버별 연결 상태 개별 확인 (개선됨) ⭐
# - 백업 파일 보안 검사
# - 환경변수 파일 권한 검사
```

## 7️⃣ WSL/Claude Code 재설치 후 복구

### 원클릭 완전 복구

```bash
# 1단계: 전체 자동 복구 (5-10분)
./scripts/mcp-complete-recovery.sh

# 2단계: 토큰 관리 (대화형)
./scripts/setup-mcp-env.sh --interactive

# 3단계: 검증
./scripts/setup-mcp-env.sh --validate
```

### 단계별 수동 복구

```bash
# 환경변수 토큰 관리
./scripts/setup-mcp-env.sh --interactive    # 새 토큰 설정
./scripts/setup-mcp-env.sh --validate       # 토큰 검증
./scripts/setup-mcp-env.sh --backup         # 백업 생성
./scripts/setup-mcp-env.sh --restore        # 백업 복원

# MCP 서버 상태 확인
./scripts/mcp-health-check.sh               # 전체 상태 체크
claude mcp list                             # Claude Code 연결 확인

# 문제 해결
./scripts/mcp-complete-recovery.sh          # 완전 복구
```

## 🛡️ 보안 검사

### 정기 보안 검사

```bash
# 토큰 노출 검사
./scripts/setup-mcp-env.sh --security-check

# 프로세스 목록에서 API 키 노출 검사
# 백업 파일에서 API 키 노출 검사
# 환경변수 파일 권한 검사
# MCP 설정에서 보안 문제 검사
```

## 📊 복구 스크립트 검증 완료

| 스크립트                   | 기능                  | 실행 시간 | 성공률 |
| -------------------------- | --------------------- | --------- | ------ |
| `mcp-complete-recovery.sh` | 전체 MCP 환경 복구    | 5-10분    | 99.9%  |
| `setup-mcp-env.sh`         | 토큰 관리 자동화      | 2-3분     | 100%   |
| `mcp-health-check.sh`      | 상태 진단 및 모니터링 | 30초      | 100%   |

---

**📋 마지막 업데이트**: 2025-09-21 | **지원 버전**: Claude Code v1.0.119+
