# 🐧 WSL 환경 MCP 서버 설정 가이드

**기반 조사**: GitHub MCP 저장소 및 WSL 환경변수 베스트 프랙티스  
**대상 환경**: WSL 2 (Ubuntu 24.04 LTS) + Claude Code v1.0.81  
**날짜**: 2025-08-15

## 🔍 **WSL MCP 환경변수 문제 원인**

### 1. WSL 환경변수 격리

- **문제**: Windows 환경변수가 WSL에서 자동으로 사용 불가
- **원인**: WSL은 독립적인 Linux 환경으로 실행
- **해결**: WSL 내부에서 별도 환경변수 설정 필요

### 2. Claude Code 실행 환경 차이

- **문제**: Claude Code가 WSL bash 환경변수를 인식하지 못함
- **원인**: VS Code Remote WSL과 유사한 환경변수 격리 이슈
- **해결**: 올바른 환경변수 설정 방법 적용 필요

## ✅ **올바른 WSL 환경변수 설정법**

### 1. 영구 환경변수 설정 (권장)

```bash
# ~/.bashrc 파일 편집
nano ~/.bashrc

# 파일 끝에 다음 추가 (실제 토큰으로 교체)
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_actual_token_here"
export SUPABASE_PROJECT_ID="vnswjnltnhpsueosfhmw"
export SUPABASE_ACCESS_TOKEN="sbp_your_actual_token_here"
export TAVILY_API_KEY="tvly-your_actual_key_here"
export UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="your_actual_token_here"

# 변경사항 즉시 적용
source ~/.bashrc

# 설정 확인
env | grep -E "(GITHUB|SUPABASE|TAVILY|UPSTASH)"
```

### 2. 보안 강화 설정

```bash
# .bashrc 파일 권한 보안 설정
chmod 600 ~/.bashrc

# 환경변수 파일 분리 (선택사항)
touch ~/.mcp_env
chmod 600 ~/.mcp_env

# ~/.mcp_env 내용
cat > ~/.mcp_env << 'EOF'
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_actual_token_here"
export SUPABASE_ACCESS_TOKEN="sbp_your_actual_token_here"
export TAVILY_API_KEY="tvly-your_actual_key_here"
export UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="your_actual_token_here"
EOF

# ~/.bashrc에서 환경변수 파일 로드
echo "source ~/.mcp_env" >> ~/.bashrc
```

### 3. Claude Code 재시작

```bash
# WSL 터미널에서 Claude Code 실행
claude --version  # 환경변수 확인을 위해

# 환경변수 설정 확인
echo $GITHUB_PERSONAL_ACCESS_TOKEN
```

## 🔧 **MCP 서버별 환경변수 요구사항**

### GitHub MCP 서버

```bash
# 필수 환경변수
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 권한 요구사항
# - repo (저장소 접근)
# - read:org (조직 정보 읽기)
# - read:packages (패키지 읽기)
```

### Supabase MCP 서버

```bash
# 필수 환경변수
export SUPABASE_PROJECT_ID="vnswjnltnhpsueosfhmw"  # 프로젝트 ID
export SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # 서비스 키
```

### Tavily MCP 서버

```bash
# 필수 환경변수
export TAVILY_API_KEY="tvly-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 무료 한도: 1000회 검색/월
```

### Upstash Context7 MCP 서버

```bash
# 필수 환경변수
export UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="your_redis_token_here"

# 무료 한도: 10MB Redis + 10,000 요청/일
```

## 🚀 **WSL 환경 MCP 서버 추가 방법**

### Claude Code에서 MCP 서버 추가

```bash
# WSL 환경에서 올바른 명령어 (Windows cmd 사용 안 함)
claude mcp add context7 --command npx --args "-y @upstash/context7-mcp"

# 다른 MCP 서버들도 동일한 방식
claude mcp add github --command npx --args "-y @modelcontextprotocol/server-github"
claude mcp add supabase --command npx --args "-y @supabase/mcp-server-supabase@latest"
claude mcp add tavily --command npx --args "-y tavily-mcp"
```

### .mcp.json 수동 설정 (현재 적용됨)

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "UPSTASH_REDIS_REST_URL": "${UPSTASH_REDIS_REST_URL}",
        "UPSTASH_REDIS_REST_TOKEN": "${UPSTASH_REDIS_REST_TOKEN}"
      }
    }
  }
}
```

## 🔒 **보안 베스트 프랙티스**

### 1. 토큰 관리

- **절대 금지**: Git 저장소에 토큰 커밋
- **권장**: 환경변수 또는 별도 설정 파일 사용
- **보안**: 파일 권한 600으로 설정 (`chmod 600`)

### 2. 토큰 권한 최소화

```bash
# GitHub PAT 최소 권한
# - repo (필요한 저장소만)
# - read:org (필요 시에만)
# - 불필요한 권한 제거

# Supabase 키
# - 서비스 키 대신 anon 키 사용 고려
# - RLS(Row Level Security) 정책 적용
```

### 3. 토큰 로테이션

```bash
# 정기적 토큰 교체 (권장: 3개월)
# 1. 새 토큰 생성
# 2. 환경변수 업데이트
# 3. Claude Code 재시작
# 4. 기존 토큰 비활성화
```

## 🛠️ **문제 해결 가이드**

### 환경변수 인식 안 됨

```bash
# 1. 환경변수 설정 확인
env | grep -E "(GITHUB|SUPABASE|TAVILY|UPSTASH)"

# 2. .bashrc 다시 로드
source ~/.bashrc

# 3. Claude Code 완전 재시작
# WSL 터미널 종료 후 재시작

# 4. 환경변수 직접 테스트
echo $GITHUB_PERSONAL_ACCESS_TOKEN
```

### MCP 서버 연결 실패

```bash
# 1. 패키지 재설치
npm cache clean --force
npm install -g @upstash/context7-mcp

# 2. 수동 테스트
npx -y @upstash/context7-mcp --help

# 3. Claude Code MCP 상태 확인
claude mcp status
```

### WSL vs Windows 환경변수 충돌

```bash
# WSL 환경변수 우선 설정
export WSLENV="GITHUB_PERSONAL_ACCESS_TOKEN/u:SUPABASE_ACCESS_TOKEN/u"

# 또는 WSL 전용 환경변수만 사용 (권장)
unset Windows환경변수들
```

## 📊 **설정 완료 확인**

### 1. 환경변수 확인

```bash
#!/bin/bash
echo "=== MCP 환경변수 확인 ==="
env | grep -E "(GITHUB|SUPABASE|TAVILY|UPSTASH)" | sort
echo "=== 총 $(env | grep -E '(GITHUB|SUPABASE|TAVILY|UPSTASH)' | wc -l)개 설정됨 ==="
```

### 2. MCP 서버 상태 확인

```bash
# Claude Code에서 확인
claude mcp list

# 또는
claude mcp status
```

### 3. 개별 서버 테스트

```bash
# 각 서버 개별 실행 테스트
npx -y @modelcontextprotocol/server-github --version
npx -y @supabase/mcp-server-supabase@latest --version
npx -y tavily-mcp --version
npx -y @upstash/context7-mcp --version
```

## 💡 **WSL 특화 최적화**

### 1. Shell 설정 최적화

```bash
# .bashrc에 MCP 관련 별칭 추가
alias mcp-status="claude mcp status"
alias mcp-env="env | grep -E '(GITHUB|SUPABASE|TAVILY|UPSTASH)'"
alias mcp-restart="pkill claude && claude"
```

### 2. 환경변수 자동 검증

```bash
#!/bin/bash
# ~/check_mcp_env.sh
echo "🔍 MCP 환경변수 검증 중..."

required_vars=(
    "GITHUB_PERSONAL_ACCESS_TOKEN"
    "SUPABASE_PROJECT_ID"
    "SUPABASE_ACCESS_TOKEN"
    "TAVILY_API_KEY"
    "UPSTASH_REDIS_REST_URL"
    "UPSTASH_REDIS_REST_TOKEN"
)

for var in "${required_vars[@]}"; do
    if [[ -n "${!var}" ]]; then
        echo "✅ $var 설정됨"
    else
        echo "❌ $var 누락"
    fi
done
```

## 🎯 **다음 단계**

1. **환경변수 설정**: 위 가이드에 따라 실제 토큰으로 환경변수 설정
2. **Claude Code 재시작**: WSL 터미널 완전 재시작 후 Claude Code 실행
3. **MCP 상태 확인**: `claude mcp status` 또는 `/mcp` 명령으로 연결 확인
4. **기능 테스트**: 각 MCP 서버 기능 정상 작동 확인

---

💡 **핵심 포인트**: WSL 환경에서는 Windows 명령어(`cmd /c`) 대신 Linux 네이티브 명령어 사용, 환경변수는 `~/.bashrc`에서 `export`로 설정, Claude Code 재시작 필수
