# 🚀 OpenManager Vibe v5.44.4

> **AI 엔진 통합 서버 관리 플랫폼** - 2025년 5월 중순부터 7주간 개발 진행 중

[![개발 진행](https://img.shields.io/badge/개발-7주차%20진행중-green)](docs/개발-과정.md)
[![AI 엔진](https://img.shields.io/badge/AI%20엔진-통합%20구현-blue)](#ai-엔진-아키텍처)
[![모드](https://img.shields.io/badge/모드-2개-orange)](#운영-모드)
[![응답시간](https://img.shields.io/badge/응답시간-620ms~1200ms-yellow)](#성능)

## 📋 **현재 개발 상황 (2025.07.02)**

### 🔄 **진행 중인 작업**

- **AI 엔진 아키텍처 개선** - 2개 모드 통합 및 성능 최적화
- **서버 관리 시스템 구현** - 실시간 모니터링 및 자동화 기능
- **테스트 체계 강화** - 지속적인 품질 개선 및 안정성 확보
- **문서 체계 정리** - 개발 가이드 및 시스템 문서 통합
- **성능 최적화** - 응답 시간 개선 및 메모리 효율성 향상

### 📅 **개발 타임라인**

```
🚀 2025년 5월 15일: 프로젝트 시작 (기반 구조 구축)
📈 5월 말: 핵심 기능 개발 (1-2주차)
🤖 6월 중순: AI 엔진 통합 (3-4주차)
⚡ 6월 말: 성능 최적화 (5-6주차)
🔧 7월 2일: 현재 진행 중 (7주차)
```

## 🎯 **2개 운영 모드**

### 1. **LOCAL 모드** (기본 모드)

```
Supabase RAG + MCP 컨텍스트 (80%) → 로컬AI (20%)
```

- **성능**: 620ms (빠른 응답)
- **특징**: 로컬 AI 엔진 중심, 네트워크 제한 환경 최적화
- **사용 시나리오**: 일반적인 운영 환경, 빠른 응답 필요 시

### 2. **GOOGLE_AI 모드** (고급 모드)

```
Google AI (40%) → Supabase RAG + MCP 컨텍스트 (40%) → 로컬AI (20%)
```

- **성능**: 1200ms (고급 추론)
- **특징**: 고급 분석, 복잡한 추론, 상세한 보고서 생성
- **사용 시나리오**: 복잡한 장애 분석, 심층 분석 필요 시

## 🤖 **AI 엔진 아키텍처**

### 핵심 구성 요소

1. **Supabase RAG Engine** (메인 엔진)
   - 자연어 처리 및 벡터 검색
   - 한국어 처리 최적화
   - 가중치: LOCAL 모드 80%, GOOGLE_AI 모드 40%

2. **Google AI Studio (Gemini)**
   - 고급 추론 및 복잡한 분석
   - 자연어 이해, 복잡한 질의 처리
   - 가중치: GOOGLE_AI 모드 40%

3. **MCP Context Collector**
   - 표준 MCP 서버 (컨텍스트 수집)
   - 파일 시스템 접근, 표준 도구 제공

4. **로컬 AI 도구들**
   - Korean NLP, Pattern Matcher, Rule-based Engine
   - 가중치: 양쪽 모드 모두 20%

## 📊 **현재 개발 현황**

### 구현 완료 기능

✅ **AI 엔진 통합 시스템**  
✅ **2개 모드 운영 체계**  
✅ **Supabase RAG 엔진**  
✅ **MCP 컨텍스트 수집**  
✅ **한국어 처리 최적화**  
✅ **기본 서버 관리 기능**

### 개발 진행 중

🔄 **성능 최적화**  
🔄 **테스트 커버리지 개선**  
🔄 **문서 체계 정리**  
🔄 **UI/UX 개선**  
🔄 **배포 자동화**

## 🚀 **빠른 시작**

### 1. 설치 및 설정

```bash
# 저장소 클론
git clone https://github.com/your-org/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에 필요한 환경 변수 설정
```

### 2. 개발 서버 실행

```bash
# 개발 서버 시작
npm run dev

# 테스트 실행
npm test

# 빌드 테스트
npm run build
```

## 🔧 **API 사용법**

### 통합 AI 질의 API

```bash
POST /api/ai/unified-query
Content-Type: application/json

{
  "query": "서버 상태를 확인해주세요",
  "mode": "LOCAL"
}
```

### 응답 형식

```json
{
  "success": true,
  "mode": "LOCAL",
  "response": "현재 15개 서버가 모두 정상 상태입니다...",
  "aiEngine": "SupabaseRAG",
  "responseTime": 620,
  "fallbackChain": ["SupabaseRAG", "MCPContext", "LocalAI"],
  "confidence": 0.95
}
```

## 📚 **개발 문서**

- [개발 과정](docs/개발-과정.md) - 7주간의 개발 여정
- [시스템 아키텍처](docs/시스템-아키텍처.md) - 전체 시스템 구조
- [AI 시스템 가이드](docs/AI-시스템-가이드.md) - AI 엔진 사용법
- [배포 가이드](docs/배포-가이드.md) - Vercel 배포 방법
- [개발 도구](docs/개발-도구.md) - 개발 환경 설정

## 🎯 **향후 계획**

### 단기 목표 (1-2주)

- 성능 최적화 완료
- 테스트 커버리지 90% 달성
- 문서 체계 완성

### 중기 목표 (1개월)

- UI/UX 개선
- 추가 AI 엔진 통합
- 배포 자동화 완성

### 장기 목표 (2-3개월)

- 확장성 개선
- 모니터링 시스템 고도화
- 커뮤니티 기능 추가

## 🤝 **기여하기**

프로젝트에 기여하고 싶으시다면:

1. 이슈를 확인하고 논의하세요
2. 포크 후 브랜치를 생성하세요
3. 변경사항을 커밋하고 푸시하세요
4. 풀 리퀘스트를 생성하세요

## 📄 **라이선스**

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 **연락처**

프로젝트 관련 문의사항이 있으시면 이슈를 생성해주세요.

---

> **개발 진행 상황**: 2025년 5월 중순부터 시작하여 현재 7주차 개발 진행 중입니다. 지속적인 개선과 기능 확장을 통해 더 나은 서버 관리 플랫폼을 만들어가고 있습니다.

## 🎯 OpenManager Vibe v5

OpenManager는 서버 관리를 위한 통합 대시보드입니다.

### ✨ 최근 업데이트

#### 🧪 TDD 방식 컴포넌트 분리 완료 (2024-12)

- **MCP 클라이언트 대규모 리팩토링** (1437줄 → 330줄, -77% 감소)
- **컴포넌트 기반 아키텍처** 도입으로 유지보수성 대폭 향상
- **Test-Driven Development** 방법론 완전 적용

**분리된 컴포넌트들:**

- `MCPServerManager` (314줄) - 서버 관리
- `MCPPerformanceMonitor` (282줄) - 성능 모니터링  
- `MCPToolHandler` (504줄) - 도구 호출
- `MCPContextManager` (387줄) - 컨텍스트 관리

### 🚀 주요 기능

- **실시간 서버 모니터링** - CPU, 메모리, 네트워크 상태 추적
- **AI 통합 지원** - Claude, GPT, Gemini 등 다중 AI 엔진
- **MCP 프로토콜** - Model Context Protocol 기반 확장성
- **반응형 UI** - 모바일/데스크톱 최적화
- **실시간 알림** - 서버 상태 변화 즉시 알림

### 🏗️ 아키텍처

```
src/
├── components/           # React 컴포넌트
├── domains/             # 도메인별 기능 모듈
│   ├── ai-sidebar/     # AI 사이드바 (컴포넌트 분리 완료)
│   └── server-management/
├── services/           # 서비스 레이어
│   └── mcp/           # MCP 클라이언트 (TDD 분리 완료)
├── lib/               # 유틸리티 및 헬퍼
└── types/            # TypeScript 타입 정의
```

### 🧪 테스트 전략

- **TDD (Test-Driven Development)** 방법론 적용
- **컴포넌트 단위 테스트** - Vitest + React Testing Library
- **통합 테스트** - API 및 서비스 레이어
- **E2E 테스트** - Playwright (계획)

### 📊 성능 최적화

- **코드 분할** - 동적 import를 통한 번들 크기 최적화
- **컴포넌트 분리** - 단일 책임 원칙 적용
- **메모리 관리** - 효율적인 상태 관리
- **캐싱 전략** - 서버 데이터 캐싱

### 🛠️ 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui
- **State Management**: Zustand
- **Testing**: Vitest, React Testing Library
- **AI Integration**: Multiple AI providers
- **Protocol**: MCP (Model Context Protocol)

### 📈 개발 진행 상황

- ✅ AI 사이드바 컴포넌트 분리 (AISidebarV2: 1462줄 → 926줄)
- ✅ MCP 클라이언트 TDD 분리 (RealMCPClient: 1437줄 → 330줄)
- 🔄 다음 대상: ServerCard 컴포넌트 분리 예정
- 🔄 UnifiedAIEngineRouter 최적화 예정

### 🚀 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 테스트 실행
npm test

# 빌드
npm run build
```

### 📝 개발 가이드

1. **컴포넌트 분리 원칙**
   - 400줄 이상 파일은 분리 대상
   - TDD 방식으로 안전한 리팩토링
   - 단일 책임 원칙 준수

2. **코딩 컨벤션**
   - TypeScript strict 모드
   - ESLint + Prettier 적용
   - 컴포넌트별 테스트 필수

3. **커밋 메시지**
   - feat: 새로운 기능
   - fix: 버그 수정
   - refactor: 리팩토링
   - test: 테스트 관련

### 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.
