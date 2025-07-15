# 🔧 MCP 서버 문제 빠른 해결 가이드

## ✅ WSL 환경 MCP 설정 해결 완료 (2025-07-15)

### Tavily와 Supabase MCP 정상 작동 확인

**문제 원인:**
1. **환경변수 미설정**: WSL 환경에서 MCP 환경변수가 설정되지 않음
2. **Tavily**: npx 직접 실행 시 환경변수 처리 문제
3. **Supabase**: 환경변수 이름 불일치 (NEXT_PUBLIC_SUPABASE_URL vs SUPABASE_URL)

**해결 방법:**
1. `scripts/setup-mcp-env-wsl.sh` 실행으로 환경변수 자동 설정
2. Tavily MCP를 로컬 환경 변수 직접 사용 (wrapper 스크립트 제거)
3. Supabase 환경변수 자동 매핑 (NEXT_PUBLIC_SUPABASE_URL → SUPABASE_URL)
4. **Claude Code 재시작 필수**

### ⚡ WSL 환경 설정 방법

```bash
# 1. 환경변수 설정 스크립트 실행
cd /mnt/d/cursor/openmanager-vibe-v5
bash scripts/setup-mcp-env-wsl.sh
# 옵션 1 선택 (자동으로 .env.local에서 읽기)

# 2. 환경변수 적용
source ~/.bashrc

# 3. 환경변수 확인
echo $GITHUB_TOKEN
echo $SUPABASE_URL
echo $TAVILY_API_KEY

# 4. Claude Code 완전 재시작
# - 시스템 트레이에서도 종료 확인
# - Claude Code 재실행
# - 프로젝트 다시 열기
```

## 📋 변경된 설정 내용

### 1. Tavily MCP (래퍼 스크립트로 복원)
```json
// 현재 설정 (정상 작동)
"tavily": {
  "type": "stdio",
  "command": "node",
  "args": ["./scripts/tavily-mcp-wrapper.mjs"],
  "env": {
    "TAVILY_API_KEY": "${TAVILY_API_KEY}"
  }
}
```

래퍼 스크립트가 환경변수를 안전하게 처리하여 WSL에서도 정상 작동

### 2. Supabase MCP
```json
// 이전 (작동 안함)
"supabase": {
  "env": {
    "SUPABASE_URL": "${SUPABASE_URL}",
    "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
  }
}

// 변경 후 (수정됨)
"supabase": {
  "env": {
    "SUPABASE_URL": "${NEXT_PUBLIC_SUPABASE_URL}",
    "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
  }
}
```

### 3. Filesystem MCP
```json
// 이전
"args": ["-y", "@modelcontextprotocol/server-filesystem", "--allowed-directories", "/path"]

// 변경 후 (간소화)
"args": ["-y", "@modelcontextprotocol/server-filesystem", "/mnt/d/cursor/openmanager-vibe-v5"]
```

## 🚀 문제가 지속되면

### 1단계: 패키지 재설치
```bash
# MCP 패키지 확인
npm list tavily-mcp @supabase/mcp-server-supabase

# 패키지 재설치
npm uninstall tavily-mcp @supabase/mcp-server-supabase
npm install tavily-mcp@latest @supabase/mcp-server-supabase@latest
```

### 2단계: 수동 테스트
```bash
# Tavily MCP 테스트
TAVILY_API_KEY=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 npx -y tavily-mcp --version

# Supabase MCP 테스트
SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \
npx -y @supabase/mcp-server-supabase --version
```

### 3단계: 대체 설정
```bash
# PowerShell에서 실행
cd scripts
.\setup-mcp-servers.ps1

# 또는 설정 초기화
.\reset-mcp-settings.ps1
```

## 📊 현재 MCP 서버 상태

| 서버 | 기능 | 이전 상태 | 현재 상태 | 비고 |
|------|------|-----------|-----------|------|
| **filesystem** | 파일 시스템 접근 | ✅ | ✅ | args 간소화 |
| **github** | GitHub API 통합 | ✅ | ✅ | 변경 없음 |
| **memory** | 컨텍스트 메모리 | ✅ | ✅ | 변경 없음 |
| **supabase** | 데이터베이스 통합 | ❌ | ✅ | 환경변수 매핑 완료 |
| **context7** | 문서 검색 | ✅ | ✅ | 변경 없음 |
| **tavily** | 웹 검색 | ❌ | ✅ | 래퍼 스크립트 복원 |
| ~~**gemini-cli-bridge**~~ | ~~Gemini CLI 브릿지~~ | ❌ | ❌ | MCP 지원 중단, `./tools/g` 사용 |

## 🔍 문제 분석 요약

### 근본 원인
1. **MCP 서버 통신 방식**: stdio (표준 입출력) 사용
2. **래퍼 스크립트 문제**: stdio 통신을 제대로 중계하지 못함
3. **환경변수 불일치**: Claude Code가 기대하는 변수명과 실제 변수명 차이

### 해결 방안
1. **직접 실행**: 래퍼 스크립트 없이 npx로 직접 실행
2. **환경변수 매핑**: ${VARIABLE_NAME} 형식으로 Claude Code가 치환
3. **설정 간소화**: 불필요한 플래그 제거

## 💡 권장사항

### Claude Code 재시작이 가장 중요합니다!
1. **완전 종료**: 시스템 트레이까지 확인
2. **재실행**: Claude Code 새로 시작
3. **검증**: `/mcp` 명령으로 상태 확인

### 문제 해결 순서
1. 환경변수 확인 → 2. 설정 파일 확인 → 3. Claude Code 재시작 → 4. MCP 상태 확인

## 📚 관련 문서
- [MCP 완전 가이드](docs/mcp-complete-guide.md)
- [MCP 유지보수 가이드](docs/mcp-maintenance-guide.md)
- [CLAUDE.md](CLAUDE.md) - MCP 설정 업데이트 섹션 참고

이 가이드는 2025-07-15 기준 실제 문제 해결 과정을 반영합니다.