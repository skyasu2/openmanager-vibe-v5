# 🗄️ AI 자연어 질의 로그 저장 시스템 사용 가이드

## 📊 개요

베르셀 파일 업로드 제거에 대응하여 AI 자연어 질의 로그를 Supabase 데이터베이스에 저장하는 시스템입니다.

## 🎯 주요 기능

### 1. 자동 로그 저장

- 모든 AI 질의와 응답이 자동으로 Supabase에 저장됩니다
- 실시간 처리 시간, 신뢰도, 비용 추정 포함
- 로컬 캐시 폴백으로 신뢰성 보장

### 2. 구조화된 데이터

- 세션별 질의 추적
- 엔진별 성능 분석
- 카테고리/의도별 분류
- 토큰 사용량 및 비용 추정

### 3. 무료 티어 최적화

- 30일 자동 정리
- 효율적인 인덱싱
- 배치 처리 최적화

## 🔧 설정 방법

### 1. 데이터베이스 테이블 생성

```sql
-- Supabase SQL Editor에서 실행
-- scripts/create-ai-logs-table.sql 파일 내용 실행
```

### 2. 환경 변수 확인

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. 코드에서 사용

```typescript
import { supabaseAILogger } from '@/services/ai/logging/SupabaseAILogger';

// AI 질의 로그 저장
await supabaseAILogger.logQuery({
  session_id: 'user_session_123',
  query: '서버 상태를 확인해주세요',
  response: '모든 서버가 정상 작동 중입니다.',
  engine_used: 'google-ai',
  mode: 'GOOGLE_ONLY',
  confidence: 0.95,
  processing_time: 1250,
  user_intent: 'monitoring',
  category: 'server',
});
```

## 📈 API 사용 예시

### 1. 로그 조회

```bash
# 최근 50개 로그 조회
GET /api/ai-logs?action=logs&limit=50

# 특정 엔진 로그 조회
GET /api/ai-logs?action=logs&engine=google-ai

# 날짜별 로그 조회
GET /api/ai-logs?action=logs&date_from=2024-01-01&date_to=2024-01-31
```

### 2. 사용 통계 조회

```bash
# AI 사용 통계 조회
GET /api/ai-logs?action=stats

# 응답 예시
{
  "success": true,
  "data": {
    "total_queries": 1250,
    "engines": {
      "google-ai": 800,
      "local": 350,
      "hybrid": 100
    },
    "categories": {
      "server": 500,
      "database": 300,
      "network": 250,
      "performance": 200
    },
    "avg_processing_time": 1100.5,
    "avg_confidence": 0.87
  }
}
```

### 3. 세션별 로그 조회

```bash
# 특정 세션 로그 조회
GET /api/ai-logs?action=sessions&session_id=user_session_123

# 응답 예시
{
  "success": true,
  "session_id": "user_session_123",
  "data": [
    {
      "id": "uuid-123",
      "query": "서버 상태 확인",
      "response": "모든 서버 정상",
      "engine_used": "google-ai",
      "confidence": 0.95,
      "processing_time": 1250,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 15
}
```

## 🧹 유지보수

### 1. 자동 정리

```bash
# 30일 이전 로그 정리
POST /api/ai-logs
{
  "action": "cleanup",
  "retention_days": 30
}
```

### 2. 수동 정리 (SQL)

```sql
-- 수동으로 오래된 로그 정리
SELECT cleanup_old_ai_logs(30);
```

### 3. 통계 조회 (SQL)

```sql
-- 일일 사용량 통계
SELECT * FROM ai_query_stats
WHERE date >= CURRENT_DATE - INTERVAL '7 days';

-- 세션별 사용량
SELECT * FROM ai_session_stats
WHERE last_query >= NOW() - INTERVAL '24 hours';
```

## 🔍 모니터링

### 1. 성능 지표

- 평균 처리 시간
- 엔진별 성공률
- 카테고리별 분포
- 토큰 사용량

### 2. 비용 추정

- 일일/월간 비용 추정
- 엔진별 비용 분석
- 최적화 권장사항

### 3. 품질 관리

- 신뢰도 점수 분석
- 응답 품질 모니터링
- 사용자 피드백 수집

## 🛠️ 고급 기능

### 1. 배치 처리

```typescript
// 여러 로그를 한 번에 저장
const logs = [
  { session_id: 'session1', query: '질의1', response: '응답1', ... },
  { session_id: 'session2', query: '질의2', response: '응답2', ... }
];

// 배치 저장 (구현 예정)
await supabaseAILogger.batchLogQueries(logs);
```

### 2. 실시간 분석

```typescript
// 실시간 통계 스트림
await supabaseAILogger.subscribeToStats(stats => {
  console.log('실시간 AI 사용량:', stats);
});
```

### 3. 알림 설정

```typescript
// 임계값 초과 시 알림
await supabaseAILogger.setAlerts({
  dailyQueryLimit: 1000,
  costLimit: 10.0,
  lowConfidenceThreshold: 0.5,
});
```

## 📚 참고 자료

- [Supabase 문서](https://supabase.com/docs)
- [PostgreSQL 성능 튜닝](https://www.postgresql.org/docs/current/performance-tips.html)
- [AI 로그 분석 베스트 프랙티스](https://example.com/ai-logging-best-practices)

## 🔗 관련 파일

- `src/services/ai/logging/SupabaseAILogger.ts` - 메인 로거 클래스
- `scripts/create-ai-logs-table.sql` - 데이터베이스 스키마
- `src/app/api/ai-logs/route.ts` - API 엔드포인트
- `src/services/ai/GoogleAIService.ts` - 통합 예시

---

**베르셀 파일 업로드 제거 대응 완료! 🎉**

이제 AI 자연어 질의 로그가 안전하게 Supabase 데이터베이스에 저장되며,
구글 클라우드와 수파베이스 기반의 견고한 로그 관리 시스템이 구축되었습니다.
