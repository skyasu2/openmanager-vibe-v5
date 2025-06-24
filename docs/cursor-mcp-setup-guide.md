# 🎯 Cursor IDE에서 Fetch MCP Server 사용하기

Cursor IDE에서 공식 Fetch MCP Server를 등록하고 사용하는 완전한 가이드입니다.

## 📖 개요

Cursor IDE에 Fetch MCP Server를 등록하면 채팅에서 다음과 같이 사용할 수 있습니다:

```
@fetch-mcp-server fetch_html https://example.com
@fetch-mcp-server fetch_json https://api.github.com/repos/microsoft/vscode
```

## 🚀 빠른 설정 (자동)

### 1단계: Fetch MCP Server 설치

```bash
# 공식 Fetch MCP Server 설치
bash scripts/setup-fetch-mcp-server.sh
```

### 2단계: Cursor IDE 등록

```bash
# Cursor IDE에 자동 등록
node scripts/setup-cursor-mcp.js
```

### 3단계: Cursor IDE 재시작

- Cursor IDE를 완전히 종료하고 다시 시작하세요

## 🔧 수동 설정 (고급)

### 1. Cursor 설정 파일 위치

운영체제별 Cursor 설정 파일 위치:

```bash
# Windows
%APPDATA%\Cursor\User\settings.json

# macOS
~/Library/Application Support/Cursor/User/settings.json

# Linux
~/.config/Cursor/User/settings.json
```

### 2. settings.json에 MCP 서버 추가

```json
{
  "mcp.servers": {
    "fetch-mcp-server": {
      "name": "Fetch MCP Server",
      "description": "공식 Fetch MCP Server - 웹 콘텐츠 가져오기",
      "command": "node",
      "args": ["./fetch-mcp-server/dist/index.js", "--stdio"],
      "cwd": "D:/cursor/openmanager-vibe-v5",
      "env": {
        "NODE_ENV": "development"
      },
      "tools": ["fetch_html", "fetch_json", "fetch_txt", "fetch_markdown"]
    }
  }
}
```

### 3. HTTP 모드 설정 (선택사항)

```json
{
  "mcp.servers": {
    "fetch-mcp-server-http": {
      "name": "Fetch MCP Server (HTTP)",
      "description": "공식 Fetch MCP Server - HTTP 모드",
      "transport": "http",
      "url": "http://localhost:3001",
      "tools": ["fetch_html", "fetch_json", "fetch_txt", "fetch_markdown"]
    }
  }
}
```

## 🎮 Cursor IDE에서 사용하기

### 1. MCP 서버 연결 확인

1. **명령 팔레트 열기**: `Ctrl+Shift+P` (Windows/Linux) 또는 `Cmd+Shift+P` (macOS)
2. **"MCP: List Servers"** 검색하여 실행
3. `fetch-mcp-server`가 목록에 있는지 확인

### 2. 채팅에서 MCP 서버 사용

```
# HTML 페이지 가져오기
@fetch-mcp-server fetch_html https://news.ycombinator.com

# GitHub API 데이터 가져오기
@fetch-mcp-server fetch_json https://api.github.com/repos/microsoft/vscode

# README 파일 가져오기
@fetch-mcp-server fetch_markdown https://raw.githubusercontent.com/microsoft/vscode/main/README.md

# robots.txt 파일 가져오기
@fetch-mcp-server fetch_txt https://httpbin.org/robots.txt
```

### 3. 사용 예시

#### GitHub 저장소 정보 분석

```
@fetch-mcp-server fetch_json https://api.github.com/repos/microsoft/vscode

이 데이터를 분석해서 다음 정보를 알려주세요:
- 저장소 이름과 설명
- 스타 수와 포크 수
- 주요 프로그래밍 언어
- 최근 업데이트 날짜
```

#### 웹사이트 HTML 분석

```
@fetch-mcp-server fetch_html https://news.ycombinator.com

이 HTML에서 상위 10개 기사의 제목과 링크를 추출해주세요.
```

#### README 파일 요약

```
@fetch-mcp-server fetch_markdown https://raw.githubusercontent.com/microsoft/vscode/main/README.md

이 README 파일을 요약해서 주요 기능과 설치 방법을 알려주세요.
```

## 🔧 고급 설정

### 1. 환경 변수 설정

```json
{
  "mcp.servers": {
    "fetch-mcp-server": {
      "env": {
        "NODE_ENV": "development",
        "FETCH_TIMEOUT": "30000",
        "FETCH_MAX_RETRIES": "3",
        "USER_AGENT": "Cursor-MCP/1.0"
      }
    }
  }
}
```

### 2. 작업 디렉토리 설정

```json
{
  "mcp.servers": {
    "fetch-mcp-server": {
      "cwd": "${workspaceFolder}/fetch-mcp-server"
    }
  }
}
```

### 3. 프로젝트별 설정

프로젝트 루트에 `.cursor-mcp.json` 파일 생성:

```json
{
  "version": "1.0.0",
  "servers": {
    "fetch-mcp-server": {
      "enabled": true,
      "autoStart": false
    }
  }
}
```

## 🛠️ 문제 해결

### MCP 서버가 목록에 나타나지 않는 경우

1. **Cursor IDE 완전 재시작**
2. **설정 파일 경로 확인**

   ```bash
   node scripts/setup-cursor-mcp.js
   ```

3. **설정 파일 문법 검증**

   ```bash
   # JSON 형식 검증
   cat ~/.config/Cursor/User/settings.json | jq .
   ```

### MCP 서버 연결 실패

1. **Fetch MCP Server 설치 확인**

   ```bash
   ls -la fetch-mcp-server/dist/index.js
   ```

2. **수동으로 MCP 서버 테스트**

   ```bash
   cd fetch-mcp-server
   node dist/index.js --stdio
   ```

3. **HTTP 모드로 테스트**

   ```bash
   cd fetch-mcp-server
   node dist/index.js --http --port 3001
   curl http://localhost:3001/health
   ```

### 권한 문제 (Windows)

PowerShell을 관리자 권한으로 실행:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Node.js 경로 문제

Node.js 절대 경로 사용:

```json
{
  "mcp.servers": {
    "fetch-mcp-server": {
      "command": "C:\\Program Files\\nodejs\\node.exe"
    }
  }
}
```

## 📊 성능 최적화

### 1. 타임아웃 설정

```json
{
  "mcp.servers": {
    "fetch-mcp-server": {
      "env": {
        "FETCH_TIMEOUT": "10000"
      }
    }
  }
}
```

### 2. 캐시 설정

```json
{
  "mcp.servers": {
    "fetch-mcp-server": {
      "env": {
        "ENABLE_CACHE": "true",
        "CACHE_TTL": "300"
      }
    }
  }
}
```

### 3. 동시 요청 제한

```json
{
  "mcp.servers": {
    "fetch-mcp-server": {
      "env": {
        "MAX_CONCURRENT_REQUESTS": "5"
      }
    }
  }
}
```

## 🔒 보안 설정

### 1. 허용된 도메인 제한

```json
{
  "mcp.servers": {
    "fetch-mcp-server": {
      "env": {
        "ALLOWED_DOMAINS": "github.com,api.github.com,httpbin.org"
      }
    }
  }
}
```

### 2. 사용자 에이전트 설정

```json
{
  "mcp.servers": {
    "fetch-mcp-server": {
      "env": {
        "USER_AGENT": "MyCompany-Cursor-MCP/1.0"
      }
    }
  }
}
```

### 3. SSL 검증

```json
{
  "mcp.servers": {
    "fetch-mcp-server": {
      "env": {
        "VERIFY_SSL": "true"
      }
    }
  }
}
```

## 📚 실용적인 활용 사례

### 1. 개발 문서 분석

```
@fetch-mcp-server fetch_markdown https://raw.githubusercontent.com/facebook/react/main/README.md

React의 최신 기능과 설치 방법을 요약해주세요.
```

### 2. API 응답 분석

```
@fetch-mcp-server fetch_json https://jsonplaceholder.typicode.com/posts/1

이 JSON 구조를 분석해서 TypeScript 인터페이스를 만들어주세요.
```

### 3. 웹사이트 메타데이터 추출

```
@fetch-mcp-server fetch_html https://stackoverflow.com

이 HTML에서 메타 태그 정보를 추출해주세요:
- title
- description
- keywords
- og:tags
```

### 4. 경쟁사 분석

```
@fetch-mcp-server fetch_html https://competitor-website.com

이 웹사이트의 다음 요소들을 분석해주세요:
- 주요 기능
- 가격 정책
- 기술 스택 (HTML 분석으로 추론)
```

## 🎨 Cursor IDE 통합 팁

### 1. 스니펫으로 자주 사용하는 명령어 저장

```json
{
  "fetch-github-api": {
    "prefix": "fetch-gh",
    "body": ["@fetch-mcp-server fetch_json https://api.github.com/repos/$1/$2"],
    "description": "GitHub API 데이터 가져오기"
  }
}
```

### 2. 키보드 단축키 설정

```json
{
  "key": "ctrl+alt+f",
  "command": "workbench.action.chat.open",
  "args": "@fetch-mcp-server fetch_html "
}
```

### 3. 작업 공간 설정

```json
{
  "mcp.autoConnect": true,
  "mcp.showServerStatus": true,
  "mcp.logLevel": "info"
}
```

---

🎯 **이제 Cursor IDE에서 Fetch MCP Server를 완전히 활용할 수 있습니다!**

웹 콘텐츠를 실시간으로 가져와서 분석하고, AI와 함께 데이터를 처리할 수 있는 강력한 개발 환경을 만들어보세요.
