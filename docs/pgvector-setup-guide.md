# 🚀 pgvector 네이티브 함수 설정 가이드

## 📋 개요

이 가이드는 pgvector 네이티브 함수를 Supabase에 설정하는 방법을 설명합니다.
네이티브 함수를 사용하면 벡터 검색 성능이 평균 **3.6x** 향상됩니다.

## 🔧 설정 방법

### 방법 1: Supabase 대시보드에서 직접 실행 (권장)

1. **Supabase 대시보드 접속**
   - https://app.supabase.com 로그인
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 좌측 메뉴에서 "SQL Editor" 클릭
   - 새 쿼리 생성

3. **SQL 스크립트 실행**
   - 다음 파일의 내용을 복사: `scripts/sql/pgvector_functions.sql`
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭

4. **실행 확인**
   ```sql
   -- 함수 확인
   SELECT proname FROM pg_proc 
   WHERE proname IN (
     'search_similar_vectors',
     'search_vectors_by_category',
     'hybrid_search_vectors',
     'get_vector_stats',
     'search_vectors_with_filters'
   );
   ```

### 방법 2: 마이그레이션 파일 사용

1. **마이그레이션 파일 위치**
   ```
   supabase/migrations/20250805_pgvector_native_functions.sql
   ```

2. **Supabase CLI로 적용** (로컬 개발)
   ```bash
   supabase migration up
   ```

### 방법 3: 스크립트 실행

```bash
# TypeScript 스크립트 실행
tsx scripts/apply-pgvector-functions.ts
```

⚠️ **주의**: 이 방법은 RPC 권한이 필요하며, 대부분의 경우 방법 1을 사용해야 합니다.

## 🧪 함수 테스트

### 1. 통계 확인
```sql
SELECT * FROM get_vector_stats();
```

예상 결과:
```
total_documents | total_categories | avg_content_length | null_embeddings
714            | 8                | 156.5              | 0
```

### 2. 벡터 검색 테스트
```typescript
// TypeScript에서 테스트
const { data, error } = await supabase.rpc('search_similar_vectors', {
  query_embedding: testEmbedding, // 384차원 벡터
  similarity_threshold: 0.3,
  max_results: 5
});
```

### 3. 성능 벤치마크
```bash
# 성능 테스트 실행
tsx scripts/test-pgvector-performance.ts
```

## 📊 생성되는 함수들

| 함수명 | 설명 | 매개변수 |
|--------|------|----------|
| `search_similar_vectors` | 기본 코사인 유사도 검색 | query_embedding, similarity_threshold, max_results |
| `search_vectors_by_category` | 카테고리별 검색 | query_embedding, search_category, similarity_threshold, max_results |
| `hybrid_search_vectors` | 벡터 + 텍스트 하이브리드 검색 | query_embedding, text_query, similarity_threshold, max_results |
| `get_vector_stats` | 벡터 DB 통계 조회 | 없음 |
| `search_vectors_with_filters` | 메타데이터 필터링 검색 | query_embedding, metadata_filter, similarity_threshold, max_results |

## 🏃 성능 향상 예상치

| 검색 유형 | 이전 (클라이언트) | 이후 (네이티브) | 향상률 |
|-----------|------------------|-----------------|--------|
| 기본 검색 | ~600ms | ~175ms | 3.4x |
| 카테고리 검색 | ~500ms | ~150ms | 3.3x |
| 하이브리드 검색 | ~1100ms | ~200ms | 5.5x |

## ⚠️ 주의사항

1. **pgvector 확장 필요**
   - Supabase는 기본적으로 pgvector를 지원합니다
   - 확인: `SELECT * FROM pg_extension WHERE extname = 'vector';`

2. **인덱스 생성**
   - 스크립트에 IVFFlat 인덱스 생성 포함
   - 데이터가 많을수록 인덱스 효과 증대

3. **차원 일치**
   - 현재 384차원으로 설정됨
   - 임베딩 서비스와 차원이 일치해야 함

## 🔍 문제 해결

### "function does not exist" 오류
- SQL 스크립트가 실행되지 않았습니다
- 방법 1을 사용하여 직접 실행하세요

### "permission denied" 오류
- 권한 부여 SQL이 실행되지 않았습니다
- GRANT 문이 포함된 전체 스크립트를 실행하세요

### 성능이 향상되지 않음
- 인덱스가 생성되었는지 확인
- 데이터가 충분한지 확인 (최소 100개 이상)

## 📚 참고 자료

- [pgvector 공식 문서](https://github.com/pgvector/pgvector)
- [Supabase Vector 가이드](https://supabase.com/docs/guides/ai/vector-similarity)
- [성능 최적화 보고서](/docs/pgvector-performance-report.md)