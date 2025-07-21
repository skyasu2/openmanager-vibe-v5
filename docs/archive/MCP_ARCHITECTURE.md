# MCP (Model Context Protocol) 아키텍처

OpenManager Vibe v5 프로젝트에서는 3가지 타입의 MCP 서버를 사용합니다:

## 1. 로컬 개발용 MCP (Development MCP)

- **용도**: Cursor IDE 등에서 로컬 개발 시 사용
- **위치**: 개발자의 로컬 환경
- **특징**:
  - 코드 자동완성, 리팩토링, 문서 생성 등 개발 도구 기능
  - 로컬 파일 시스템에 직접 접근
  - 개발 생산성 향상을 위한 도구
  - Supabase 데이터베이스 직접 접근 및 관리
- **포함된 서버**:
  - filesystem: 파일 시스템 접근
  - memory: 지식 그래프 기반 메모리
  - duckduckgo-search: 웹 검색
  - sequential-thinking: 순차적 사고 처리
  - openmanager-local: 로컬 개발 서버
  - supabase: Supabase DB 접근 (NEW)

## 2. Vercel Dev Tools MCP (@vercel/mcp-adapter)

- **용도**: 로컬에서 Vercel에 배포된 앱의 상태 확인 및 개발
- **특징**:
  - Vercel에 배포된 애플리케이션과 로컬 개발 환경을 연결
  - 배포된 앱의 실시간 상태 모니터링
  - 디버깅 및 테스트를 위한 직접 접근
  - `VERCEL_AUTOMATION_BYPASS_SECRET`을 통한 보안 접근

## 3. AI Production MCP (Google Cloud VM)

- **용도**: 프로덕션 환경에서 AI 엔진과 Supabase RAG 엔진 통합
- **위치**: Google Cloud VM (http://104.154.205.25:10000)
- **특징**:
  - Supabase RAG 엔진과 협업하여 컨텍스트 기반 AI 응답 생성
  - 실시간 서버 모니터링 데이터 처리
  - NLP 기능: 의도 분석, 엔티티 추출, 감정 분석, 명령 파싱
  - 캐싱 및 성능 최적화
  - 30초/60초 타임아웃 설정으로 안정성 보장

## API 엔드포인트 구조

### 프로덕션 MCP 관련 엔드포인트

- `GET/POST /api/mcp/context-integration` - MCP + RAG 통합 상태 및 쿼리
- `GET/POST /api/mcp/context-integration/health` - MCP 서버 헬스체크
- `GET/POST /api/mcp/context-integration/sync` - RAG 동기화

### 제한사항

- `/api/ai/mcp` - Vercel 환경에서는 비활성화 (로컬 개발용)

## 아키텍처 다이어그램

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Development    │     │  Vercel Dev     │     │  Production     │
│     MCP         │     │  Tools MCP      │     │     MCP         │
│   (Local)       │     │ (@vercel/mcp)   │     │  (GCP VM)       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                         │
         │                       │                         │
    개발 도구               배포 모니터링              AI 엔진 통합
    코드 지원               상태 확인                 RAG + NLP
         │                       │                         │
         └───────────────────────┴─────────────────────────┘
                                 │
                         OpenManager Vibe v5
                           애플리케이션
```

## 환경별 설정

### 로컬 개발

- 모든 MCP 타입 사용 가능
- 개발 효율성 최대화

### Vercel 배포

- Production MCP만 활성화
- Vercel Dev Tools MCP로 원격 접근 가능
- 보안 및 성능 최적화

이러한 멀티 MCP 아키텍처를 통해 개발부터 운영까지 전체 라이프사이클을 효과적으로 지원합니다.
