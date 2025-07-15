# 🚀 MCP (Model Context Protocol) 완전 가이드

## 📋 현재 적용된 MCP 설정 방식 (2025-07-02 기준)

### 🎯 핵심 특징
- **위치**: `.claude/` 폴더 내 설정 파일들
- **방식**: stdio 통신, npx 패키지 실행
- **환경**: WSL (Windows Subsystem for Linux)
- **경로**: `/mnt/d/cursor/openmanager-vibe-v5`

### 📁 설정 파일 구조
```
.claude/
├── mcp.json                    # MCP 서버 정의
└── settings.local.json         # 권한 및 활성화 설정
```

## 🔧 현재 활성화된 MCP 서버 (7개)

| 서버 | 기능 | 설정 방식 | 환경변수 |
|------|------|-----------|----------|
| **filesystem** | 파일 시스템 접근 | npx | ALLOWED_DIRECTORIES |
| **github** | GitHub API 통합 | npx | GITHUB_TOKEN |
| **memory** | 컨텍스트 메모리 | npx | - |
| **supabase** | 데이터베이스 통합 | npx | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
| **context7** | 문서 검색 | npx | - |
| **tavily** | 웹 검색 | npx | TAVILY_API_KEY |
| ~~**gemini-cli-bridge**~~ | ~~Gemini CLI 브릿지~~ | ~~node~~ | MCP 지원 중단 |

## 🛠️ 설정 파일 상세 분석

### 1. `.claude/mcp.json` - MCP 서버 정의

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "--allowed-directories", "/mnt/d/cursor/openmanager-vibe-v5"],
      "env": {}
    },
    "github": {
      "type": "stdio", 
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
    // ... 기타 서버들
  }
}
```

**주요 특징:**
- `"type": "stdio"` - 표준 입출력 통신
- `"command": "npx"` - npx를 통한 패키지 실행
- `"args": ["-y", "패키지명"]` - 자동 설치 및 실행
- 환경변수는 `${VARIABLE}` 형태로 참조

### 2. `.claude/settings.local.json` - 권한 및 활성화

```json
{
  "permissions": {
    "allow": [
      "mcp__filesystem__read_file",
      "mcp__github__get_file_contents",
      // ... 기타 권한들
    ]
  },
  "enableAllProjectMcpServers": true
}
```

## 🔄 설정 업데이트 방법

### 새로운 MCP 서버 추가

1. **패키지 설치**
```bash
npm install @modelcontextprotocol/server-새서버명
```

2. **`.claude/mcp.json`에 서버 추가**
```json
"새서버명": {
  "type": "stdio",
  "command": "npx", 
  "args": ["-y", "@modelcontextprotocol/server-새서버명"],
  "env": {
    "API_KEY": "${API_KEY}"
  }
}
```

3. **권한 추가 (필요시)**
`.claude/settings.local.json`의 `permissions.allow` 배열에 권한 추가

### 서버 제거

1. **`.claude/mcp.json`에서 서버 설정 제거**
2. **패키지 제거 (선택사항)**
```bash
npm uninstall @modelcontextprotocol/server-서버명
```

## 🌍 환경별 설정 차이

### WSL 환경 (현재)
- **경로**: `/mnt/d/cursor/openmanager-vibe-v5`
- **명령어**: `npx` 사용
- **통신**: stdio

### Windows 환경
- **경로**: `D:\cursor\openmanager-vibe-v5`
- **명령어**: `npx` 또는 `node` 직접
- **통신**: stdio

### Linux 환경  
- **경로**: `/home/user/project`
- **명령어**: `npx` 사용
- **통신**: stdio

## 🚨 문제 해결

### MCP 서버 연결 실패
1. **패키지 설치 확인**
```bash
npm list @modelcontextprotocol/server-서버명
```

2. **환경변수 확인**
```bash
echo $GITHUB_TOKEN
echo $SUPABASE_URL
```

3. **Claude Code 재시작**
```bash
# 모든 Claude 프로세스 종료
pkill -f claude
# 재시작
claude
```

### 권한 오류
`.claude/settings.local.json`의 `permissions.allow` 배열에 필요한 권한이 있는지 확인

### 경로 오류
WSL 환경에서는 `/mnt/d/` 형태의 경로를 사용해야 함

## 📊 성능 최적화

### 현재 적용된 최적화
- **npx 사용**: 패키지 자동 설치 및 실행
- **stdio 통신**: 빠른 프로세스 간 통신
- **환경변수 참조**: 동적 설정 관리
- **권한 최소화**: 필요한 권한만 허용

### 권장사항
1. **불필요한 서버 제거**: 사용하지 않는 MCP 서버는 제거
2. **환경변수 관리**: 민감한 정보는 환경변수로 관리
3. **정기 점검**: 월 1회 MCP 서버 상태 확인

## 🔐 보안 고려사항

### 현재 적용된 보안 조치
- **ALLOWED_DIRECTORIES**: 파일시스템 접근 제한
- **환경변수**: API 키 등 민감 정보 분리
- **권한 제한**: 필요한 기능만 허용
- **stdio 통신**: 로컬 통신으로 보안 강화

### 추가 권장사항
1. **API 키 순환**: 정기적인 API 키 변경
2. **로그 모니터링**: MCP 서버 접근 로그 확인
3. **업데이트**: MCP 패키지 정기 업데이트

## 📈 모니터링 및 관리

### 현재 상태 확인
```bash
# MCP 서버 목록 확인
claude mcp list

# 패키지 설치 상태 확인  
npm list | grep modelcontextprotocol

# 환경변수 확인
env | grep -E "(GITHUB|SUPABASE|TAVILY)"
```

### 로그 확인
- **Claude Code 로그**: `~/.claude/logs/`
- **MCP 서버 로그**: 각 서버별 로그 파일
- **시스템 로그**: `journalctl -f` (Linux)

이 가이드는 현재 프로젝트에 적용된 실제 MCP 설정을 기반으로 작성되었으며, WSL 환경에서 안정적으로 작동하는 방식을 반영합니다.
