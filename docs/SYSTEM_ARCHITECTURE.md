# 🏗️ 시스템 아키텍처

> **OpenManager Vibe v5.35.0 전체 구조**

## 📊 전체 구조도

```
┌─────────────────┬─────────────────┬─────────────────┐
│   프론트엔드     │     백엔드       │  Enhanced AI    │
├─────────────────┼─────────────────┼─────────────────┤
│ Next.js 15      │ Vercel 서버리스  │ TensorFlow.js   │
│ React 19        │ API Routes      │ MCP Protocol    │
│ TypeScript      │ PostgreSQL      │ Enhanced NLP    │
│ Tailwind CSS    │ Redis Cache     │ Document Search │
└─────────────────┴─────────────────┴─────────────────┘
```

## 🔧 핵심 컴포넌트

### Frontend (Next.js 15)

- **실시간 대시보드**: WebSocket 기반
- **AI 인터페이스**: 자연어 대화
- **서버 관리**: 드래그&드롭 UI
- **반응형 디자인**: 모바일 최적화

### Backend (Vercel Serverless)

- **API Routes**: RESTful 엔드포인트
- **WebSocket**: 실시간 스트리밍
- **인증**: NextAuth.js
- **캐싱**: Redis 고성능

### AI Engine (Enhanced v2.0)

- **MCP 문서 검색**: 키워드 기반
- **컨텍스트 학습**: 세션 기반
- **TensorFlow.js**: 경량 ML
- **Vercel 최적화**: 서버리스 활용

## 📡 데이터 흐름

```
사용자 → Next.js → API Routes → AI Engine
  ↓        ↓         ↓           ↓
WebSocket ← Redis ← PostgreSQL ← TensorFlow.js
```

## 🚀 주요 특징

### 완전 독립 동작

- ❌ 외부 LLM API 의존성 없음
- ✅ TensorFlow.js로 로컬 추론
- ✅ 무료 티어에서 완전 기능

### 고성능 최적화

- **응답 속도**: < 100ms
- **메모리 사용**: < 50MB
- **Vercel 최적화**: 1GB 메모리 제한 대응

자세한 내용은 `docs/ESSENTIAL_DOCUMENTATION.md` 참조
