# Architecture Rules

## Hybrid Architecture
프로젝트는 **Vercel + Cloud Run** 하이브리드 구조를 따릅니다.

### Vercel (Frontend/BFF)
- UI/Interactive 기능
- Edge Runtime 최적화
- 빠른 응답 (Speed First)
- Next.js 16 + React 19

### Cloud Run (AI Engine)
- Heavy Lifting 작업
- LangGraph Multi-Agent 처리
- Python AI 연산

## Database
- **Supabase** (PostgreSQL + pgvector)
- RLS(Row Level Security) 정책 필수
- 벡터 검색 지원

## API Design
- REST 엔드포인트: `/api/*`
- AI Supervisor: `/api/ai/supervisor`
- Health Check: `/api/health`
