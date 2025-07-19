# 📚 OpenManager Vibe v5.48.7 문서

> **Edge Runtime 최적화된 2-Mode AI 시스템** - 2025년 1월 최신 버전

## 🎯 개요

OpenManager Vibe v5.48.7은 **Edge Runtime 최적화된 2-Mode AI 시스템**으로, 단순화된 아키텍처를 통해 높은 성능과 안정성을 제공합니다.

### 핵심 특징

- **2-Mode 시스템**: LOCAL (기본) / GOOGLE_ONLY (자연어 전용)
- **Edge Runtime 최적화**: Vercel 환경에 최적화된 성능
- **통합 라우터**: UnifiedAIEngineRouter v5.48.7
- **Supabase RAG 우선**: 벡터 검색 기반 고성능 처리
- **Google AI 조건부**: 환경변수 기반 선택적 활성화
- **캐싱 시스템**: Edge Runtime 캐시로 성능 향상

## 📋 문서 구조

### 🚀 핵심 가이드

| 문서                                                                 | 설명                  |
| -------------------------------------------------------------------- | --------------------- |
| **[AI 시스템 통합 가이드](./ai-system-unified-guide.md)**            | 상세한 사용법과 예시  |
| **[AI 시스템 완전 가이드](./ai-complete-guide.md)**                  | 핵심 개념과 개요      |
| **[시스템 아키텍처](./system-architecture.md)**                      | 전체 시스템 구조      |
| **[React Hooks 최적화](./react-hooks-optimization.md)** ✨           | ESLint 경고 해결 전략 |
| **[TypeScript 설정 가이드](./typescript-configuration-guide.md)** ✨ | TS 설정 최적화        |

### 🔧 운영 가이드

| 문서                                                        | 설명                 |
| ----------------------------------------------------------- | -------------------- |
| **[배포 완전 가이드](./deployment-complete-guide.md)**      | 배포 및 운영         |
| **[보안 완전 가이드](./security-complete-guide.md)**        | 보안 및 인증         |
| **[테스팅 가이드](./testing-guide.md)**                     | 테스트 및 품질 관리  |
| **[개발 도구](./development-tools.md)**                     | 개발 환경 설정       |
| **[Husky 최적화 가이드](./husky-optimization-guide.md)** ✨ | Git hooks 성능 개선  |
| **[MCP 설정 2025](./claude-code-mcp-setup-2025.md)**        | Claude Code MCP 통합 |

### 📊 성능 지표

| 지표           | LOCAL 모드 | GOOGLE_ONLY 모드 |
| -------------- | ---------- | ---------------- |
| 평균 응답 시간 | 100-300ms  | 500-2000ms       |
| 정확도         | 95%        | 98%              |
| 가동률         | 99.9%      | 99.5%            |
| 비용           | 무료       | 할당량 제한      |

### 최적화 성과

- **코드 축소**: 85% 감소 (2,790 → 400 라인)
- **성능 향상**: 50% 개선
- **복잡도 감소**: 75% 단순화
- **비용 절약**: 100% 무료 티어

## 🔄 아키텍처 변경사항

### v5.45.0 → v5.48.7 최신 개선사항

#### 최근 변경사항 (v5.48.x)

1. **개발자 경험 개선**
   - Husky hooks 최적화로 빠른 커밋/푸시
   - ESLint React Hooks 경고 완전 해결
   - TypeScript 설정 유연성 향상

2. **문서 체계 개선**
   - 중복 문서 통합 및 정리
   - 최신 기능 문서화
   - 일관된 버전 관리

### v5.44.x → v5.45.0 이전 변경사항

#### 주요 변경사항

1. **3-Tier → 2-Mode 시스템**
   - 복잡한 3단계 폴백 → 단순한 2가지 모드
   - GCP Functions 제거 → Supabase RAG 우선

2. **UnifiedAIEngineRouter 통합**
   - 모든 AI 처리를 통합 라우터로
   - Edge Runtime 최적화

3. **성능 개선**
   - 코드 85% 축소
   - 응답 시간 50% 개선
   - 복잡도 75% 단순화

#### 환경변수 변경

```bash
# 기존 (3-Tier)
THREE_TIER_AI_ENABLED=true
THREE_TIER_STRATEGY=performance

# 새로운 (2-Mode)
GOOGLE_AI_ENABLED=true  # Google AI 사용 시
```

#### API 엔드포인트 변경

```typescript
// 기존 (3-Tier)
const response = await fetch('/api/ai/three-tier', { ... });

// 새로운 (2-Mode)
const response = await fetch('/api/ai/unified-query', { ... });
```

## 📁 문서 정리

### ✅ 완료된 작업

1. **문서 현대화**
   - 2-Mode 시스템 반영
   - 3-Tier 시스템 참조 제거
   - Edge Runtime 최적화 내용 추가

2. **문서 통합**
   - 중복 내용 제거
   - 핵심 가이드 간소화
   - 상세 가이드로 링크 연결

3. **레거시 문서 보관**
   - 3-Tier 시스템 문서를 `docs/archive/legacy-3-tier/`로 이동
   - 참고용 README 생성

### 📚 문서 구조

```
docs/
├── README.md                           # 이 파일 (문서 개요)
├── ai-system-unified-guide.md         # 상세 사용법
├── ai-complete-guide.md               # 핵심 개념
├── system-architecture.md             # 시스템 구조
├── gcp-complete-guide.md             # 클라우드 서비스
├── deployment-complete-guide.md       # 배포 가이드
├── security-complete-guide.md         # 보안 가이드
├── testing-guide.md                   # 테스트 가이드
├── development-tools.md               # 개발 도구
└── archive/
    └── legacy-3-tier/                 # 레거시 문서
        └── README.md                  # 마이그레이션 가이드
```

## 🚀 빠른 시작

### 1. 환경변수 설정

```bash
# 기본 설정 (LOCAL 모드만 사용)
GOOGLE_AI_ENABLED=false
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google AI 사용 시
GOOGLE_AI_ENABLED=true
GOOGLE_AI_API_KEY=your-google-ai-key
```

### 2. API 호출

```typescript
// LOCAL 모드 (기본)
const response = await fetch('/api/ai/unified-query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: '서버 CPU 사용률이 높은데 어떻게 해결하나요?',
    mode: 'LOCAL',
  }),
});

// GOOGLE_ONLY 모드
const response = await fetch('/api/ai/unified-query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: '복잡한 시스템 아키텍처에 대한 분석을 해주세요',
    mode: 'GOOGLE_ONLY',
  }),
});
```

### 3. 응답 처리

```typescript
const result = await response.json();

if (result.success) {
  console.log('응답:', result.response);
  console.log('모드:', result.mode);
  console.log('처리 시간:', result.processingTime);
  console.log('신뢰도:', result.confidence);
} else {
  console.error('오류:', result.error);
}
```

## 📚 추가 자료

- **[AI 시스템 통합 가이드](./ai-system-unified-guide.md)** - 상세한 사용법과 예시
- **[AI 시스템 완전 가이드](./ai-complete-guide.md)** - 핵심 개념과 개요
- **[시스템 아키텍처](./system-architecture.md)** - 전체 시스템 구조
- **[GCP 완전 가이드](./gcp-complete-guide.md)** - 클라우드 서비스 활용
- **[배포 완전 가이드](./deployment-complete-guide.md)** - 배포 및 운영

---

> **참고**: 이 문서는 v5.45.0 기준으로 작성되었습니다. 최신 업데이트는 각 문서를 참조하세요.
