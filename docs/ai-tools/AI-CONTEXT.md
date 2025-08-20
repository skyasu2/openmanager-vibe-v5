# OpenManager VIBE v5 - 코드베이스 컨텍스트

이 파일은 AI 어시스턴트가 프로젝트를 이해하는 데 도움을 주는 핵심 컨텍스트를 제공합니다.

## 📋 프로젝트 개요

- **이름**: OpenManager VIBE v5
- **버전**: v5.66.40  
- **타입**: AI 중심 서버 모니터링 플랫폼
- **기술**: Next.js 15 + TypeScript + 멀티 AI 에이전트 통합

## 🤖 AI 개발 환경 아키텍처

### 메인 개발 환경 (WSL)

- **Claude Code** - 주력 AI 개발 도구
- **위치**: WSL 터미널 내에서 실행
- **역할**: 코드 작성, 리팩토링, 아키텍처 설계

### 서브 AI 에이전트 (WSL 연동)

- **gemini-cli** - 주력 보조 AI (Claude 사용량 조절 및 토큰 부족시 대체)
- **codex-cli** - ChatGPT Plus 요금제 활용 (추가 코드 생성 옵션)
- **qwen-cli** - 무료 제공량 풍부 (비용 절약용 백업 AI)
- **활용 전략**: Claude Code 토큰 관리 및 비용 최적화

### 보조 개발 환경 (Windows VS Code)

- **GitHub Copilot** - 특수 용도 보조 AI
- **주요 용도**:
  - 🖼️ 이미지 캡쳐 및 분석
  - 📱 시각적 콘텐츠 처리
  - 🔧 WSL 터미널 호스팅
  - 💡 보조 코드 제안

## 🏗️ 핵심 아키텍처

### AI 엔진 시스템 (가장 중요)

```
src/services/ai/UnifiedAIEngineRouter/
├── core.ts (메인 오케스트레이터)
├── types.ts (타입 정의)
├── cache.ts (캐싱 시스템)
├── circuitBreaker.ts (장애 격리)
├── security.ts (보안 레이어)
├── commands.ts (명령 추천)
├── metrics.ts (메트릭 수집)
└── utils.ts (유틸리티)
```

### 서비스 레이어 구조

- **ai/**: 12개 AI 엔진 서비스
- **mcp/**: 10개 MCP 서버 관리
- **auth/**: 인증 서비스
- **metrics/**: 실시간 메트릭

### 컴포넌트 구조

- **ai/**: 20+ AI 관련 컴포넌트
- **dashboard/**: 30+ 대시보드 컴포넌트
- **ui/**: shadcn/ui 기반 컴포넌트

## 🎯 개발 패턴 및 규칙

### 코드 품질 기준

- 파일 크기: 200-400줄 이내
- TypeScript strict mode 100%
- JSDoc 주석 필수
- 모듈화 패턴 준수

### 아키텍처 패턴

- **Singleton**: 인스턴스 관리
- **Circuit Breaker**: 장애 격리
- **Strategy**: AI 엔진 라우팅
- **Observer**: 메트릭 수집

### 성능 최적화

- 캐싱 레이어 필수
- 지연 로딩 활용
- 메모리 최적화
- 서킷 브레이커 적용

## 📁 중요 파일 참조

### 필수 참조 문서

1. `docs/PROJECT-SUMMARY.md` - 프로젝트 개요
2. `docs/development/project-structure.md` - 구조 가이드  
3. `src/services/ai/UnifiedAIEngineRouter.core.ts` - 핵심 로직
4. `package.json` - 스크립트 및 의존성

### 타입 시스템

- `src/types/ai-types.ts` - AI 관련 타입
- `src/types/server-metrics.ts` - 서버 메트릭 타입
- `src/types/unified.ts` - 통합 타입 정의

## 🚀 개발 워크플로우

### 새 기능 개발 시

1. 기존 모듈 패턴 분석
2. 타입 정의 확인
3. 모듈화 방식 적용
4. 테스트 케이스 작성

### 코드 수정 시

1. 영향도 분석
2. 기존 스타일 준수
3. 성능 영향 확인
4. 문서 업데이트

## 🛠️ 도구 및 스크립트

### 자주 사용하는 명령어

- `npm run dev` - 개발 서버
- `npm run test:quick` - 빠른 테스트
- `npm run type-check` - 타입 체크
- `npm run lint:strict` - 엄격한 린트

### 분석 도구

- `npm run analyze` - 번들 분석
- `npm run validate:all` - 전체 검증
- `npm run test:performance` - 성능 테스트

## ⚠️ 주의사항

### 금지 사항

- 900줄 이상 단일 파일 생성
- TypeScript strict 규칙 위반  
- 기존 모듈화 패턴 무시
- 캐싱/보안 레이어 누락

### 권장 사항

- 기존 코드 패턴 재사용
- 점진적 리팩토링
- 지속적 테스트
- 상세한 문서화

---

이 컨텍스트를 기반으로 OpenManager VIBE v5 프로젝트의 코드 스타일과 아키텍처를 이해하고, 일관성 있는 개발을 수행해주세요.
