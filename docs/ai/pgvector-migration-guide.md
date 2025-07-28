# pgvector 마이그레이션 실행 가이드

> 작성일: 2025.01.27  
> 상태: 실행 대기

## 🚀 마이그레이션 실행 방법

### 옵션 1: Supabase 대시보드 사용 (권장)

1. [Supabase Dashboard](https://app.supabase.com/project/vnswjnltnhpsueosfhmw) 접속
2. SQL Editor 탭으로 이동
3. 아래 SQL 실행:

```sql
-- 1. pgvector extension 확인 (이미 설치된 경우 스킵)
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 2. knowledge_base 테이블 및 함수 생성
-- /supabase/migrations/20250127_enable_pgvector.sql 내용 복사하여 실행
```

### 옵션 2: Supabase CLI 사용 (로컬 설정 필요)

```bash
# 1. Supabase CLI 설치
npm install -g supabase

# 2. 프로젝트 연결
supabase link --project-ref vnswjnltnhpsueosfhmw

# 3. 마이그레이션 실행
supabase db push
```

### 옵션 3: 프로그래밍 방식

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 마이그레이션 SQL 실행
const { error } = await supabase.rpc('exec_sql', {
  query: migrationSQL,
});
```

## 📋 마이그레이션 내용

### 생성되는 객체들

1. **knowledge_base 테이블**
   - 384차원 벡터 임베딩 저장
   - 메타데이터 및 카테고리 지원
   - RLS 정책 적용

2. **검색 함수**
   - `hybrid_search()`: 벡터 + 키워드 하이브리드 검색
   - `cleanup_old_embeddings()`: 오래된 데이터 정리

3. **인덱스**
   - IVFFlat 벡터 인덱스
   - GIN 메타데이터 인덱스
   - 텍스트 검색 인덱스

4. **뷰**
   - `embedding_stats`: 임베딩 통계 모니터링

## ✅ 실행 후 검증

```sql
-- 1. 테이블 생성 확인
SELECT * FROM knowledge_base LIMIT 1;

-- 2. 함수 생성 확인
SELECT proname FROM pg_proc
WHERE proname IN ('hybrid_search', 'cleanup_old_embeddings');

-- 3. 인덱스 생성 확인
SELECT indexname FROM pg_indexes
WHERE tablename = 'knowledge_base';

-- 4. 통계 뷰 확인
SELECT * FROM embedding_stats;
```

## 🔄 다음 단계

마이그레이션 실행 후:

1. **초기 데이터 인덱싱**

   ```typescript
   await vectorIndexingService.updateIncidentEmbeddings(50);
   ```

2. **테스트 검색 실행**

   ```typescript
   const results = await ragEngine.searchSimilar('테스트 쿼리');
   ```

3. **모니터링 설정**
   ```bash
   npm run monitor:embeddings
   ```

## ⚠️ 주의사항

- 마이그레이션은 한 번만 실행 (IF NOT EXISTS 사용)
- 무료 티어 제한 고려 (500MB)
- 기존 임베딩 테이블과 충돌 없음
- RLS 정책이 적용되므로 인증된 사용자만 접근 가능

## 🆘 문제 해결

### pgvector extension 없음

```sql
CREATE EXTENSION vector;
```

### 권한 문제

```sql
GRANT ALL ON SCHEMA public TO postgres;
```

### 인덱스 생성 실패

```sql
-- lists 파라미터 조정
CREATE INDEX ... WITH (lists = 10); -- 더 작은 값으로
```

## 📞 지원

문제 발생 시:

1. Supabase 대시보드의 Logs 확인
2. `npm run health-check` 실행
3. `/docs/mcp-pgvector-integration-report-2025-01-27.md` 참조
