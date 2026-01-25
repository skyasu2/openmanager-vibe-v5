# Architecture Rules

## Directory Structure
Layer-First + Feature Grouping 방식:
- `components/` - UI 컴포넌트 (feature별 하위 폴더)
- `hooks/` - Custom Hooks (feature별 하위 폴더)
- `services/` - 비즈니스 로직, API 클라이언트
- `types/` - TypeScript 타입 정의
- `lib/` - 유틸리티, 핵심 로직
- `stores/` - Zustand 상태 관리
- `__mocks__/` - 테스트 Mock 데이터

## Hybrid Architecture
프로젝트는 **Vercel + Cloud Run** 하이브리드 구조를 따릅니다.

### Vercel (Frontend/BFF)
- UI/Interactive 기능
- Edge Runtime 최적화
- 빠른 응답 (Speed First)
- Next.js 16 + React 19

### Cloud Run (AI Engine)
- Heavy Lifting 작업
- Vercel AI SDK v6 Native Multi-Agent (UIMessageStream, finalAnswer 패턴)
- TypeScript 기반 에이전트 오케스트레이션
- Dual-Path Routing: Fast Path (RegExp ~10ms) + LLM Routing (~200ms)
- Reporter Pipeline: Evaluator-Optimizer 패턴 (0.75 품질 임계값)

## Database
- **Supabase** (PostgreSQL + pgvector)
- RLS(Row Level Security) 정책 필수
- 벡터 검색 지원

## API Design
- REST 엔드포인트: `/api/*`
- AI Supervisor: `/api/ai/supervisor`
- Health Check: `/api/health`

## Data Source (SSOT)

### 서버 메트릭 데이터 소스
**Single Source of Truth**: `public/hourly-data/hour-XX.json`

```
Dashboard (Vercel)              Cloud Run AI
       ↓                              ↓
UnifiedServerDataSource         precomputed-state.ts
       ↓                              ↓
   MetricsProvider  ←─────────────────┘
       ↓
hourly-data/hour-XX.json (24개 파일)
```

### 데이터 수정 시 체크리스트
hourly-data JSON 수정 시 **양쪽 모두 영향받음** (자동 동기화):
- [ ] Dashboard 표시값 확인
- [ ] AI 응답값 확인
- [ ] 두 값이 일치하는지 검증

### 관련 파일
| 컴포넌트 | 파일 | 역할 |
|---------|------|------|
| 데이터 소스 | `public/hourly-data/*.json` | 24시간 시나리오 데이터 |
| Vercel | `src/services/metrics/MetricsProvider.ts` | 메트릭 제공 (캐싱) |
| Vercel | `src/services/data/UnifiedServerDataSource.ts` | API 데이터 소스 |
| Cloud Run | `cloud-run/ai-engine/src/data/precomputed-state.ts` | AI 컨텍스트 |

### 주의사항
- `fixed-24h-metrics.ts`는 **fallback 전용** (hourly-data 로드 실패 시)
- 메트릭 값 변경은 반드시 `hourly-data/*.json`에서 수행
