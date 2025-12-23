# AI Job Queue 시스템 구현 계획서

**Version**: 1.0.0
**Date**: 2025-12-23
**Status**: Approved

---

## 1. 육하원칙 (5W1H) 요약

| 항목 | 내용 |
|------|------|
| **Who (누가)** | OpenManager VIBE 개발팀 |
| **What (무엇을)** | 비동기 AI Job Queue 시스템 구축 |
| **When (언제)** | Phase 1~3 순차 구현 |
| **Where (어디서)** | Supabase (DB) + Cloud Run (Worker) + Vercel (API) |
| **Why (왜)** | 복잡한 AI 쿼리의 Vercel 60초 타임아웃 문제 해결 |
| **How (어떻게)** | Submit → Queue → Process → Notify 패턴 |

---

## 2. WHO - 역할 및 책임

### 2.1 시스템 컴포넌트별 역할

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| **Vercel (BFF)** | Job 접수 및 상태 조회 | 빠른 응답 (< 3초) |
| **Cloud Run (Worker)** | AI 작업 처리 | 장시간 연산 (최대 60분) |
| **Supabase (Storage)** | Job 상태 및 결과 저장 | 데이터 영속성 |
| **Client (Frontend)** | Job 생성 및 폴링 | UX 관리 |

### 2.2 팀 역할 분담

```
┌─────────────────────────────────────────────────────────┐
│                    개발 역할 분담                        │
├─────────────────────────────────────────────────────────┤
│  Frontend Dev  → Job UI, 폴링 로직, 프로그레스 표시     │
│  Backend Dev   → API 엔드포인트, Supabase 스키마       │
│  AI Engineer   → Cloud Run Worker, LangGraph 통합      │
│  DevOps        → Cloud Functions 배포, 모니터링 설정    │
└─────────────────────────────────────────────────────────┘
```

---

## 3. WHAT - 구현 범위

### 3.1 핵심 기능

```
┌─────────────────────────────────────────────────────────────────┐
│                    Job Queue System Scope                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ In Scope:                                                    │
│  ├── Job 생성 API (POST /api/ai/jobs)                           │
│  ├── Job 상태 조회 API (GET /api/ai/jobs/:id)                   │
│  ├── Job 목록 조회 API (GET /api/ai/jobs)                       │
│  ├── Job 취소 API (DELETE /api/ai/jobs/:id)                     │
│  ├── Cloud Run Worker (비동기 처리)                             │
│  ├── Supabase 테이블 (ai_jobs, ai_job_logs)                     │
│  ├── 진행률 업데이트 (Supabase Realtime)                        │
│  └── 쿼리 복잡도 자동 분류                                       │
│                                                                  │
│  ❌ Out of Scope (Phase 2 이후):                                 │
│  ├── WebSocket 실시간 알림                                       │
│  ├── Job 우선순위 큐                                             │
│  ├── 분산 Worker                                                 │
│  └── Job 스케줄링                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 기능 상세

#### 3.2.1 Job 타입

```typescript
type JobType =
  | 'analysis'      // 서버 분석
  | 'report'        // 리포트 생성
  | 'optimization'  // 최적화 제안
  | 'prediction';   // 예측 분석
```

#### 3.2.2 Job 상태 흐름

```
┌─────────┐    ┌────────────┐    ┌───────────┐    ┌───────────┐
│ queued  │ →  │ processing │ →  │ completed │    │  failed   │
└─────────┘    └────────────┘    └───────────┘    └───────────┘
     │               │                                  ↑
     │               └──────────────────────────────────┘
     │                          (에러 발생 시)
     ↓
┌───────────┐
│ cancelled │
└───────────┘
```

---

## 4. WHEN - 구현 일정

### 4.1 Phase 1: 기초 인프라 (3-4일)

| 일차 | 작업 항목 | 산출물 |
|------|----------|--------|
| Day 1 | Supabase 스키마 설계 및 생성 | `ai_jobs` 테이블 |
| Day 2 | Job 생성 API 구현 | `POST /api/ai/jobs` |
| Day 2 | Job 상태 조회 API 구현 | `GET /api/ai/jobs/:id` |
| Day 3 | Cloud Run Worker 기초 | Job 폴링 + 처리 로직 |
| Day 4 | 통합 테스트 | E2E 테스트 통과 |

### 4.2 Phase 2: 프론트엔드 통합 (2-3일)

| 일차 | 작업 항목 | 산출물 |
|------|----------|--------|
| Day 5 | Job 상태 폴링 훅 | `useJobPolling` 훅 |
| Day 6 | 프로그레스 UI 컴포넌트 | `JobProgress` 컴포넌트 |
| Day 7 | AI 사이드바 통합 | 기존 UI와 연동 |

### 4.3 Phase 3: 스마트 라우팅 (2-3일)

| 일차 | 작업 항목 | 산출물 |
|------|----------|--------|
| Day 8 | 쿼리 복잡도 분석기 | `QueryComplexityAnalyzer` |
| Day 9 | 자동 라우팅 로직 | 동기/비동기 자동 선택 |
| Day 10 | 최종 테스트 및 문서화 | 완료 |

### 4.4 마일스톤 다이어그램

```
Week 1                              Week 2
├────────┬────────┬────────┬────────┼────────┬────────┬────────┐
│ Day 1  │ Day 2  │ Day 3  │ Day 4  │ Day 5  │ Day 6  │ Day 7  │
├────────┴────────┴────────┴────────┼────────┴────────┴────────┤
│       Phase 1: 기초 인프라        │  Phase 2: 프론트엔드     │
│       ████████████████████████    │  ████████████████████    │
├───────────────────────────────────┴──────────────────────────┤
│                                                               │
│  Milestone 1: API 완료 ──────────────→ ★ (Day 4)             │
│  Milestone 2: UI 통합 ──────────────────────→ ★ (Day 7)      │
│  Milestone 3: 스마트 라우팅 ─────────────────────→ ★ (Day 10)│
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 5. WHERE - 인프라 구성

### 5.1 리전 전략

```
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Regions                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              asia-northeast1 (Seoul)                  │   │
│  │  ┌────────────┐    ┌──────────────────────────────┐  │   │
│  │  │ Cloud Run  │ ←→ │ Cloud Functions (신규 생성)  │  │   │
│  │  │ AI Engine  │    │ Job Trigger / Scheduler      │  │   │
│  │  └────────────┘    └──────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                             ↕                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Supabase (AWS ap-northeast-2)            │   │
│  │  ┌────────────┐    ┌────────────┐    ┌────────────┐  │   │
│  │  │  ai_jobs   │    │ai_job_logs │    │  Realtime  │  │   │
│  │  │   Table    │    │   Table    │    │  Channel   │  │   │
│  │  └────────────┘    └────────────┘    └────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                             ↕                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Vercel (Edge Global)                 │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  /api/ai/jobs/*  (Job Management APIs)         │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Cloud Functions 신규 생성 (asia-northeast1)

```bash
# 프로젝트 설정
gcloud config set project openmanager-free-tier

# Cloud Functions 배포 (Cloud Run과 동일 리전)
gcloud functions deploy job-processor \
  --gen2 \
  --region=asia-northeast1 \
  --runtime=nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --memory=256MB \
  --timeout=540s
```

### 5.3 서비스 URL 구성

| 서비스 | URL | 용도 |
|--------|-----|------|
| **Vercel** | `openmanager-vibe-v5.vercel.app` | Job API Gateway |
| **Cloud Run** | `ai-engine-*.asia-northeast1.run.app` | AI 처리 Worker |
| **Cloud Functions** | `job-processor-*.asia-northeast1.cloudfunctions.net` | Job 스케줄러 (선택) |
| **Supabase** | `*.supabase.co` | 데이터 저장소 |

---

## 6. WHY - 도입 배경

### 6.1 현재 문제점

```
┌────────────────────────────────────────────────────────────┐
│                    Current Problem                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  User: "모든 서버 분석하고 최적화 리포트 만들어줘"          │
│                        │                                    │
│                        ▼                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Vercel    │ →  │  Cloud Run  │ →  │  AI 분석    │     │
│  │ (max 60s)   │    │  (장시간)   │    │  (2-5분)    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                                                   │
│         ▼                                                   │
│  ⚠️ TIMEOUT ERROR (60초 초과)                              │
│                                                             │
│  문제:                                                      │
│  • Vercel이 Cloud Run 응답을 기다리는 동안 타임아웃 발생    │
│  • 복잡한 쿼리일수록 실패 확률 높음                         │
│  • 사용자 경험 저하 (에러 메시지만 표시)                    │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 6.2 해결 방안

```
┌────────────────────────────────────────────────────────────┐
│                    Solution: Job Queue                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  User: "모든 서버 분석하고 최적화 리포트 만들어줘"          │
│                        │                                    │
│                        ▼ (즉시 응답)                        │
│  ┌─────────────┐    ┌─────────────┐                        │
│  │   Vercel    │ →  │  Supabase   │ ← Job 생성             │
│  │ (< 3초)     │    │  ai_jobs    │                        │
│  └─────────────┘    └─────────────┘                        │
│         │                  │                                │
│         ▼                  ▼ (비동기)                       │
│  📱 Job ID 반환     ┌─────────────┐    ┌─────────────┐     │
│  "작업 시작됨"      │  Cloud Run  │ →  │  AI 분석    │     │
│                     │  (Worker)   │    │  (무제한)   │     │
│         ↓           └─────────────┘    └─────────────┘     │
│  🔄 폴링 (3초 간격)        │                               │
│         ↓                  ▼                                │
│  ✅ 결과 수신        결과 저장 → Supabase                   │
│                                                             │
│  장점:                                                      │
│  • ✅ Vercel 타임아웃 회피 (즉시 응답)                      │
│  • ✅ 장시간 작업 처리 가능 (Cloud Run 60분)                │
│  • ✅ 진행률 실시간 표시                                    │
│  • ✅ 작업 재시도/취소 가능                                 │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 6.3 비용 영향

| 서비스 | 무료 티어 | 예상 사용량 | 영향 |
|--------|----------|------------|------|
| **Supabase** | 500MB DB | +~1KB/job | ✅ 충분 |
| **Cloud Run** | 200만 호출/월 | +100/일 | ✅ 충분 |
| **Cloud Functions** | 200만 호출/월 | +50/일 | ✅ 충분 |

---

## 7. HOW - 구현 방법

### 7.1 Supabase 스키마

```sql
-- ai_jobs 테이블
CREATE TABLE ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,  -- 익명 허용 (포트폴리오)

  -- Job 정보
  type VARCHAR(50) NOT NULL,
  query TEXT NOT NULL,
  priority VARCHAR(10) DEFAULT 'normal',

  -- 상태 관리
  status VARCHAR(20) DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  current_step TEXT,

  -- 결과
  result JSONB,
  error TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- 메타데이터
  metadata JSONB DEFAULT '{}',

  CONSTRAINT valid_status CHECK (
    status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')
  ),
  CONSTRAINT valid_priority CHECK (
    priority IN ('low', 'normal', 'high')
  )
);

-- 인덱스
CREATE INDEX idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX idx_ai_jobs_created ON ai_jobs(created_at DESC);

-- RLS 정책 (읽기 전용 - 포트폴리오)
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON ai_jobs
  FOR SELECT USING (true);

CREATE POLICY "Authenticated insert" ON ai_jobs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owner update" ON ai_jobs
  FOR UPDATE USING (true);
```

### 7.2 API 엔드포인트

#### POST /api/ai/jobs - Job 생성

```typescript
// src/app/api/ai/jobs/route.ts
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { type, query, options } = await request.json();

  const supabase = createClient();

  // 복잡도 분석
  const complexity = analyzeComplexity(query);

  // 간단한 쿼리는 동기 처리
  if (complexity === 'simple') {
    return handleSyncQuery(query);
  }

  // 복잡한 쿼리는 Job 생성
  const { data: job, error } = await supabase
    .from('ai_jobs')
    .insert({
      type,
      query,
      priority: options?.priority || 'normal',
      metadata: { complexity }
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Cloud Run Worker에 Job 전송
  await triggerWorker(job.id);

  return Response.json({
    jobId: job.id,
    status: 'queued',
    pollUrl: `/api/ai/jobs/${job.id}`,
    estimatedTime: estimateTime(complexity)
  });
}
```

#### GET /api/ai/jobs/[id] - Job 상태 조회

```typescript
// src/app/api/ai/jobs/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: job, error } = await supabase
    .from('ai_jobs')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !job) {
    return Response.json({ error: 'Job not found' }, { status: 404 });
  }

  return Response.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    currentStep: job.current_step,
    result: job.result,
    error: job.error,
    createdAt: job.created_at,
    completedAt: job.completed_at
  });
}
```

### 7.3 Cloud Run Worker

```python
# cloud-run-ai-engine/src/workers/job_processor.py
from supabase import create_client
from langchain_google_genai import ChatGoogleGenerativeAI
import asyncio

class JobProcessor:
    def __init__(self):
        self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-preview-05-20")

    async def process_job(self, job_id: str):
        try:
            # 상태 업데이트: processing
            await self.update_status(job_id, "processing", 0, "작업 시작")

            # Job 정보 조회
            job = await self.get_job(job_id)

            # 단계별 처리
            await self.update_status(job_id, "processing", 20, "데이터 수집 중")
            data = await self.collect_data(job["query"])

            await self.update_status(job_id, "processing", 50, "AI 분석 중")
            result = await self.analyze(data)

            await self.update_status(job_id, "processing", 80, "결과 정리 중")
            formatted = await self.format_result(result)

            # 완료
            await self.complete_job(job_id, formatted)

        except Exception as e:
            await self.fail_job(job_id, str(e))

    async def update_status(self, job_id, status, progress, step):
        await self.supabase.table("ai_jobs").update({
            "status": status,
            "progress": progress,
            "current_step": step,
            "started_at": datetime.now().isoformat() if progress == 0 else None
        }).eq("id", job_id).execute()
```

### 7.4 프론트엔드 통합

```typescript
// src/hooks/useJobPolling.ts
export function useJobPolling(jobId: string | null) {
  const [job, setJob] = useState<Job | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    setIsPolling(true);

    const poll = async () => {
      const res = await fetch(`/api/ai/jobs/${jobId}`);
      const data = await res.json();
      setJob(data);

      if (data.status === 'completed' || data.status === 'failed') {
        setIsPolling(false);
        return;
      }

      // 3초 후 다시 폴링
      setTimeout(poll, 3000);
    };

    poll();

    return () => setIsPolling(false);
  }, [jobId]);

  return { job, isPolling };
}
```

---

## 8. 검증 계획

### 8.1 테스트 케이스

| 테스트 | 설명 | 기대 결과 |
|--------|------|----------|
| TC-01 | 간단한 쿼리 동기 처리 | < 5초 응답 |
| TC-02 | 복잡한 쿼리 Job 생성 | Job ID 즉시 반환 |
| TC-03 | Job 상태 폴링 | 진행률 업데이트 |
| TC-04 | Job 완료 결과 조회 | 전체 결과 반환 |
| TC-05 | Job 취소 | 상태 cancelled |
| TC-06 | Worker 에러 처리 | 상태 failed + 에러 메시지 |

### 8.2 성능 목표

| 메트릭 | 목표 | 측정 방법 |
|--------|------|----------|
| Job 생성 응답 시간 | < 500ms | API 호출 측정 |
| 폴링 응답 시간 | < 200ms | API 호출 측정 |
| 진행률 업데이트 지연 | < 5초 | E2E 테스트 |
| 전체 Job 처리 시간 | 기존 대비 무제한 | 벤치마크 |

---

## 9. 롤백 계획

구현 중 문제 발생 시:

1. **Phase 1 롤백**: Supabase 테이블 삭제
2. **Phase 2 롤백**: 기존 동기 방식으로 복귀 (supervisor 라우트)
3. **Phase 3 롤백**: 복잡도 분석 비활성화

```typescript
// 기능 플래그로 제어
const FEATURE_FLAGS = {
  JOB_QUEUE_ENABLED: process.env.ENABLE_JOB_QUEUE === 'true',
  COMPLEXITY_ROUTING: process.env.ENABLE_COMPLEXITY_ROUTING === 'true',
};
```

---

## 10. 체크리스트

### Phase 1 완료 조건
- [ ] Supabase `ai_jobs` 테이블 생성
- [ ] POST /api/ai/jobs 엔드포인트 동작
- [ ] GET /api/ai/jobs/:id 엔드포인트 동작
- [ ] Cloud Run Worker 기본 동작
- [ ] E2E 테스트 통과

### Phase 2 완료 조건
- [ ] useJobPolling 훅 구현
- [ ] JobProgress 컴포넌트 구현
- [ ] AI 사이드바 통합 완료
- [ ] 에러 핸들링 UI 완료

### Phase 3 완료 조건
- [ ] 쿼리 복잡도 분석기 구현
- [ ] 자동 라우팅 로직 완료
- [ ] 전체 문서화 완료
- [ ] 성능 벤치마크 통과

---

## 참고 문서

- [비동기 AI 작업 처리 아키텍처](./async-job-architecture.md)
- [컨텍스트 압축 시스템 설계](./context-compression-design.md)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Cloud Run Timeout](https://cloud.google.com/run/docs/configuring/request-timeout)

---

*Last Updated: 2025-12-23*
