# RAG Migration Guide - Mistral 1024d

## 현재 상태 (2025-12-31)

### 마이그레이션 파일
| 파일 | 상태 | 설명 |
|------|------|------|
| `20251231_migrate_to_mistral_embed.sql` | 적용 필요 | knowledge_base 1024d |
| `20251231_migrate_command_vectors_to_mistral.sql` | 적용 필요 | command_vectors 1024d |
| `20251231_add_missing_rag_functions.sql` | **새로 생성** | 누락된 RPC 함수 |

## Step 1: Supabase SQL 실행

### 방법 A: Supabase Dashboard (권장)
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 → **SQL Editor** 탭
3. 아래 SQL을 순서대로 실행

### 방법 B: Supabase CLI
```bash
supabase login
supabase link --project-ref jdubrjczdyqqtsppojgu
supabase db push
```

---

## SQL 1: match_documents 함수 생성

```sql
-- match_documents (Vector-based search for LlamaIndex)
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(1024),
    match_count INT DEFAULT 10,
    filter JSONB DEFAULT '{}'
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    similarity FLOAT,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.title,
        kb.content,
        1 - (kb.embedding <=> query_embedding) as similarity,
        kb.metadata
    FROM knowledge_base kb
    WHERE kb.embedding IS NOT NULL
      AND (
          filter->>'category' IS NULL
          OR kb.category = filter->>'category'
      )
      AND (
          filter->>'severity' IS NULL
          OR kb.severity = filter->>'severity'
      )
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_documents IS 'Vector similarity search using Mistral embeddings (1024d)';
```

## SQL 2: match_knowledge_base 함수 생성

```sql
-- Enable pg_trgm for text similarity
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- match_knowledge_base (Text-based fallback)
CREATE OR REPLACE FUNCTION match_knowledge_base(
    query_text TEXT,
    match_threshold FLOAT DEFAULT 0.3,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    similarity FLOAT,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.title,
        kb.content,
        GREATEST(
            similarity(kb.title, query_text),
            similarity(kb.content, query_text)
        ) * 0.8 as similarity,
        kb.metadata
    FROM knowledge_base kb
    WHERE
        kb.title ILIKE '%' || query_text || '%'
        OR kb.content ILIKE '%' || query_text || '%'
        OR (kb.search_vector IS NOT NULL AND kb.search_vector @@ plainto_tsquery('english', query_text))
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_knowledge_base IS 'Text-based search fallback for LlamaIndex';
```

## SQL 3: Trigram 인덱스 생성

```sql
-- Trigram indexes for faster text search
CREATE INDEX IF NOT EXISTS idx_knowledge_base_title_trgm
ON knowledge_base USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_trgm
ON knowledge_base USING gin (content gin_trgm_ops);
```

---

## Step 2: 시드 데이터 생성

```bash
# 환경변수 확인
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
echo $MISTRAL_API_KEY

# 시드 스크립트 실행
npx tsx src/scripts/seed-knowledge-base.ts
```

### 예상 결과
```
🚀 Knowledge Base Seeding Started...
📦 Preparing 37 knowledge entries...
🧠 Generating embeddings with Mistral mistral-embed (1024d)...
✅ Generated 37 embeddings (1024 dimensions)
📝 Inserting into knowledge_base table...
══════════════════════════════════════════════════
✅ Seed Completed!
   - Inserted: 37
   - Skipped (duplicates): 0
   - Total entries: 37
══════════════════════════════════════════════════
```

---

## Step 3: 검증

### 함수 존재 확인
```sql
SELECT proname, pronargs
FROM pg_proc
WHERE proname IN ('match_documents', 'match_knowledge_base', 'search_knowledge_base');
```

### 데이터 확인
```sql
SELECT COUNT(*) as total,
       COUNT(embedding) as with_embedding,
       array_length(embedding::float[], 1) as dimension
FROM knowledge_base
LIMIT 1;
```

### 검색 테스트
```sql
-- 테스트: CPU 관련 문서 검색 (text 기반)
SELECT id, title, similarity
FROM match_knowledge_base('CPU 사용량', 0.1, 5);
```

---

## Troubleshooting

### Q: `function match_documents does not exist` 에러
SQL Editor에서 Step 1의 SQL을 다시 실행하세요.

### Q: 시드 실행 시 인증 에러
```bash
# .env.local 확인
cat .env.local | grep -E "SUPABASE|MISTRAL"
```

### Q: 임베딩 차원 불일치 에러
```sql
-- knowledge_base 컬럼 확인
SELECT column_name, udt_name
FROM information_schema.columns
WHERE table_name = 'knowledge_base' AND column_name = 'embedding';
-- 결과: vector(1024) 이어야 함
```

---

## 관련 파일
- Migration: `supabase/migrations/20251231_add_missing_rag_functions.sql`
- Seed Script: `src/scripts/seed-knowledge-base.ts`
- LlamaIndex: `cloud-run/ai-engine/src/lib/llamaindex-rag-service.ts`
- Embedding: `cloud-run/ai-engine/src/lib/embedding.ts`

---
*Last Updated: 2025-12-31*
