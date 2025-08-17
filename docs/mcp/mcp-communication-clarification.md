ARCHIVED

## 🚨 중요 정정 - MCP는 포트를 사용하지 않습니다

### ❌ 잘못된 정보 (수정 전)

- "MCP 서버가 localhost:3000 포트를 사용한다"
- "개발 서버와 포트가 겹친다"
- `MCP_SERVER_URL=http://localhost:3000` 환경변수 설정

### ✅ 올바른 정보 (실제)

## 1. Claude Code MCP 서버 (로컬 개발 도구)

**통신 방식**: stdio (Standard Input/Output)

- **포트 사용 안 함** - 네트워크 포트를 전혀 사용하지 않습니다
- 프로세스 간 파이프를 통한 직접 통신
- JSON-RPC 메시지 형식으로 데이터 교환
- Next.js 개발 서버(3000번)와 충돌 없음

### 📋 11개 MCP 서버 리스트

```
1. filesystem - 파일 시스템 작업
2. memory - 지식 그래프 관리
3. github - GitHub 저장소 관리
4. supabase - 데이터베이스 작업
5. playwright - 브라우저 자동화
6. time - 시간/시간대 변환
7. context7 - 라이브러리 문서 검색
8. serena - 고급 코드 분석
9. shadcn-ui - UI 컴포넌트 개발
10. tavily-remote - 웹 검색 (Remote MCP, HTTP 사용)
11. sequential-thinking - 복잡한 문제 해결
```

**특별 케이스**: `tavily-remote`만 HTTP를 사용하는 원격 서버입니다. 나머지 10개는 모두 stdio 사용.

### 🔧 Claude Code CLI 설정 방법

```bash
# stdio 기반 서버 추가 (포트 없음)
claude mcp add filesystem npx -- -y @modelcontextprotocol/server-filesystem@latest /project/path

# 원격 서버 추가 (tavily-remote만 해당)
claude mcp add tavily-remote npx -- -y mcp-remote https://mcp.tavily.com/mcp/?tavilyApiKey=tvly-xxxxx
```

## 2. GCP VM MCP 서버 (Google AI 처리용)

**통신 방식**: HTTP

- **포트 10000 사용** - Google Cloud VM에서 실행
- Google AI 자연어 질의 처리 전용
- Claude Code MCP와는 완전히 별개 시스템
- 환경변수: `GCP_MCP_SERVER_URL=http://YOUR_GCP_VM_IP:10000`

## 3. 아키텍처 다이어그램

```
[Claude Code on Windows]
        |
        ├── stdio (pipes) ──> [11개 로컬 MCP 서버]
        |                      - filesystem
        |                      - memory
        |                      - github
        |                      - supabase
        |                      - ...
        |
        └── HTTP ──────────> [tavily-remote MCP]

[Vercel Frontend]
        |
        └── HTTP:10000 ────> [GCP VM MCP 서버]
                              (Google AI 처리)
```

## 4. 수정된 파일들

- `config/README.md` - MCP 포트 관련 잘못된 정보 제거
- `tests/scripts/env-template.env` - MCP_SERVER_URL 제거, stdio 설명 추가
- `feature-cards.data.ts` - 두 MCP 시스템 명확히 구분
- `CHANGELOG.md` - v5.66.33 아키텍처 정정 기록

## 5. 개발자 참고사항

### ✅ 올바른 이해

- Claude Code MCP는 개발 도구로, stdio를 통해 Claude Code와 직접 통신
- 개발 서버(localhost:3000)와 전혀 관련 없음
- 포트 충돌 걱정할 필요 없음

### ❌ 피해야 할 실수

- MCP_SERVER_URL 환경변수 설정 (Claude Code MCP용으로는 불필요)
- localhost:3000이 MCP 서버라고 생각하는 것
- 개발 서버와 MCP 서버를 혼동하는 것

## 6. 참고 자료

- [Model Context Protocol 공식 문서](https://modelcontextprotocol.io)
- [Claude Code MCP 설정 가이드](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [MCP Transport 메커니즘](https://modelcontextprotocol.io/docs/concepts/transports)

---

**작성일**: 2025-08-06
**버전**: v5.66.33
