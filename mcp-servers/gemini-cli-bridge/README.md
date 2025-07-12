# Gemini CLI Bridge MCP Server

WSL 환경의 Claude Code에서 Windows의 Gemini CLI와 통신할 수 있게 해주는 MCP(Model Context Protocol) 서버입니다.

## 🚀 주요 기능

- **WSL ↔ Windows 브릿지**: PowerShell을 통한 안정적인 통신
- **7가지 도구 제공**: 대화, 파일 분석, Git 리뷰, 메모리 관리 등
- **자동 재시도**: 네트워크 오류 시 자동 재시도
- **경로 자동 변환**: WSL 경로를 Windows 경로로 자동 변환

## 📋 제공되는 도구

1. **gemini_chat** - Gemini와 대화
2. **gemini_stats** - 사용량 통계 확인
3. **gemini_clear** - 컨텍스트 초기화
4. **gemini_compress** - 대화 압축 (토큰 절약)
5. **gemini_memory** - 메모리 관리 (list/add/clear)
6. **gemini_analyze_file** - 파일 분석
7. **gemini_review_diff** - Git diff 리뷰

## 🔧 설치 방법

### 1. 의존성 설치

```bash
cd /mnt/d/cursor/openmanager-vibe-v5/mcp-servers/gemini-cli-bridge
npm install
```

### 2. Claude Code 설정

`~/.claude/settings.json`에 다음 추가:

```json
{
  "mcpServers": {
    // ... 기존 서버들 ...
    "gemini-cli-bridge": {
      "command": "node",
      "args": ["/mnt/d/cursor/openmanager-vibe-v5/mcp-servers/gemini-cli-bridge/src/index.js"],
      "env": {
        "GEMINI_TIMEOUT": "30000",
        "GEMINI_MAX_RETRIES": "3"
      }
    }
  }
}
```

### 3. Claude Code 재시작

설정 적용을 위해 Claude Code를 재시작합니다.

## 💬 사용 예시

### 기본 대화
```
Claude: Gemini CLI와 대화해보겠습니다.
[gemini_chat 도구 호출: prompt="안녕하세요, TypeScript 프로젝트 구조에 대해 설명해주세요"]
```

### 파일 분석
```
Claude: 이 파일을 Gemini로 분석하겠습니다.
[gemini_analyze_file 도구 호출: filePath="/path/to/file.ts", prompt="이 코드의 개선점을 찾아주세요"]
```

### Git 리뷰
```
Claude: 현재 변경사항을 Gemini로 리뷰하겠습니다.
[gemini_review_diff 도구 호출: prompt="변경사항을 보안 관점에서 리뷰해주세요"]
```

## 🛠️ 환경 변수

- `GEMINI_TIMEOUT`: 명령 실행 타임아웃 (기본: 30000ms)
- `GEMINI_MAX_RETRIES`: 실패 시 재시도 횟수 (기본: 3)

## 🐛 문제 해결

### PowerShell 실행 권한 문제
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Gemini CLI 찾을 수 없음
Windows에 Gemini CLI가 설치되어 있고 PATH에 등록되어 있는지 확인:
```powershell
gemini --version
```

### 할당량 초과
일일 1,000회 제한에 도달한 경우 다음날까지 대기하거나 다른 계정 사용

## 📄 라이선스

MIT