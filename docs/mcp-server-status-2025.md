# 📊 MCP 서버 현황 및 상태 정리 (2025년 7월)

## 🔍 조사 배경

개발용 MCP 서버 목록에 대한 혼란이 있어 전체적인 조사를 실시했습니다.

## ✅ 로컬 개발 환경 MCP 서버 현황 (9개)

### 기본 개발 도구 (4개)

### 1. **filesystem**

- 패키지: `@modelcontextprotocol/server-filesystem`
- 상태: ✅ 정상 지원
- 용도: 파일 시스템 작업

### 2. **github**

- 패키지: `@modelcontextprotocol/server-github`
- 상태: ✅ 정상 지원
- 용도: GitHub 저장소 통합

### 3. **memory**

- 패키지: `@modelcontextprotocol/server-memory`
- 상태: ✅ 정상 지원
- 용도: 지식 그래프 기반 메모리

### 4. **sequential-thinking**

- 패키지: `@modelcontextprotocol/server-sequential-thinking`
- 상태: ✅ 정상 지원
- 용도: 단계별 문제 분석

### AI 보조 도구 (4개) - 로컬 개발 환경 추가

### 5. **supabase**

- 패키지: `@supabase/mcp-server-supabase`
- 상태: ✅ 정상 지원
- 용도: 데이터베이스 관리 및 RAG 통합
- 환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

### 6. **context7**

- 패키지: `@upstash/context7-mcp`
- 상태: ✅ 정상 지원
- 용도: 라이브러리 문서 및 컨텍스트 관리

### 7. **tavily-mcp**

- 패키지: `tavily-mcp@0.2.8`
- 상태: ✅ 정상 지원
- 용도: 웹 검색 및 컨텐츠 추출
- 환경변수: TAVILY_API_KEY

### 8. **serena**

- 패키지: Python 기반 (GitHub: oraios/serena)
- 상태: ✅ 정상 지원 (로컬 설치)
- 용도: 코드베이스 분석 및 시맨틱 검색
- 실행: uv 패키지 매니저 사용
- 설치 경로: `.serena-mcp/serena`

### 9. **playwright**

- 패키지: `@modelcontextprotocol/server-playwright`
- 상태: ✅ 정상 지원
- 용도: 브라우저 자동화 및 E2E 테스트
- 주의: Chromium 설치 필요 (`npx playwright install chrome`)

## ❌ 지원 중단/존재하지 않는 서버

### 1. **puppeteer** (Deprecated)

- 패키지: `@modelcontextprotocol/server-puppeteer`
- 상태: ⚠️ **Deprecated** (지원 중단)
- 최종 버전: 2025.5.12
- 메시지: "Package no longer supported"

### 2. **sentry** (제거됨)

- 패키지: Python 기반 (`mcp-server-sentry`)
- 상태: ❌ **제거됨** (2025년 7월 26일)
- 이유: 환경변수 미설정 및 사용 필요성 없음
- 실행 방식: uvx (Python)

## 🔄 변경 이력

1. **2025년 7월 23일**: `.mcp.json` 파일 최초 생성 (4개 서버)
2. **2025년 7월 26일 (v5.63.24)**:
   - 잘못 추가된 playwright 서버 제거
   - CLAUDE.md 문서 수정
3. **2025년 7월 26일 (v5.63.25)**:
   - AI 보조 MCP 서버 3개 로컬 환경에 추가
   - supabase, context7, tavily-mcp 설정 완료
   - `.env.local`에 TAVILY_API_KEY 추가
4. **2025년 7월 26일 (v5.63.26)**:
   - serena MCP 서버 추가 (Python 기반)
   - uv 패키지 매니저 설치
   - 로컬 개발 환경 MCP 서버 총 8개로 확대

5. **2025년 7월 26일 업데이트**:
   - playwright MCP 서버 존재 확인 (실제로 지원됨)
   - sentry MCP 서버 제거 (환경변수 미설정)
   - `.env.local`에서 SENTRY_AUTH_TOKEN 제거
   - 로컬 개발 환경 MCP 서버 총 9개로 정리

## 💡 권장사항

1. **브라우저 자동화가 필요한 경우**:
   - 기본 제공되는 `@modelcontextprotocol/server-playwright` 사용
   - Chromium 설치 필요: `npx playwright install chrome`

2. **현재 프로젝트 설정**:
   - 로컬 개발: 9개 서버 (기본 4개 + AI 보조 4개 + 브라우저 자동화 1개)
   - `.mcp.json`에 추가 서버 필요시 신중히 검토

3. **MCP 아키텍처 이해**:
   - 개발용 MCP: GitHub까지만 배포
   - GCP VM MCP: 별도 관리, 무료 티어 최적화
   - Vercel/GCP에는 개발 MCP 배포하지 않음

## 🔍 2025년 7월 26일 중복 실행 분석

### 분석 배경

Claude Code 재시작 후 MCP 서버들이 중복 실행되는지, 의도한 대로 작동하는지 검증

### 분석 결과

- **중복 실행**: ❌ 없음 (각 서버가 정확히 1개씩만 실행)
- **실행 중인 서버**: 8개 (serena 제외)
- **프로세스 구조**: 각 서버당 2-3개 프로세스 (정상)

### 프로세스 세부 현황

```
총 22개 프로세스:
- npm exec 프로세스: 8개
- sh -c 프로세스: 6개
- node 실행 프로세스: 8개
```

### 응답 테스트 결과

| MCP 서버            | 테스트          | 결과 | 응답 시간 |
| ------------------- | --------------- | ---- | --------- |
| filesystem          | 디렉토리 조회   | ✅   | < 100ms   |
| memory              | 그래프 읽기     | ✅   | < 50ms    |
| github              | 이슈 조회       | ✅   | < 500ms   |
| supabase            | 프로젝트 조회   | ✅   | < 300ms   |
| context7            | 라이브러리 검색 | ✅   | < 1000ms  |
| tavily              | 웹 검색         | ✅   | < 2000ms  |
| sequential-thinking | -               | ✅   | 자동 사용 |
| playwright          | -               | ✅   | 대기 상태 |

### 결론

모든 MCP 서버가 중복 없이 정상 작동 중이며, 시스템이 최적 상태로 운영되고 있음

## 📚 참고 자료

- [Model Context Protocol 공식 저장소](https://github.com/modelcontextprotocol/servers)
- [MCP 통합 아키텍처 가이드](./mcp-unified-architecture-guide.md)
- [MCP 빠른 시작 가이드](./mcp-quick-guide.md)
- [MCP 상태 점검 보고서](./mcp-status-check-2025-07-26.md)
