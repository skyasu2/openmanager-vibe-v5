# 🔌 MCP 설치 및 설정 가이드

> **Model Context Protocol 빠른 시작 가이드**  
> OpenManager VIBE v5용 11개 MCP 서버 설치 및 환경 설정

**최종 업데이트**: 2025-08-14  
**상태**: 11/11 서버 100% 정상 작동 ✅  
**대상 사용자**: MCP를 처음 설치하거나 문제 해결이 필요한 사용자

---

## 🎯 MCP 소개

### What is MCP?
**Model Context Protocol (MCP)**는 Claude Code가 외부 시스템과 직접 상호작용할 수 있게 해주는 프로토콜입니다. 파일 시스템, 데이터베이스, 웹 서비스, GitHub 등과 연동하여 실제 개발 작업을 자동화할 수 있습니다.

### 🚀 현재 상태: 100% 완전 정상화

**✅ 2025-08-14 기준: 11/11 서버 모두 정상 작동!**

| MCP 서버 | 상태 | 핵심 기능 | 설치 방법 |
|----------|------|----------|-----------|
| `filesystem` | ✅ 정상 | 파일 읽기/쓰기, 검색 | `npm install -g` |
| `memory` | ✅ 정상 | 지식 그래프 관리 | `npm install -g` |
| `github` | ✅ 정상 | PR/이슈 생성, 파일 푸시 | `npm install -g` |
| `supabase` | ✅ 정상 | PostgreSQL DB 관리 | `npm install -g` |
| `tavily-mcp` | ✅ 정상 | 웹 검색/크롤링 | `npm install -g` |
| `playwright` | ✅ 정상 | 브라우저 자동화 | `npm install -g` |
| `time` | ✅ 정상 | 시간/시간대 변환 | `uvx --from` |
| `sequential-thinking` | ✅ 정상 | 복잡한 문제 해결 | `npm install -g` |
| `context7` | ✅ 정상 | 라이브러리 문서 | `npm install -g` |
| `shadcn-ui` | ✅ 정상 | UI 컴포넌트 관리 | `npm install -g` |
| `serena` | ✅ 정상 | LSP 기반 코드 분석 | `uvx --from` |

---

## 🚀 빠른 설치 (권장)

### Option 1: Windows PowerShell 자동 설치 (권장)

```powershell
# 1단계: 완전 자동 설치 (11개 서버)
./scripts/install-all-mcp-servers.ps1

# 2단계: 환경변수 설정 후 Claude 시작
./scripts/start-claude-with-mcp.ps1

# 3단계: 설치 확인
claude mcp list
```

**결과 예시 (모든 서버가 Connected 상태):**
```
✓ filesystem - Connected
✓ memory - Connected  
✓ github - Connected
✓ supabase - Connected
✓ tavily-mcp - Connected
✓ playwright - Connected
✓ time - Connected
✓ sequential-thinking - Connected
✓ context7 - Connected
✓ shadcn-ui - Connected
✓ serena - Connected
```

### Option 2: Git Bash 자동 설치 (Linux/macOS 호환)

```bash
# 완전 자동 설치
./scripts/install-all-mcp-servers.sh

# 환경변수 서버 제외 설치
./scripts/install-all-mcp-servers.sh --skip-env

# MCP 환경변수 로드 및 시작
./scripts/start-claude-with-mcp.sh
```

---

## ⚙️ 환경 설정

### 필수 환경변수 (.env.local)

```bash
# ======================
# MCP 서버 환경변수
# ======================

# Supabase (데이터베이스) - 필수!
SUPABASE_ACCESS_TOKEN=sbp_90532bce7e5713a964686d52b254175e8c5c32b9
SUPABASE_PROJECT_ID=vnswjnltnhpsueosfhmw
NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Tavily (웹 검색/크롤링) - 필수!
TAVILY_API_KEY=tvly-dev-xxxxxxxxxxxxx

# GitHub (저장소 관리) - 필수!
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxx

# Context7 (문서 검색) - 선택사항
CONTEXT7_API_KEY=c7_xxxxxxxxxxxxx
```

### Windows PowerShell 환경변수 설정

```powershell
# 사용자 환경변수 설정 (권장)
[System.Environment]::SetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", "sbp_xxx", "User")
[System.Environment]::SetEnvironmentVariable("TAVILY_API_KEY", "tvly-xxx", "User")
[System.Environment]::SetEnvironmentVariable("GITHUB_PERSONAL_ACCESS_TOKEN", "ghp_xxx", "User")

# 환경변수 확인
Get-ChildItem Env: | Where-Object {$_.Name -like "*SUPABASE*"}
Get-ChildItem Env: | Where-Object {$_.Name -like "*TAVILY*"}
Get-ChildItem Env: | Where-Object {$_.Name -like "*GITHUB*"}

# 환경변수 새로고침 (중요!)
refreshenv

# PowerShell 재시작
exit
```

### Linux/macOS 환경변수 설정

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
export SUPABASE_ACCESS_TOKEN="sbp_xxx"
export TAVILY_API_KEY="tvly-xxx"
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxx"

# 환경변수 로드
source ~/.bashrc

# 확인
echo $SUPABASE_ACCESS_TOKEN
echo $TAVILY_API_KEY
echo $GITHUB_PERSONAL_ACCESS_TOKEN
```

---

## 🔧 개별 MCP 서버 설정

### 1. 🗂️ Filesystem MCP (기본)

```bash
# 설치
npm install -g @modelcontextprotocol/server-filesystem

# 설정 확인 (C:\Users\{username}\.claude.json)
{
  "filesystem": {
    "type": "stdio",
    "command": "npx",
    "args": ["@modelcontextprotocol/server-filesystem", "D:\\cursor\\openmanager-vibe-v5"]
  }
}
```

### 2. 🧠 Memory MCP (기본)

```bash
# 설치
npm install -g @modelcontextprotocol/server-memory

# 자동 설정됨 (설정 불필요)
```

### 3. 🐙 GitHub MCP (환경변수 필요)

```bash
# 설치
npm install -g @modelcontextprotocol/server-github

# 환경변수 필수
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxx
```

**GitHub Token 생성 방법:**
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. 권한 선택:
   - ✅ `repo` (저장소 접근)
   - ✅ `read:user` (사용자 정보)
   - ❌ `admin:repo_hook` (불필요)

### 4. 🗄️ Supabase MCP (환경변수 필요) - 완전 정상화!

```bash
# 설치
npm install -g @supabase/mcp-server-supabase

# 환경변수 필수 (Personal Access Token)
SUPABASE_ACCESS_TOKEN=sbp_90532bce7e5713a964686d52b254175e8c5c32b9
```

**중요사항 - 2025-08-14 완전 해결:**
- ❌ Service Role Key (`eyJ`로 시작) 사용 불가
- ✅ Personal Access Token (`sbp_`로 시작) 사용 필수

**Supabase PAT 생성 방법:**
1. Supabase Dashboard → Account → Access Tokens
2. Generate new token 클릭
3. 토큰 이름 입력 (예: "MCP-Server")
4. `sbp_`로 시작하는 토큰 복사

### 5. 🔍 Tavily MCP (환경변수 필요)

```bash
# 설치
npm install -g tavily-mcp

# 환경변수 필수
TAVILY_API_KEY=tvly-dev-xxxxxxxxxxxxx
```

**Tavily API Key 생성 방법:**
1. [Tavily.com](https://tavily.com) 회원가입
2. Dashboard → API Keys
3. `tvly-`로 시작하는 키 생성

### 6. 🎭 Playwright MCP (기본)

```bash
# 설치
npm install -g @modelcontextprotocol/server-playwright

# 추가 설정 불필요 (Playwright 브라우저 자동 다운로드)
```

### 7. ⏰ Time MCP (Python 기반)

```bash
# Python 환경 필요 (3.8+)
python --version

# 설치
uvx --from time-mcp time-mcp

# 설정 확인
{
  "time": {
    "type": "stdio", 
    "command": "uvx",
    "args": ["--from", "time-mcp", "time-mcp"]
  }
}
```

### 8. 🧩 Sequential Thinking MCP (기본)

```bash
# 설치
npm install -g @modelcontextprotocol/server-sequential-thinking

# 자동 설정됨
```

### 9. 📚 Context7 MCP (선택사항)

```bash
# 설치
npm install -g context7-mcp

# 환경변수 (선택사항)
CONTEXT7_API_KEY=c7_xxxxxxxxxxxxx
```

### 10. 🎨 Shadcn-UI MCP (기본)

```bash
# 설치
npm install -g @modelcontextprotocol/server-shadcn-ui

# 자동 설정됨
```

### 11. 🔬 Serena MCP (Python 기반)

```bash
# 설치
uvx --from serena serena

# 프로젝트 활성화 필요 (사용 시)
```

---

## 🔧 트러블슈팅

### 자주 발생하는 문제와 해결책

#### 1. MCP 서버 연결 실패

**증상**: `claude mcp list`에서 "Failed to connect" 표시

**해결방법:**
```bash
# Claude Code API 재시작
claude api restart

# 문제 서버 재설정
claude mcp remove [서버명]
claude mcp add [서버명] [명령어]

# 디버그 모드로 원인 파악
claude --debug mcp list
```

#### 2. Supabase ACCESS_TOKEN 인식 실패 (완전 해결됨)

**해결됨**: 2025-08-14 Personal Access Token (PAT) 방식 적용

**올바른 설정 예시:**
```json
# C:\Users\{username}\.claude.json
"supabase": {
  "type": "stdio", 
  "command": "npx",
  "args": [
    "@supabase/mcp-server-supabase@latest",
    "--project-ref", "vnswjnltnhpsueosfhmw", 
    "--access-token", "sbp_90532bce7e5713a964686d52b254175e8c5c32b9"
  ],
  "env": {}
}
```

#### 3. Windows 환경변수 인식 문제

```powershell
# 환경변수 확인
Get-ChildItem Env: | Where-Object {$_.Name -like "*SUPABASE*"}

# 환경변수가 없으면 다시 설정
[System.Environment]::SetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", "sbp_xxx", "User")

# 강제 새로고침 (중요!)
refreshenv

# 또는 PowerShell 완전 재시작
exit
```

#### 4. Python MCP 서버 (time, serena) 오류

```bash
# uvx 설치 확인
where uvx  # Windows
which uvx  # Linux/macOS

# Python 버전 확인 (3.8+ 필요)
python --version

# uvx 재설치
pip install --upgrade uv
```

#### 5. NPM 기반 서버 캐시 문제

```bash
# NPM 캐시 정리
npm cache clean --force

# 글로벌 패키지 재설치
npm uninstall -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-filesystem

# NPX 캐시 정리
npx clear-npx-cache
```

---

## 📊 상태 확인 및 모니터링

### MCP 서버 상태 점검 스크립트

```powershell
# scripts/monitor-mcp-servers.ps1
$servers = @("filesystem", "memory", "github", "supabase", "tavily-mcp", 
             "playwright", "time", "sequential-thinking", "context7", 
             "shadcn-ui", "serena")

Write-Host "🔍 MCP 서버 상태 점검 시작..." -ForegroundColor Green
Write-Host "시간: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

$results = claude mcp list 2>&1
$connected = 0
$failed = 0

foreach ($server in $servers) {
    if ($results -match "$server.*Connected") {
        Write-Host "✅ $server - 정상" -ForegroundColor Green
        $connected++
    } elseif ($results -match "$server.*Failed") {
        Write-Host "❌ $server - 실패" -ForegroundColor Red
        $failed++
    } else {
        Write-Host "⚠️  $server - 상태 불명" -ForegroundColor Yellow
        $failed++
    }
}

Write-Host ""
Write-Host "📊 결과 요약:" -ForegroundColor Cyan
Write-Host "정상: $connected개" -ForegroundColor Green
Write-Host "실패: $failed개" -ForegroundColor Red
Write-Host "성공률: $([math]::Round($connected / $servers.Count * 100, 1))%" -ForegroundColor Cyan
```

### 수동 상태 확인

```bash
# 전체 서버 상태
claude mcp list

# 특정 서버 테스트
claude --debug mcp call filesystem search_files '{"path": "./", "pattern": "*.md"}'

# 환경변수 의존 서버 테스트
claude --debug mcp call supabase list_projects '{}'
claude --debug mcp call github search_repositories '{"query": "test"}'
claude --debug mcp call tavily-mcp tavily-search '{"query": "test"}'
```

---

## 🛡️ 보안 가이드

### 1. 환경변수 보안

```bash
# .env.local (Git에 커밋하지 않음) ✅
SUPABASE_ACCESS_TOKEN=sbp_xxx
TAVILY_API_KEY=tvly-xxx
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx

# .env.local.template (Git에 커밋) ✅
SUPABASE_ACCESS_TOKEN=your_token_here
TAVILY_API_KEY=your_api_key_here
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here
```

### 2. GitHub Token 권한 최소화

**권한 선택 (최소 필요):**
- ✅ `repo` (저장소 접근)
- ✅ `read:user` (사용자 정보)
- ❌ `admin:repo_hook` (불필요)
- ❌ `delete_repo` (위험)

### 3. Supabase 보안 설정

```sql
-- RLS (Row Level Security) 정책 예시
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view own servers"
ON servers FOR SELECT
USING (user_id = auth.uid());
```

### 4. 프로덕션 환경 분리

```typescript
// 개발 환경에서만 MCP 서버 사용
if (process.env.NODE_ENV !== 'production') {
  // MCP 서버 호출
}
```

---

## 🎯 다음 단계

### 설치 완료 후

🎯 **설치 완료 후**: [MCP 활용 가이드](./MCP-USAGE-GUIDE.md) 참조

**포함 내용:**
- 11개 서버별 상세 사용법
- 실전 활용 패턴 (병렬 처리, 체이닝)
- 고급 활용 팁 및 성능 최적화
- OpenManager VIBE v5 특화 예제들

### 추천 학습 순서

1. **기본 서버 활용**: filesystem, memory, time
2. **웹 연동**: tavily-mcp, playwright  
3. **개발 도구**: github, supabase
4. **고급 기능**: sequential-thinking, serena
5. **UI 개발**: shadcn-ui, context7

---

## 📚 참고 자료

### 공식 문서
- [Model Context Protocol 공식 사이트](https://modelcontextprotocol.io/)
- [Claude Code MCP 가이드](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [MCP 서버 레지스트리](https://github.com/modelcontextprotocol/servers)

### 커뮤니티 리소스
- [MCP 서버 컬렉션](https://github.com/punkpeye/awesome-mcp-servers)
- [MCP 개발 가이드](https://modelcontextprotocol.io/docs/guides/building-a-server)

---

> **💡 이 가이드는 설치 및 설정에 특화되어 있습니다**  
> 실제 사용법과 고급 활용 패턴은 [MCP 활용 가이드](./MCP-USAGE-GUIDE.md)를 참조하세요.
>
> **🚨 긴급 문제 해결**:  
> `./scripts/monitor-mcp-servers.ps1`를 먼저 실행해보세요.

**작성자**: Claude Code  
**최종 업데이트**: 2025-08-14 19:45 (KST)  
**대상**: MCP 초기 설치 및 설정 사용자