# 🛠️ Claude Code 시스템 복구 완전 가이드 (2025)

## 🎯 개요

**목적**: Claude Code 시스템 문제 진단 및 완전 복구  
**대상**: Config Mismatch, MCP 서버 실패, 서브에이전트 문제  
**목표 시간**: 2-3시간 내 완전 복구  

## ⚠️ 주요 증상 및 진단

### 🚨 Config Mismatch 문제
**증상**: `Config mismatch: running npm-global but config says unknown`
```bash
# 문제 확인
claude /doctor
# ⚠ Config mismatch: running npm-global but config says unknown
```

### 🔌 MCP 서버 연결 실패
**증상**: MCP 서버 2/12개만 작동, 대부분의 도구 사용 불가
```bash
# MCP 상태 확인
claude mcp list
# 📊 결과: 2개만 connected, 10개 failed
```

### 🤖 서브에이전트 비활성화
**증상**: Task 도구 사용 시 에러, 전문 에이전트 호출 불가

## 🔧 4단계 복구 프로세스

### Phase 1: 시스템 진단 및 Config 수정 (30분)

#### 1.1 현재 상태 진단
```bash
# Claude Code 상태 확인
claude /doctor
claude /status
claude config list

# 설치 방법 확인
which claude
npm list -g | grep claude

# 현재 설정 확인
cat ~/.claude.json
cat ~/.claude/settings.json 2>/dev/null || echo "No project settings"
```

#### 1.2 Config Mismatch 해결 (중요!)
```bash
# 1. 글로벌 설정 파일 수정
nano ~/.claude.json

# 2. installMethod 수정
{
  "numStartups": 6,
  "installMethod": "npm-global",  // ← "unknown"에서 변경
  "autoUpdates": true,
  "instanceId": "..."
}

# 3. 설정 적용 확인
claude /doctor
# ✅ 결과: Config mismatch 해결됨
```

#### 1.3 프로젝트 설정 최적화
```bash
# 프로젝트별 설정 생성/수정
mkdir -p .claude
cat > .claude/settings.json << 'EOF'
{
  "statusLine": {
    "type": "command",
    "command": "ccusage statusline --visual-burn-rate emoji",
    "padding": 0
  }
}
EOF
```

### Phase 2: 환경변수 및 토큰 설정 (30분)

#### 2.1 환경변수 파일 생성
```bash
# .env.local 파일 생성 (Git에서 제외됨)
cat > .env.local << 'EOF'
# GitHub
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxx

# Supabase
SUPABASE_PROJECT_ID=xxxxx
SUPABASE_ACCESS_TOKEN=sbp_xxxxx

# Tavily
TAVILY_API_KEY=tvly-xxxxx

# GCP (선택사항)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Upstash Redis (선택사항)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
EOF
```

#### 2.2 토큰 발급 및 설정
```bash
# GitHub 토큰 발급 (필수)
# 1. GitHub Settings → Developer settings → Personal access tokens
# 2. Generate new token (classic)
# 3. 권한 선택: repo, read:org, user:email
# 4. .env.local에 추가

# Supabase 토큰 확인
# 1. Supabase Dashboard → Settings → API
# 2. Service Role Key 복사
# 3. .env.local에 추가

# Tavily API 키 발급 (무료)
# 1. https://tavily.com 가입
# 2. API key 발급 (무료 1000회/월)
# 3. .env.local에 추가
```

### Phase 3: MCP 서버 복구 (45분)

#### 3.1 MCP 서버 의존성 설치
```bash
# NPX 기반 서버들
timeout 10s npx -y @modelcontextprotocol/server-filesystem --version
timeout 10s npx -y @modelcontextprotocol/server-memory --version
timeout 10s npx -y @modelcontextprotocol/server-github --version
timeout 10s npx -y @supabase/mcp-server-supabase@latest --version
timeout 10s npx -y tavily-mcp --version
timeout 10s npx -y @executeautomation/playwright-mcp-server --version
timeout 10s npx -y @modelcontextprotocol/server-sequential-thinking@latest --version
timeout 10s npx -y @upstash/context7-mcp --version
timeout 10s npx -y @jpisnice/shadcn-ui-mcp-server@latest --version

# UVX 기반 서버들
timeout 10s uvx mcp-server-time --version
timeout 10s uvx --from git+https://github.com/oraios/serena serena-mcp-server --version

# GCP MCP (선택사항)
npm install -g google-cloud-mcp 2>/dev/null || echo "GCP MCP 설치 스킵"
```

#### 3.2 .mcp.json 설정 확인
```bash
# MCP 설정 파일 검증
cat .mcp.json | jq . 2>/dev/null || echo "❌ .mcp.json 문법 오류"

# 환경변수 참조 확인
grep -E "(GITHUB|SUPABASE|TAVILY)" .mcp.json
# 올바른 형태: "${GITHUB_PERSONAL_ACCESS_TOKEN}"
```

#### 3.3 Claude Code 완전 재시작
```bash
# 1. Claude Code 프로세스 완전 종료
pkill -f claude
sleep 3

# 2. 백그라운드 프로세스 확인
ps aux | grep claude | grep -v grep

# 3. Claude Code 재시작
claude

# 4. MCP 서버 상태 확인
claude mcp list
# 목표: 12/12 서버 connected
```

#### 3.4 개별 서버 문제 해결

##### GitHub 서버 (가장 빈번한 문제)
```bash
# 토큰 유효성 확인
curl -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
     https://api.github.com/user

# 캐시 제거 (필요시)
rm -rf ~/.claude/cache/* 2>/dev/null

# Claude Code 재시작 후 확인
claude mcp list | grep github
```

##### Supabase 서버
```bash
# 프로젝트 연결 확인
curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
     "https://${SUPABASE_PROJECT_ID}.supabase.co/rest/v1/" \
     --header "apikey: $SUPABASE_ACCESS_TOKEN"

# RLS 정책 확인
# Supabase Dashboard → Authentication → RLS 확인
```

##### Serena 서버
```bash
# 프로젝트 활성화 (중요!)
# Claude 내에서 실행:
# mcp__serena__activate_project openmanager-vibe-v5

# 또는 경로로 활성화:
# mcp__serena__activate_project /mnt/d/cursor/openmanager-vibe-v5
```

### Phase 4: 서브에이전트 검증 및 최적화 (30분)

#### 4.1 서브에이전트 상태 확인
```bash
# Task 도구 테스트
Task central-supervisor "시스템 상태 확인"
Task dev-environment-manager "WSL 환경 점검"
Task mcp-server-administrator "MCP 서버 상태 점검"
```

#### 4.2 MCP 도구 통합 확인
```bash
# 주요 MCP 도구 테스트
# Filesystem
mcp__filesystem__list_directory /mnt/d/cursor/openmanager-vibe-v5

# Memory
mcp__memory__read_graph

# GitHub (인증 필수)
mcp__github__search_repositories "openmanager"

# Supabase
mcp__supabase__list_tables

# Time
mcp__time__get_current_time Asia/Seoul
```

#### 4.3 자동 트리거 설정 확인
```bash
# Hooks 설정 확인
cat .claude/settings.json | jq .hooks 2>/dev/null

# 자동 트리거 테스트
echo "test" > test-file.ts
# → 자동으로 적절한 에이전트가 호출되는지 확인
```

## 🔍 문제 해결 체크리스트

### ✅ Config Mismatch 해결 확인
- [ ] `claude /doctor` 에러 없음
- [ ] `~/.claude.json`에 `installMethod: "npm-global"` 설정
- [ ] Claude Code 재시작 후 정상 작동

### ✅ MCP 서버 복구 확인
- [ ] 12/12 서버 모두 connected
- [ ] 주요 도구들 정상 작동 (filesystem, memory, github, supabase)
- [ ] 환경변수 올바르게 설정
- [ ] 토큰 만료되지 않음

### ✅ 서브에이전트 활성화 확인
- [ ] Task 도구 정상 작동
- [ ] 18개 에이전트 모두 호출 가능
- [ ] MCP 도구 통합 정상
- [ ] 자동 트리거 작동

### ✅ 전체 시스템 상태 확인
- [ ] `claude /status` 모든 항목 정상
- [ ] 개발 환경 완전 작동
- [ ] AI CLI 도구 통합 (Gemini, Qwen 등)
- [ ] WSL 환경 최적화 상태

## 🚨 긴급 복구 명령어

### 원클릭 진단
```bash
#!/bin/bash
# system-quick-diagnosis.sh

echo "🔍 Claude Code 시스템 진단 시작..."

# 1. 기본 상태 확인
echo "1. Claude Code 상태:"
claude /doctor 2>&1 | head -5

echo "2. MCP 서버 상태:"
claude mcp list 2>&1 | grep -E "(connected|failed)" | wc -l

echo "3. 환경변수 확인:"
echo "GITHUB_TOKEN: ${GITHUB_PERSONAL_ACCESS_TOKEN:0:10}..."
echo "SUPABASE_TOKEN: ${SUPABASE_ACCESS_TOKEN:0:10}..."

echo "4. 서브에이전트 테스트:"
timeout 10s claude -c "Task central-supervisor '간단한 상태 확인'" 2>&1 | head -2

echo "🎯 진단 완료. 문제가 발견되면 4단계 복구 프로세스 실행하세요."
```

### 긴급 복구 스크립트
```bash
#!/bin/bash
# emergency-recovery.sh

echo "🚨 긴급 복구 시작..."

# 1. Claude Code 완전 재시작
echo "1. Claude Code 재시작..."
pkill -f claude
sleep 5
claude &

# 2. 환경변수 재로딩
echo "2. 환경변수 재로딩..."
source .env.local 2>/dev/null

# 3. 간단한 상태 확인
echo "3. 복구 상태 확인..."
sleep 10
claude /doctor

echo "✅ 긴급 복구 완료. 상세 확인은 4단계 프로세스 실행하세요."
```

## 📊 복구 성공 지표

### 정량적 지표
- **Config 상태**: Mismatch 0개
- **MCP 서버**: 12/12 연결됨 (100%)
- **서브에이전트**: 18/18 활성화 (100%)
- **응답 시간**: Task 명령어 30초 내 실행
- **도구 가용성**: 94개 MCP 도구 모두 사용 가능

### 정성적 지표
- ✅ `claude /doctor` 에러 없음
- ✅ `claude /status` 모든 항목 녹색
- ✅ Task 도구로 서브에이전트 정상 호출
- ✅ MCP 도구 정상 작동
- ✅ 자동 트리거 시스템 작동

## 💡 예방 및 유지보수

### 일일 점검 (1분)
```bash
# 매일 실행 권장
claude /doctor && claude mcp list | grep -c connected
# 결과: 에러 없음, 12개 연결됨
```

### 주간 점검 (5분)
```bash
# 주간 헬스체크
./scripts/mcp/mcp-health-check.sh
Task central-supervisor "전체 시스템 상태 점검"

# 토큰 만료 확인
curl -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
     https://api.github.com/user | jq .login
```

### 월간 점검 (30분)
```bash
# MCP 서버 버전 업데이트
npm list -g | grep -E "(claude|mcp)"
npm update -g @anthropic-ai/claude-code

# 전체 시스템 재구성
./scripts/mcp/mcp-comprehensive-update.sh
```

### 토큰 관리
- **GitHub 토큰**: 90일마다 갱신
- **Supabase 토큰**: 변경 시에만 갱신
- **기타 API 키**: 6개월마다 검토

## 🔗 관련 문서

- **[MCP 복구 보고서](mcp-recovery-report-2025-08-21.md)**: 실제 복구 과정 상세 기록
- **[서브에이전트 상태 보고서](subagent-status-report-2025-08-21.md)**: 18개 에이전트 검증 결과
- **[MCP 종합 가이드](../MCP-GUIDE.md)**: 12개 서버 완전 활용법
- **[시스템 아키텍처](../system-architecture.md)**: 전체 시스템 구조

## ⚠️ 주의사항

### 절대 하지 말 것
- ❌ Claude Code 실행 중에 `~/.claude.json` 수정
- ❌ 토큰을 `.mcp.json`에 직접 하드코딩
- ❌ npm global 패키지 강제 재설치
- ❌ WSL 재시작 없이 메모리 설정 변경

### 권장사항
- ✅ 변경 전 설정 파일 백업
- ✅ 단계별 점진적 복구
- ✅ 로그 파일 보존
- ✅ 복구 과정 문서화

---

**가이드 작성**: 2025-08-21  
**기반 사례**: 실제 시스템 복구 경험  
**대상 환경**: WSL 2 + Ubuntu 24.04 + Claude Code v1.0.86  
**예상 복구 시간**: 2-3시간 (경험자는 1시간)