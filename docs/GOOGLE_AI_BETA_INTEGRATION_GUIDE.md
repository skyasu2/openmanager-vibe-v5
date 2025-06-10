# 🤖 Google AI Studio (Gemini) 베타 모드 통합 가이드

## 📋 목차

1. [개요](#개요)
2. [아키텍처](#아키텍처)
3. [폴백 시스템](#폴백-시스템)
4. [설정 가이드](#설정-가이드)
5. [API 사용법](#api-사용법)
6. [보안 정책](#보안-정책)
7. [성능 최적화](#성능-최적화)
8. [문제 해결](#문제-해결)

## 🎯 개요

**OpenManager Vibe v5**에 Google AI Studio (Gemini) 고급 AI 분석 기능이 베타 모드로 통합되었습니다.

### 핵심 특징

- **🔄 스마트 폴백 시스템**: Google AI → MCP → RAG → 직접분석 → 기본분석
- **🔐 보안 강화**: 관리자 권한 필수, API 키 보안 처리
- **⚡ 무료 할당량 최적화**: 캐싱 및 스마트 관리
- **🧠 고급 분석**: 서버 모니터링 특화 AI 엔진

## 🏗️ 아키텍처

```mermaid
graph TD
    A[사용자 쿼리] --> B{관리자 인증}
    B -->|인증됨| C{베타 모드 활성화?}
    B -->|인증 실패| Z[접근 거부]
    C -->|YES| D[Google AI 시도]
    C -->|NO| E[MCP 분석]

    D -->|성공| F[🤖 Google AI 응답]
    D -->|실패| E[MCP 분석]

    E -->|성공| G[📡 MCP 응답]
    E -->|실패| H[📚 RAG 엔진]

    H -->|성공| I[📚 RAG 응답]
    H -->|실패| J[🔧 직접 분석]

    J -->|성공| K[🔧 직접 분석 응답]
    J -->|실패| L[📋 기본 분석]

    F --> M[최종 응답]
    G --> M
    I --> M
    K --> M
    L --> M
```

## 🔄 폴백 시스템 (업데이트됨)

### 새로운 폴백 순서

1. **🤖 Google AI Studio (Gemini)** - 베타 모드 활성화 시 최우선
2. **📡 MCP (Model Context Protocol)** - 로컬 도구 기반 분석
3. **📚 RAG 엔진** - 로컬 벡터 DB 기반 문서 검색
4. **🔧 직접 시스템 분석** - 내장 메트릭 분석
5. **📋 기본 분석** - 최종 폴백

### 🆕 RAG 엔진 통합

```typescript
// RAG 엔진이 MCP 다음으로 시도됨
if (this.ragEngine.isReady()) {
  try {
    const ragResult = await this.performRAGAnalysis(intent, context);
    if (ragResult.success && ragResult.confidence > 0.6) {
      console.log('📚 RAG 엔진으로 분석 완료');
      return ragResult;
    }
  } catch (error) {
    console.warn('⚠️ RAG 엔진 분석 실패, 직접 분석으로 폴백:', error);
  }
}
```

## ⚙️ 설정 가이드

### 1. 환경 변수 설정

```bash
# Google AI Studio (Gemini) Configuration
GOOGLE_AI_API_KEY=AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM
GOOGLE_AI_MODEL=gemini-1.5-flash
GOOGLE_AI_BETA_MODE=true
GOOGLE_AI_ENABLED=true
```

### 2. 🔐 관리자 권한 설정

**⚠️ 중요**: Google AI 베타 설정은 **관리자 권한이 필수**입니다.

```typescript
// 관리자 로그인 없이는 접근 불가
if (!adminMode.isAuthenticated) {
  return (
    <div className="access-denied">
      <Shield className="w-5 h-5" />
      <p>관리자 권한이 필요합니다.</p>
    </div>
  );
}
```

### 3. API 키 획득 방법

1. [Google AI Studio](https://aistudio.google.com) 접속
2. 구글 계정으로 로그인
3. "Get API Key" 클릭
4. 새 프로젝트 생성 또는 기존 프로젝트 선택
5. API 키 생성 (AIza로 시작)

## 🔐 보안 정책 (강화됨)

### API 키 보안 강화

- **🚫 기존 키 표시 금지**: 프론트엔드에서 기존 API 키 값 확인 불가
- **🔄 새 값만 입력**: 수정 시 완전히 새로운 API 키만 입력 가능
- **🔒 자동 마스킹**: 저장된 키는 마지막 4자리만 표시 (`••••••••Fhv`)
- **🗑️ 입력 필드 초기화**: 저장 후 입력 필드 자동 클리어

```typescript
// 보안 처리 예시
const saveConfig = async config => {
  // 🔐 관리자 권한 확인
  if (!adminMode.isAuthenticated) {
    alert('⚠️ 관리자 권한이 필요합니다.');
    return;
  }

  // API 키가 제공된 경우에만 업데이트
  if (apiKey && !apiKey.includes('••••••••')) {
    // 새로운 키만 처리
    process.env.GOOGLE_AI_API_KEY = apiKey.trim();
  }

  // 저장 후 입력 필드 초기화
  setConfig(prev => ({ ...prev, apiKey: '' }));
};
```

### 관리자 권한 체크

모든 Google AI 관련 API는 관리자 권한을 요구합니다:

```typescript
// API 엔드포인트에서 권한 체크
const sessionId = request.headers.get('x-session-id');
if (!sessionId || !authManager.hasPermission(sessionId, 'system:admin')) {
  return NextResponse.json(
    {
      success: false,
      error: '관리자 권한이 필요합니다.',
    },
    { status: 403 }
  );
}
```

## 📡 API 사용법

### 설정 API

```typescript
// GET /api/ai/google-ai/config - 설정 조회 (관리자 전용)
// 🔐 x-session-id 헤더 필수
const response = await fetch('/api/ai/google-ai/config', {
  headers: {
    'x-session-id': adminSessionId,
  },
});

// POST /api/ai/google-ai/config - 설정 저장 (관리자 전용)
await fetch('/api/ai/google-ai/config', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-session-id': adminSessionId,
  },
  body: JSON.stringify({
    enabled: true,
    apiKey: 'AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM',
    model: 'gemini-1.5-flash',
  }),
});
```

### 연결 테스트 API

```typescript
// POST /api/ai/google-ai/test - 연결 테스트 (관리자 전용)
const testResult = await fetch('/api/ai/google-ai/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-session-id': adminSessionId,
  },
  body: JSON.stringify({
    apiKey: 'AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM',
    model: 'gemini-1.5-flash',
  }),
});
```

### 상태 조회 API

```typescript
// GET /api/ai/google-ai/status - 상태 및 사용량 조회 (관리자 전용)
const status = await fetch('/api/ai/google-ai/status', {
  headers: {
    'x-session-id': adminSessionId,
  },
});
```

## 🎯 사용 시나리오

### 1. 서버 모니터링 분석

```typescript
// 자동으로 Google AI가 우선 처리됨 (베타 모드 활성화 시)
const query = '현재 서버 상태를 분석해주세요';

// Google AI 응답 예시:
// 🎯 **핵심 요약**
// 현재 3대 서버 모두 정상 운영 중이며, CPU 사용률은 평균 45%로 안정적입니다.
//
// 📊 **상세 분석**
// - Server-1: CPU 42%, 메모리 68%, 응답시간 120ms
// - Server-2: CPU 48%, 메모리 73%, 응답시간 95ms
// - Server-3: CPU 45%, 메모리 65%, 응답시간 110ms
//
// 💡 **권장 조치사항**
// 1. Server-2 메모리 사용률 모니터링 강화 (73% → 80% 임계점 근접)
// 2. 전체적으로 안정적이나 주간 트렌드 분석 권장
```

### 2. 예측 분석

```typescript
const query = '향후 리소스 사용량을 예측해주세요';

// Google AI 베타 기능:
// - 트렌드 패턴 분석
// - 머신러닝 기반 예측
// - 실용적인 권장사항 제공
```

### 3. 문제 해결 지원

```typescript
const query = '서버 응답시간이 느린 원인을 분석해주세요';

// 자동 폴백 시나리오:
// 1. Google AI로 고급 분석 시도
// 2. 실패 시 MCP로 로그 분석
// 3. 실패 시 RAG로 문서 검색
// 4. 실패 시 직접 메트릭 분석
// 5. 최종적으로 기본 분석 제공
```

## ⚡ 성능 최적화

### 할당량 관리

- **Gemini 1.5 Flash**: 15 RPM, 1,500/일 (무료)
- **Gemini 1.5 Pro**: 2 RPM, 50/일 (무료)
- **스마트 캐싱**: 5분간 동일 쿼리 캐시
- **자동 폴백**: 할당량 초과 시 즉시 MCP로 전환

### 캐싱 전략

```typescript
// 고급 분석은 5분 캐시
const cached = this.getCachedResponse(cacheKey, 300000);
if (cached) {
  return {
    success: true,
    content: cached,
    cached: true,
    confidence: 0.95,
  };
}
```

## 🐛 문제 해결

### 일반적인 문제

1. **API 키 오류**

   ```
   해결: API 키가 AIza로 시작하는지 확인, Google AI Studio에서 재생성
   ```

2. **할당량 초과**

   ```
   해결: 자동으로 MCP/RAG로 폴백됨, 15분 후 자동 복구
   ```

3. **관리자 권한 오류**

   ```
   해결: 홈페이지에서 관리자 로그인 (PIN: 4231) 후 재시도
   ```

4. **RAG 엔진 초기화 실패**

   ```
   해결: 문서 인덱스 확인, /api/documents/index 엔드포인트 점검
   ```

### 디버그 명령어

```bash
# Google AI 상태 확인
curl -H "x-session-id: YOUR_SESSION" http://localhost:3000/api/ai/google-ai/status

# 연결 테스트
curl -X POST -H "Content-Type: application/json" \
  -H "x-session-id: YOUR_SESSION" \
  -d '{"apiKey":"AIza...","model":"gemini-1.5-flash"}' \
  http://localhost:3000/api/ai/google-ai/test

# 설정 확인
curl -H "x-session-id: YOUR_SESSION" http://localhost:3000/api/ai/google-ai/config
```

### 로그 확인

```bash
# Google AI 관련 로그
grep "Google AI" logs/ai-analysis/*.log

# 폴백 시스템 로그
grep "폴백\|fallback" logs/ai-analysis/*.log

# RAG 엔진 로그
grep "RAG\|Vector" logs/ai-analysis/*.log
```

## 🎉 성공적인 통합 완료

OpenManager Vibe v5에 Google AI Studio (Gemini)가 성공적으로 통합되어, 사용자는 이제 다음과 같은 고급 기능을 활용할 수 있습니다:

- ✅ **베타 모드 온/오프** - 기존 시스템과 완벽한 호환성
- ✅ **5단계 폴백 시스템** - Google AI → MCP → RAG → 직접분석 → 기본분석
- ✅ **관리자 보안 체계** - 권한 기반 접근 제어
- ✅ **API 키 보안 강화** - 마스킹 및 입력 제한
- ✅ **무료 할당량 최적화** - 캐싱 및 스마트 관리
- ✅ **실시간 사용량 모니터링** - 게이지 및 통계 제공

**🚀 지금 AI 관리자 페이지에서 Google AI 베타 모드를 활성화해보세요!**
