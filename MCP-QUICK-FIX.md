# 🔧 MCP 서버 문제 빠른 해결 가이드

## 📋 문제 상황
Claude Code 시작 시 다음과 같은 메시지가 표시됨:
```
6 MCP servers failed to connect (see /mcp for info)
```

## 🚀 빠른 해결책

### 1단계: MCP 설정 리셋
```bash
bash scripts/reset-mcp-settings.sh
```

### 2단계: Claude Code 재시작
```bash
# 모든 Claude 프로세스 종료
pkill -f claude

# Claude Code 재시작
claude
```

### 3단계: 확인
- Claude Code에서 `/mcp` 명령 실행
- 더 이상 오류 메시지가 나타나지 않아야 함

## 🔧 고급 설정 (선택사항)

### 기본 MCP 서버만 설정
```bash
bash scripts/setup-mcp-servers.sh
```

### 환경 변수 설정
```bash
export GITHUB_TOKEN='your-github-token'
export BRAVE_API_KEY='your-brave-api-key'  # 선택사항
```

## 📁 사용 가능한 스크립트

| 스크립트 | 설명 |
|---------|------|
| `reset-mcp-settings.sh` | MCP 설정을 빈 상태로 리셋 |
| `setup-mcp-servers.sh` | 전체 MCP 서버 재설정 |
| `fix-mcp-setup.sh` | 기존 MCP 문제 수정 |

## 🚨 문제 해결 팁

1. **WSL 환경**: Windows 경로 문제로 MCP 서버 연결 실패 가능
2. **환경 변수**: GitHub 토큰이 없으면 GitHub MCP 실패
3. **Node.js 버전**: Node.js 22 이상 권장
4. **권한 문제**: 스크립트에 실행 권한 부여 필요

## 💡 권장사항

MCP 서버는 선택사항입니다. 기본적인 Claude Code 기능 사용에는 필요하지 않으므로, 문제가 지속되면 빈 설정으로 사용하는 것을 권장합니다.