# GCP Functions 통합 - 요약

**원본**: GCP_FUNCTIONS_INTEGRATION.md (1,324줄)
**작성일**: 2025-11-27
**목적**: GCP Cloud Functions 통합 가이드 핵심 요약

---

## 📊 핵심 요약

**GCP Functions 역할**:

- AI 쿼리 처리 (Gemini SDK)
- RAG 벡터 검색
- 서버리스 실행 (무료 티어)

**무료 티어 한도**:

- 호출: 2,000,000회/월
- 컴퓨팅: 400,000 GB-초
- 네트워크: 5GB/월

**배포 명령어**:

```bash
gcloud functions deploy ai-query \
  --runtime nodejs22 \
  --trigger-http \
  --allow-unauthenticated
```

**주요 기능**:

1. Gemini 2.5 Flash 통합
2. Supabase RAG 연동
3. 자동 스케일링

---

**상세 내용**: @docs/ai/GCP_FUNCTIONS_INTEGRATION.md (1,324줄)
