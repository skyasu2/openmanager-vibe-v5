# Tavily MCP 문제 해결 가이드

## 🚨 문제 현상

- **에러**: `MCP error -32603: Invalid API key`
- **발생 시점**: tavily-mcp 도구 사용 시

## 🔍 원인 분석

### 1. API 키 불일치

```bash
# .env.local 파일의 키
TAVILY_API_KEY=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

# Claude MCP 설정의 키 (다름!)
TAVILY_API_KEY=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
```

### 2. API 키 타입 차이

- `tvly-dev-` : 개발용 키 (분당 100회 제한)
- `tvly-` : 프로덕션 키 (분당 1,000회 제한)

### 3. 환경변수 전달 문제

- Claude MCP가 `npx` 명령어로 환경변수를 제대로 전달하지 못함
- `-e` 옵션을 사용해도 tavily-mcp가 환경변수를 인식하지 못함

## 💡 해결 방법

### 방법 1: 로컬 설치 방식

```bash
# 1. tavily-mcp 제거
claude mcp remove tavily-mcp

# 2. 올바른 API 키로 재설치
claude mcp add tavily-mcp npx -e TAVILY_API_KEY=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 -- -y tavily-mcp@0.2.9
```

### 방법 2: 원격 MCP 서버 방식 (권장)

```bash
# 원격 서버 URL 사용
claude mcp add tavily-remote npx -- -y mcp-remote https://mcp.tavily.com/mcp/?tavilyApiKey=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
```

### 방법 3: 수동 설정

```json
// ~/.claude.json에 직접 추가
{
  "projects": {
    "/mnt/d/cursor/openmanager-vibe-v5": {
      "mcpServers": {
        "tavily-mcp": {
          "command": "npx",
          "args": ["-y", "tavily-mcp@0.2.9"],
          "env": {
            "TAVILY_API_KEY": "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"
          }
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
# 직접 테스트
export TAVILY_API_KEY="your-key-here"
npx tavily-mcp@0.2.9 test
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
- [Tavily MCP GitHub](https://github.com/tavily-ai/tavily-mcp)
- [Claude MCP 문서](https://docs.anthropic.com/claude/docs/model-context-protocol)
