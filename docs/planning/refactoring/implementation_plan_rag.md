# Refactoring Plan: Supabase RAG Engine

## Goal Description

Refactor `src/services/ai/supabase-rag-engine.ts` (approx. 1100 lines) to improve maintainability, readability, and testability. The current file is monolithic and contains mixed responsibilities (types, utilities, caching, keyword extraction, and core logic).

## Proposed Changes

### 1. Extract Types

Create `src/types/rag/rag-types.ts` to house all RAG-related interfaces and types.

#### [NEW] [rag-types.ts](file:///d:/cursor/openmanager-vibe-v5/src/types/rag/rag-types.ts)

- `DocumentMetadata`
- `RAGSearchOptions`
- `RAGEngineSearchResult`
- `RAGSearchResult`
- `_EmbeddingResult`

### 2. Extract Utilities

Create `src/utils/rag/rag-utils.ts` for helper functions.

#### [NEW] [rag-utils.ts](file:///d:/cursor/openmanager-vibe-v5/src/utils/rag/rag-utils.ts)

- `convertDocumentMetadataToAIMetadata`
- `convertAIMetadataToDocumentMetadata`

### 3. Extract Cache Service

Move the in-memory cache logic to a dedicated service.

#### [NEW] [memory-rag-cache.ts](file:///d:/cursor/openmanager-vibe-v5/src/services/rag/memory-rag-cache.ts)

- `MemoryRAGCache` class

### 4. Extract Keyword Extractor

Move the keyword extraction logic (approx. 170 lines) to a separate utility or service.

#### [NEW] [keyword-extractor.ts](file:///d:/cursor/openmanager-vibe-v5/src/services/rag/keyword-extractor.ts)

- `extractKeywords` function/class

### 5. Refactor Main Engine

Update `SupabaseRAGEngine` to use the extracted components.

#### [MODIFY] [supabase-rag-engine.ts](file:///d:/cursor/openmanager-vibe-v5/src/services/ai/supabase-rag-engine.ts)

- Import types and utilities.
- Use `MemoryRAGCache` instance.
- Use `keywordExtractor` for keyword extraction.
- Remove inline class definitions and large helper methods.

## Verification Plan

### Automated Tests

- Run `npm run type-check` to ensure no type errors.
- Run existing tests for RAG engine (if any).
- Create basic unit tests for extracted utilities.

### Manual Verification

- Verify that the AI sidebar and other RAG-dependent features still function correctly.
