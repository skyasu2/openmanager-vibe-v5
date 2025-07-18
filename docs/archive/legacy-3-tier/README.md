# 📚 레거시 3-Tier AI 시스템 문서

> **v5.44.x 이전 버전** - 현재는 2-Mode 시스템으로 대체됨

## 📋 개요

이 폴더에는 OpenManager Vibe v5.44.x 이전에 사용되던 **3-Tier AI 시스템** 관련 문서들이 보관되어 있습니다.

### 3-Tier 시스템 구성

1. **1단계: 로컬 AI 엔진**
   - Supabase RAG Engine
   - Korean AI Engine
   - MCP Context

2. **2단계: GCP Functions**
   - 4개 Cloud Functions
   - 무료 티어 활용

3. **3단계: Google AI**
   - 자연어 처리 전용
   - 최후 수단

### 현재 상태

- ❌ **사용 중단**: v5.45.0에서 2-Mode 시스템으로 완전 대체
- 📚 **참고용**: 마이그레이션 시 참고 자료
- 🔄 **마이그레이션**: [AI 시스템 통합 가이드](../ai-system-unified-guide.md#마이그레이션-가이드) 참조

## 📁 문서 목록

### 핵심 문서
- `gcp-functions-python-refactoring.md` - GCP Functions Python 리팩토링 가이드

### 관련 문서 (docs/archive/)
- `AI_ENGINE_MODES.md` - AI 엔진 모드 시스템
- `AI_LOGGING_USAGE.md` - AI 로깅 사용법
- `ai-system-guide.md` - AI 시스템 가이드 (18KB)
- `gcp-functions-migration-complete.md` - GCP Functions 마이그레이션 완료 보고서

## 🔄 마이그레이션 가이드

### v5.44.x → v5.45.0 주요 변경사항

1. **3-Tier → 2-Mode 시스템**
   - 복잡한 3단계 폴백 → 단순한 2가지 모드
   - GCP Functions 제거 → Supabase RAG 우선

2. **UnifiedAIEngineRouter 통합**
   - 모든 AI 처리를 통합 라우터로
   - Edge Runtime 최적화

3. **성능 개선**
   - 코드 85% 축소 (2,790 → 400 라인)
   - 응답 시간 50% 개선
   - 복잡도 75% 단순화

### 환경변수 변경

```bash
# 기존 (3-Tier)
THREE_TIER_AI_ENABLED=true
THREE_TIER_STRATEGY=performance
THREE_TIER_LOCAL_TIMEOUT=5000
THREE_TIER_GCP_TIMEOUT=8000
THREE_TIER_GOOGLE_TIMEOUT=10000

# 새로운 (2-Mode)
GOOGLE_AI_ENABLED=true  # Google AI 사용 시
# 나머지는 제거됨
```

### API 엔드포인트 변경

```typescript
// 기존 (3-Tier)
const response = await fetch('/api/ai/three-tier', { ... });

// 새로운 (2-Mode)
const response = await fetch('/api/ai/unified-query', { ... });
```

## 📚 현재 문서

현재 v5.45.0의 2-Mode 시스템 문서:

- **[AI 시스템 통합 가이드](../ai-system-unified-guide.md)** - 상세한 사용법과 예시
- **[AI 시스템 완전 가이드](../ai-complete-guide.md)** - 핵심 개념과 개요
- **[시스템 아키텍처](../system-architecture.md)** - 전체 시스템 구조
- **[GCP 완전 가이드](../gcp-complete-guide.md)** - 클라우드 서비스 활용

---

> **참고**: 이 문서들은 참고용으로만 보관되며, 새로운 개발에는 2-Mode 시스템을 사용하세요. 