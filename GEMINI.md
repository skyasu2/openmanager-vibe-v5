# GEMINI.md

> **최종 수정일**: 2025년 10월 8일
> **질의 답변시 한국어 우선 기술언어**: 영어 사용 가능

Gemini CLI 사용 가이드 - Senior Code Architect 서브에이전트

---

## 🎯 핵심 원칙

### 📊 2025 벤치마크 (Gemini 2.5 Flash v0.8.1)

- **SWE-bench Verified**: 54% (48.9% → 54% 5% 개선)
- **테스트 커버리지**: 98.2% (54/55 통과) - 프로젝트 실적
- **문제 발견율**: 95%+ (3-AI 교차검증)
- **SOLID 원칙**: 대규모 리팩토링 전문

### 역할: 아키텍처 설계 & 직접 구현자

- **SOLID 원칙**: 대규모 구조 개선 및 직접 리팩토링
- **타입 안전성**: any 타입 제거, 실제 타입 정의 작성
- **TDD 워크플로우**: Red-Green-Refactor 직접 실행
- **중복 제거**: 재사용 모듈 직접 추출 및 적용

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

## 🏗️ Senior Code Architect 역할

### 전문 담당 영역

- **레거시 코드**: 분석 및 리팩토링 전략 수립
- **SOLID 원칙**: 아키텍처 검증 및 적용
- **타입 안전성**: TypeScript strict mode 최적화
- **기술 부채**: 식별 및 단계별 개선 로드맵
- **대규모 구조**: 파일/모듈 구조 개선
- **성능 최적화**: 메모리 및 실행 시간 분석

### 활용 예시

```bash
# 자동 위임 (Claude가 자동 판단)
"이 코드의 아키텍처 문제점 분석"

# 명시적 요청 (직접 지정)
"gemini-specialist로 기술 부채를 분석하고 실제 개선해줘"
```

---

## 📚 실전 협업 워크플로우

### 코드 리뷰

```bash
# Claude가 작성한 기능 검토
cat src/services/new-feature.ts | gemini SOLID 원칙 위반 여부와 개선점 3가지

# 타입 안전성 검증
git diff HEAD^ | gemini TypeScript any 사용 확인
```

### 아키텍처 결정

```bash
# 설계 결정 시 의견
echo "마이크로서비스 vs 모놀리스" | gemini 프로젝트 규모별 장단점

# 기술 스택 선택
echo "Redis vs PostgreSQL 캐싱" | gemini 무료 티어 기준 추천
```

### 버그 해결

```bash
# 에러 로그 분석
tail -n 100 error.log | gemini 에러 패턴과 근본 원인

# 스택 트레이스 해석
cat stack-trace.txt | gemini 메모리 누수 가능성 확인
```

### 테스트 전략

```bash
# 테스트 케이스 생성
cat src/utils/validator.ts | gemini 엣지 케이스 테스트 시나리오 5개

# 커버리지 분석
cat coverage/lcov.info | gemini 테스트 부족 영역 우선순위
```

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

## 🤝 AI 협업 체계

### Claude Code (메인 개발자)

- 전체 아키텍처 설계
- 핵심 비즈니스 로직
- 최종 의사결정

### Gemini CLI (Architect)

- 시스템 아키텍처 분석
- SOLID 원칙 검증
- 직접 구현 및 리팩토링

### Qwen CLI (Performance Engineer)

- 알고리즘 최적화
- 성능 병목점 분석

### Codex CLI (Implementation Specialist)

- 버그 수정
- 실무적 구현

---

## 🎯 3-AI 교차 검증 (v4.1)

### 협업 방식

- ✅ **혼합 전략**: Task 서브에이전트 + 직접 CLI
- ✅ **Claude 주도**: Claude A안 → 외부 AI 개선점 → Claude 최종 판단
- ✅ **독립 검증**: 각 AI가 독립적으로 분석 후 교차 발견
- ✅ **95%+ 발견율**: 각 AI가 놓친 문제를 다른 AI가 발견

### Gemini 역할

- **아키텍처 관점**: SOLID 원칙, 구조적 개선
- **타입 안전성**: any 타입 제거, 엄격한 타입 검증
- **문제 발견**: 설계 결함, 기술 부채 식별

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

- 아키텍처 설계 및 검증
- SOLID 원칙 적용
- any 타입 제거
- TDD 워크플로우 실행
- 대규모 리팩토링

### DON'T ❌

- 일일 한도 1,000 RPD 초과
- 단순 구현은 Claude/Codex에 위임
- 성능 최적화는 Qwen에 위임

---

**🏗️ Senior Code Architect**
**🚀 SOLID 원칙 전문가**
**💰 OAuth 무료 티어**

_Last Updated: 2025-10-06_
