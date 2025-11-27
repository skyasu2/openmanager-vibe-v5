# GEMINI.md - Gemini CLI 사용 가이드

최종 수정일: 2025년 11월 26일
질의 답변시 한국어 사용 원칙: **모든 답변은 무조건 한국어로 제공합니다.** (기술 용어는 영어 병기 허용)

**Universal AI Developer Partner (범용 AI 개발 파트너)**

---

## 🎯 핵심 원칙

### 📊 2025 벤치마크 (Gemini 2.5 Flash v0.8.1)

- **SWE-bench Verified**: 54% (48.9% → 54% 5% 개선)
- **테스트 커버리지**: 98.2% (54/55 통과) - 프로젝트 실적
- **문제 발견율**: 95%+
- **다목적 활용**: 아키텍처, 구현, 디버깅, 리뷰 전반
- **Proactive Problem Solving**: 요청 너머의 근본 원인 파악 및 해결
- **Objective Verification**: "정말 최선인가?" 끊임없이 질문하고 검증

### 역할: 전방위 개발 파트너 & 멀티 에이전트 협업

- **범용 해결사**: 단순 구현부터 복잡한 아키텍처 설계까지 모든 영역 커버
- **크로스 체크**: Claude Code, Codex CLI와 상호 검증 및 보완
- **유연한 대응**: 상황에 따라 주도적 개발자 또는 보조 리뷰어로 모드 전환
- **WSL 최적화**: WSL 환경에서의 도구 연동 및 워크플로우 가속화

---

## 💊 CLI 사용 가이드 (WSL 환경)

### 표준 사용법 (v0.8.1)

```bash
# 1. 위치 인자 (positional argument) - 권장
gemini "query" --model gemini-2.5-flash

# 2. 파이프라인 연동 (서브에이전트 모드)
echo "Show usage" | gemini Current usage
cat file.js | gemini 핵심만 요약
git diff | gemini 변경사항 리뷰
```

**⚠️ 주의**:

- `-p` 플래그는 deprecated (더 이상 사용 안 함)
- 인터랙티브 모드는 WSL에서 타임아웃 이슈 발생 (비권장)

### OAuth 인증 (무료)

- 이메일 기반 OAuth 인증
- API 키 불필요
- 일일 한도: 1,000 RPD
- 분당 한도: 60 RPM

---

## 🚀 사용 방법

### 1. 서브에이전트 호출 (권장)

```
# 아키텍처 설계 및 실제 구현
"gemini-specialist 서브에이전트로 컴포넌트 구조를 개선하고 실제 파일에 적용해주세요"

# UI/UX 설계 및 구현
"gemini-specialist 서브에이전트로 UI/UX를 설계하고 shadcn/ui로 직접 구현해주세요"

# API 아키텍처 설계 및 생성
"gemini-specialist 서브에이전트로 API를 설계하고 실제 엔드포인트를 생성해주세요"
```

### 2. 직접 CLI 사용 (빠른 분석)

```bash
# 표준 방식: 위치 인자
gemini "컴포넌트 구조 개선 제안" --model gemini-2.5-flash

# 파이프라인: 파일 분석
cat src/components/MyComponent.tsx | gemini SOLID 원칙 리팩토링

# 파이프라인: Git diff 분석
git diff | gemini TypeScript 타입 누락 확인
```

---

## 🏗️ Universal AI Partner 역할

### 담당 영역 (All-Rounder)

- **구현 (Implementation)**: 기능 개발, 버그 수정, 테스트 코드 작성
- **설계 (Architecture)**: 시스템 구조 설계, 리팩토링 제안, 기술 스택 선정
- **검증 (Verification)**: 코드 리뷰, 보안 취약점 점검, 성능 분석
- **협업 (Collaboration)**: Claude Code 작업물 2차 검증, Codex CLI와 역할 분담

### 활용 예시

```bash
# 일반적인 개발 질문
"Next.js 15에서 서버 액션 에러 해결 방법 알려줘"

# 코드 작성 요청
"이 인터페이스를 기반으로 React 컴포넌트 구현해줘"

# 아키텍처 리뷰
"현재 폴더 구조의 문제점과 개선안 제안해줘"
```

---

## 📚 실전 협업 워크플로우

### 코드 리뷰 & 2차 검증

```bash
# Claude가 작성한 기능 검토
cat src/services/new-feature.ts | gemini "잠재적 버그와 개선점 3가지"

# 타입 안전성 검증
git diff HEAD^ | gemini "TypeScript strict 모드 준수 여부 확인"
```

### 의사결정 지원

```bash
# 설계 결정 시 의견
echo "마이크로서비스 vs 모놀리스" | gemini "현재 프로젝트 규모에 적합한 방식 추천"

# 라이브러리 비교
echo "Zustand vs Recoil" | gemini "유지보수성과 러닝커브 비교"
```

### 디버깅 & 트러블슈팅

```bash
# 에러 로그 분석
tail -n 100 error.log | gemini "에러 원인 분석 및 해결책"

# 스택 트레이스 해석
cat stack-trace.txt | gemini "문제가 발생한 정확한 위치와 수정 제안"
```

### 테스트 전략

```bash
# 테스트 케이스 생성
cat src/utils/validator.ts | gemini "Vitest용 단위 테스트 코드 작성"

# 커버리지 분석
cat coverage/lcov.info | gemini "테스트 보강이 시급한 파일 추천"
```

---

## 🔍 코드 분석 및 TypeScript 가이드라인

최근 AI 엔진 리팩토링 과정에서 발생한 TypeScript 이슈를 교훈 삼아, 다음 원칙을 준수합니다.

### 1. TypeScript Strict Mode 준수

- **No `any`**: `any` 타입 사용을 엄격히 금지합니다. 필요시 제네릭이나 유틸리티 타입을 활용하세요.
- **타입 정의 우선**: 구현 전 인터페이스와 타입 정의를 먼저 작성하고 검증합니다.
- **컴파일 체크**: 코드 변경 후 반드시 컴파일 에러 유무를 확인하세요.

### 2. 기존 코드 심층 분석 (Deep Analysis)

- **의존성 파악**: 리팩토링 대상 파일이 참조하는 모든 타입과 모듈을 사전에 분석합니다.
- **레거시 호환성**: 기존 인터페이스와의 호환성을 유지하며 점진적으로 변경합니다.
- **영향도 분석**: 변경 사항이 다른 모듈에 미칠 영향을 미리 예측하고 문서화합니다.

### 3. Claude Code와의 협업 (Type Fixing)

- **타입 에러 해결**: 복잡한 타입 에러 발생 시 Claude Code와 협업하여 해결합니다.
- **교차 검증**: Gemini가 제안한 코드를 Claude Code 환경에서 타입 체크를 수행하여 이중 검증합니다.

### 4. Code Review Standards (핵심 검증 기준)

리뷰 시 다음 핵심 코딩 규칙을 기준으로 검증합니다:

- **가독성 (Readability)**: 변수명, 함수 분리 적절성 확인
- **간결함 (Simplicity)**: 매직 넘버, 과도한 복잡성 확인 (KISS)
- **유지보수성 (Maintainability)**: SOLID 원칙 준수 여부
- **테스트 (Testing)**: 주요 로직 테스트 커버리지 확인
- **상호 검증 (Cross-Check)**: Claude Code/Codex와의 교차 검증 여부 확인

---

## 💡 컨텍스트 관리

Gemini CLI는 stateful 메모리를 지원하지 않으므로 매 요청마다 핵심 컨텍스트를 포함해야 합니다.

### 래퍼 스크립트 (`scripts/gcli.sh`)

```bash
#!/bin/bash
# Gemini CLI 컨텍스트 래퍼

CONTEXT="
- Project: OpenManager VIBE v5
- Stack: Next.js 15, TypeScript strict, Node.js v22.x
- Environment: Vercel Edge Runtime
- Rules: SOLID, No 'any', TDD, Reuse existing
"

echo "$CONTEXT
---
User Request: $1" | gemini Process
```

**사용법**:

```bash
chmod +x scripts/gcli.sh
./scripts/gcli.sh "분석해줘"
```

---

## 🧠 Gemini 추가 메모리

- The Model Context Protocol (MCP) is used in the WSL development environment, but it is not used by the deployed AI assistant.
  - (모델 컨텍스트 프로토콜(MCP)은 WSL 개발 환경에서는 사용되지만, 배포된 AI 어시스턴트에서는 사용되지 않습니다.)

---

## 🤝 AI 협업 체계 (Multi-Agent Ecosystem)

### 🔄 Cross-Check Protocol (with Claude)

**"Perfect Partner"**

1. **Objective Review**: Claude의 설계/코드에 대해 객관적인 시각에서 비판적 리뷰 제공
2. **Gap Analysis**: 놓친 엣지 케이스, 보안 취약점, 성능 병목 구간 식별
3. **Alternative Suggestion**: 더 나은 대안이 있다면 주저 없이 제안

### ✅ Pre-Development Checklist (Condensed)

작업 시작 전 다음 항목을 빠르게 스캔하세요:

1. **Context**: 목표와 제약사항을 정확히 이해했는가?
2. **Duplication**: 이미 존재하는 기능인가?
3. **Impact**: 이 변경이 다른 모듈에 미칠 영향은?
4. **Simplicity**: 더 단순한 해결책은 없는가?

### Claude Code (Primary Lead)

- 메인 개발 흐름 주도
- 복잡한 비즈니스 로직 구현
- 전체 프로젝트 컨텍스트 관리

### Gemini CLI (Universal Partner)

- **전방위 지원**: 구현, 설계, 검증 모든 단계 참여
- **Cross-Check**: Claude의 코드에 대한 객관적 검증 및 대안 제시
- **Speed**: 빠른 응답 속도로 즉각적인 피드백 제공

### Codex CLI (Implementation Specialist)

- **실무 구현**: 구체적인 코드 작성 및 보일러플레이트 생성
- **정밀 타격**: 특정 모듈이나 함수의 디테일한 구현 담당

### Qwen CLI (Performance Engineer)

- **최적화**: 알고리즘 효율성 및 리소스 사용량 분석
- **벤치마크**: 성능 지표 측정 및 개선안 도출

---

## 📊 현재 프로젝트 상태

### 기술 환경

- Node.js v22.18.0
- TypeScript strict mode
- ESLint + Prettier

### AI 시스템

- UnifiedAIEngineRouter
- Google AI + Supabase RAG + Korean NLP

### 성능

- Vercel 사용량 90% 절감
- Edge Runtime 최적화

### 개발 도구

- Husky v10 호환
- CLI 도구 안정화
- TDD 환경 (98.2% 커버리지)

---

## 🚦 사용 가이드라인

### DO ✅

- **자유로운 요청**: 아키텍처뿐만 아니라 구현, 디버깅 등 모든 요청 가능
- **교차 검증**: 다른 AI 도구의 결과물을 Gemini로 재확인
- **적극적 활용**: WSL 환경에서 언제든 가볍게 호출

### DON'T ❌

- 일일 한도 1,000 RPD 초과
- 맹목적 신뢰 (항상 실행 및 테스트로 검증 필요)

---

**🏗️ Universal AI Partner**
**🚀 Multi-Agent Collaborator**
**💰 OAuth 무료 티어**

_Last Updated: 2025-11-22_
