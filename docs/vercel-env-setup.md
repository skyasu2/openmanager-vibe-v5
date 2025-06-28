# �� Vercel 환경변수 설정 가이드 (OpenAI 제거)

## 필수 환경변수 설정

### 1. Vercel Dashboard에서 설정

```bash
# Project Settings > Environment Variables

# Supabase 설정 (1차 점검)
NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU

# Supabase 설정 (2차 점검 - Vercel 배포용)
ENCRYPTED_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
ENCRYPTED_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU

# RAG Engine 설정
FORCE_SUPABASE_RAG=true
RAG_VECTOR_DIMENSION=384
RAG_SIMILARITY_THRESHOLD=0.7
RAG_ENGINE_TYPE=SUPABASE_ONLY
```

### 2. CLI로 설정 (선택사항)

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add ENCRYPTED_SUPABASE_URL
vercel env add ENCRYPTED_SUPABASE_KEY
vercel env add FORCE_SUPABASE_RAG
```

### 3. 설정 확인

```bash
vercel env ls
```

## 주요 개선사항

- ❌ **OpenAI API 의존성 완전 제거**
- 🔧 **로컬 임베딩 생성 시스템**
- 🔍 **2회 환경변수 점검 시스템**
- 📊 **Supabase 벡터 DB 전용 최적화**
