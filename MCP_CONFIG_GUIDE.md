# MCP 구성 가이드

## 🎯 목적별 MCP 환경 분리

### 📁 개발환경 MCP (Cursor IDE)

**목적**: 코딩 및 개발 도구 지원
**설정 파일**: `mcp-cursor.json`
**구성**:

- `openmanager-local`: 로컬 MCP 서버 (개발 전용)
- `filesystem`: 파일 시스템 조작 도구 (개발 필수)
- `git`: Git 브랜치 관리 및 커밋 자동화
- `browser-tools`: 웹 브라우저 자동화 및 스크래핑
- `apidog`: API 테스팅 및 문서화

### 🚀 AI 엔진 MCP (Render 배포)

**목적**: AI 분석 및 서버 모니터링 인텔리전스
**설정 파일**: `mcp-render-ai.json`
**구성**:

- `ai-engine`: 서버 모니터링 AI 분석 엔진
- 기능: 서버 상태 분석, 이상 징후 탐지, 성능 최적화, 예측 분석

## 🔧 환경별 설정

### 개발환경 Cursor 설정

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "./docs", "./src"],
      "description": "파일 시스템 조작 도구 (개발 필수)"
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@smithery/git-mcp"],
      "description": "Git 브랜치 관리 및 커밋 자동화"
    }
  }
}
```

### Render AI 엔진 설정

```json
{
  "mcpServers": {
    "ai-engine": {
      "command": "node",
      "args": ["./mcp-server/server.js"],
      "env": {
        "NODE_ENV": "production",
        "AI_ENGINE_MODE": "true"
      }
    }
  }
}
```

## 🌟 핵심 특징

- **완전 분리**: 개발 도구와 AI 엔진이 독립적으로 동작
- **목적 특화**: 각 환경에 최적화된 도구 구성
- **보안**: 환경별 접근 권한 분리
- **확장성**: 필요에 따른 MCP 추가/제거 가능

## 🚀 사용법

### 개발 시

1. Cursor에서 파일시스템, Git, API 도구 활용
2. 로컬 MCP 서버로 프로젝트 파일 조작

### 배포 시

1. Render에서 AI 엔진 자동 실행
2. 서버 모니터링 및 분석 수행
3. 건강 체크 및 상태 보고

이렇게 구성하면 **개발 효율성**과 **운영 안정성**을 모두 확보할 수 있습니다! 🎉
