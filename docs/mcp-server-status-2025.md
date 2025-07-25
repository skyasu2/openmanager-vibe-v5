# 📊 MCP 서버 현황 및 상태 정리 (2025년 7월)

## 🔍 조사 배경

개발용 MCP 서버 목록에 대한 혼란이 있어 전체적인 조사를 실시했습니다.

## ✅ 로컬 개발 환경 MCP 서버 현황 (8개)

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

## ❌ 지원 중단/존재하지 않는 서버

### 1. **puppeteer** (Deprecated)

- 패키지: `@modelcontextprotocol/server-puppeteer`
- 상태: ⚠️ **Deprecated** (지원 중단)
- 최종 버전: 2025.5.12
- 메시지: "Package no longer supported"

### 2. **playwright** (존재하지 않음)

- 패키지: `@modelcontextprotocol/server-playwright`
- 상태: ❌ **존재하지 않음**
- 대안:
  - `@playwright/mcp` (Microsoft 공식)
  - `@executeautomation/playwright-mcp-server` (커뮤니티)

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

## 💡 권장사항

1. **브라우저 자동화가 필요한 경우**:
   - Microsoft의 `@playwright/mcp` 사용 권장
   - 설치: `npx @playwright/mcp@latest`

2. **현재 프로젝트 설정**:
   - 로컬 개발: 8개 서버 (기본 4개 + AI 보조 4개)
   - `.mcp.json`에 추가 서버 필요시 신중히 검토

3. **MCP 아키텍처 이해**:
   - 개발용 MCP: GitHub까지만 배포
   - GCP VM MCP: 별도 관리, 무료 티어 최적화
   - Vercel/GCP에는 개발 MCP 배포하지 않음

## 📚 참고 자료

- [Model Context Protocol 공식 저장소](https://github.com/modelcontextprotocol/servers)
- [MCP 통합 아키텍처 가이드](./mcp-unified-architecture-guide.md)
- [MCP 빠른 시작 가이드](./mcp-quick-guide.md)
