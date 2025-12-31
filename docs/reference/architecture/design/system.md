# 🏗️ 시스템 아키텍처

## 🏗️ 현재 운영 아키텍처

### 기술 스택
- **Frontend**: Next.js 16 + React 19 + TypeScript strict
- **Backend**: Vercel Edge Functions + Supabase PostgreSQL
- **Monitoring**: FNV-1a Hash Mock Simulation System
- **AI**: 4-AI 교차검증 (Claude/Gemini/Codex/Qwen)

### 레이어 구조
```typescript
// Frontend Layer
app/
├── api/              # 90개 API 엔드포인트
├── dashboard/        # 메인 대시보드
└── (auth)/          # 보호된 라우트

// Service Layer
services/
├── ai/              # AI 엔진 서비스
├── monitoring/      # 서버 모니터링
└── data/           # 데이터 처리

// Data Layer
- Mock Simulation (FNV-1a Hash)
- Supabase PostgreSQL 17
- In-Memory Cache (LRU)
```

### 핵심 특징
- **코드베이스**: 229,451줄 (881개 TypeScript 파일)
- **TypeScript strict**: 100% 완전 달성
- **API 구조**: 기능별 분산 (76개 엔드포인트)
- **배포**: Vercel 무료 티어 최적화 (152ms 응답)
- **비용**: $0 완전 무료 운영

### 현실적 선택
- **기능별 레이어드** > DDD (개발 속도 우선)
- **Mock 시뮬레이션** > GCP VM (비용 절약)
- **기능 완성도** > 이론적 통합 (실무 중심)
