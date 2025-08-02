# Tavily Remote MCP 문제 해결 가이드

> **📍 업데이트**: 이제 `tavily-remote` 서버를 사용합니다 (2025.8.2 기준)

## 🚨 문제 현상

- **에러**: `MCP error -32603: Invalid API key`
- **발생 시점**: tavily-remote 도구 사용 시

## 🔍 원인 분석

### 1. API 키 불일치

```bash
# .env.local 파일의 키
TAVILY_API_KEY=tvly-dev-xxxxxxxxxxxxxxxxxxxxx

# Claude MCP 설정의 키 (다름!)
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxx
```

### 2. API 키 타입 차이

- `tvly-dev-` : 개발용 키 (분당 100회 제한)
- `tvly-` : 프로덕션 키 (분당 1,000회 제한)

### 3. 환경변수 전달 문제

- Claude MCP가 `npx` 명령어로 환경변수를 제대로 전달하지 못함
- `-e` 옵션을 사용해도 tavily-mcp가 환경변수를 인식하지 못함

## 💡 해결 방법

### 방법 1: Remote MCP 방식 (권장)

```bash
# 1. 기존 tavily-mcp 제거 (있다면)
claude mcp remove tavily-mcp

# 2. tavily-remote 설치
claude mcp add tavily-remote npx -- -y mcp-remote https://mcp.tavily.com/mcp/?tavilyApiKey=[YOUR_TAVILY_API_KEY]
```

### 방법 2: 수동 설정 (고급 사용자용)

```json
// ~/.claude.json에 직접 추가
{
  "projects": {
    "/mnt/d/cursor/openmanager-vibe-v5": {
      "mcpServers": {
        "tavily-remote": {
          "command": "npx",
          "args": [
            "-y",
            "mcp-remote",
            "https://mcp.tavily.com/mcp/?tavilyApiKey=[YOUR_TAVILY_API_KEY]"
          ]
        }
      }
    }
  }
}
```

## 🔑 API 키 검증

### 새 API 키 발급

1. https://tavily.com 접속
2. Dashboard에서 새 API 키 생성
3. 개발용(tvly-dev-) 또는 프로덕션(tvly-) 선택

### 키 테스트

```bash
# MCP 서버 상태 확인
claude mcp list

# 또는 Claude에서 직접 테스트
mcp__tavily-remote__tavily_search({ query: "test search" })
```

## 🛠️ 추가 트러블슈팅

### Claude API 재시작

```bash
# 설정 변경 후 재시작
claude api restart
```

### 로그 확인

```bash
# MCP 서버 상태 확인
claude mcp list
```

### 대안: WebSearch 도구 사용

Tavily가 작동하지 않을 경우 Claude의 내장 WebSearch 도구 사용:

```typescript
WebSearch({ query: '검색어' });
```

## 📝 참고사항

- Tavily 무료 티어: 월 1,000회 요청
- 개발 키: 분당 100회 제한
- 프로덕션 키: 분당 1,000회 제한
- API 키는 주기적으로 갱신 필요

## 🔗 관련 링크

- [Tavily 공식 문서](https://docs.tavily.com)
- [Tavily Remote MCP](https://mcp.tavily.com)
- [Claude MCP 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [MCP Remote 패키지](https://www.npmjs.com/package/mcp-remote)
