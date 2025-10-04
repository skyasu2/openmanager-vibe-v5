# GEMINI.md

> **작성일**: 2025년 6월 1일 | **최종 수정일**: 2025년 10월 4일

Gemini CLI 사용 가이드 및 Claude Code Sub Agent 협업 방법

> **🔄 2025년 10월 업데이트**: Gemini CLI가 `@google/gemini-cli` v0.7.0으로 업데이트되었습니다. 이에 따라 설치 방법 및 명령어 사용법이 변경되었습니다.

> **🔄 2025년 9월 업데이트**: Gemini CLI는 Claude Code의 **gemini-specialist** 서브에이전트로 통합되어 아키텍처 설계, UI/UX 개선, 그리고 직접 구현까지 담당합니다.

## 🎯 핵심 원칙

### 📊 2025 벤치마크 성능 (Gemini 2.5 Flash v0.7.0)
- **SWE-bench Verified**: 54% (48.9% → 54% 5% 개선)
- **테스트 커버리지**: 98.2% (54/55 통과) - 프로젝트 실적
- **문제 발견율**: 95%+ (3-AI 교차검증 시스템)
- **Aider Polyglot**: 향상된 코딩 벤치마크
- **SOLID 원칙**: 대규모 리팩토링 전문

### 1. 효율성 최우선

- **토큰 절약**: 단순하고 명확한 요청으로 사용량 최적화
- **일일 한도 관리**: 1,000회 제한 내에서 최대 가치 창출
- **적시 적소**: Claude와 역할 분담으로 생산성 극대화

### 2. 아키텍처 설계 & 직접 구현자

- **SOLID 원칙 적용**: 대규모 파일 구조 개선 및 직접 리팩토링
- **타입 안전성 구현**: any 타입 제거 및 실제 타입 정의 작성
- **중복 코드 해결**: 기존 코드 분석 후 재사용 가능한 모듈로 직접 추출

### 3. TDD 워크플로우 실행자

- **Red 단계**: 실패하는 테스트 케이스 직접 작성
- **Green 단계**: 최소 구현 코드 직접 작성 및 적용
- **Refactor 단계**: 코드 품질 개선을 실제 파일에 직접 적용

## 효율적인 사용 전략

### 💊 CLI 사용 가이드 (WSL 환경)

Claude Code 서브에이전트로 동작할 때의 표준 명령어 형식은 `echo`와 파이프(`|`)를 사용합니다. 이는 프로그램 간 입력을 안정적으로 전달하기 위한 가장 안정적인 방법입니다.

```bash
# 📖 표준 사용법 (2025-10-04 업데이트)
# 1. 프롬프트를 echo로 전달하여 gemini CLI의 표준 입력으로 제공
echo "Show usage stats" | gemini Current usage

# 2. 파일 내용을 파이프로 전달하여 분석
cat 파일명.js | gemini 핵심만 요약

# 3. 다른 명령어 결과물을 파이프로 전달
git diff | gemini 변경사항 리뷰
```

> **⚠️ 중요**: 인터랙티브 모드(`gemini`)는 WSL 환경에서 타임아웃 이슈가 발생할 수 있어 권장하지 않습니다.

> **💡 Tip**: `gemini --help`를 통해 확인한 결과, `-p` 플래그는 더 이상 사용되지 않으며(deprecated) 프롬프트는 명령어 뒤에 직접 위치시키는 것이 권장됩니다. `gemini --version` 이나 `node -v` 같은 명령어로 현재 설치된 도구들의 버전을 확인할 수 있습니다. 문서의 버전 정보가 실제와 다를 수 있으니, 주기적으로 확인하는 것이 좋습니다.

#### 일일 워크플로우 예시

```bash
# 아침 (사용량 0%)
echo "Show my usage" | gemini Usage stats  # 사용량 확인 대체

# 개발 중 (사용량 ~50%)
git diff | gemini 변경사항 리뷰  # 간단한 리뷰
echo "버그 분석 요청" | gemini 원인 분석  # 로그 분석

# 오후 (사용량 ~80%)
echo "Remaining quota check" | gemini Check limit  # 남은 사용량 확인
```

#### 백업 전략

```bash
# 중요 대화 내용 저장 (프롬프트 모드 활용)
echo "Summarize our conversation" | gemini Key points > gemini_session_$(date +%Y%m%d).txt

# 컨텍스트 정리
echo "Clear context" | gemini Reset  # 새 세션 시작
```

## 🏗️ 아키텍처 설계 & 직접 구현 역할 (2025-09-16 업데이트)

### 🔄 **공식 서브에이전트 호출 방식** - 14개 서브에이전트 체계

**Gemini는 두 가지 방식으로 활용 가능합니다:**

#### **1. 명시적 서브에이전트 호출** (직접 구현 작업)
```
# 아키텍처 설계 및 실제 구현
"gemini-specialist 서브에이전트를 사용하여 컴포넌트 구조를 개선하고 실제 파일에 적용해주세요"
"gemini-specialist 서브에이전트를 사용하여 UI/UX를 설계하고 shadcn/ui로 직접 구현해주세요"
"gemini-specialist 서브에이전트를 사용하여 API 아키텍처를 설계하고 실제 엔드포인트를 생성해주세요"
```

#### **2. 직접 CLI 방식** (빠른 분석 및 파이프라인 연동)

Claude Code 서브에이전트가 아닌, 터미널에서 직접 사용하거나 쉘 스크립트 파이프라인에 연동할 때 사용합니다.

```bash
# 표준 방식: echo와 파이프라인을 통해 입력을 전달
# 이는 Claude Code와 같은 다른 에이전트와의 연동성을 보장하는 안정적인 방법입니다.
echo "이 컴포넌트 구조를 Material Design 3로 개선하는 방법 제안" | gemini Analyze and suggest

# 파일 내용 분석
cat src/components/MyComponent.tsx | gemini SOLID 원칙에 따라 리팩토링 코드 생성
```

### 현재 개발 환경

- **OS**: WSL 2 (Ubuntu 24.04.3 LTS)
- **터미널**: WSL 터미널 (bash)
- **서브에이전트**: 14개 체계 (Claude Code 공식 지원)
- **Gemini CLI**: v0.7.0 (`@google/gemini-cli`)
- **설치/업데이트**: `npm install -g @google/gemini-cli@latest`

### Gemini 역할 및 책임

- **메인 개발 도구**: Claude Code가 주도적으로 작업
- **Gemini CLI 역할**: **gemini-specialist** 서브에이전트 + 직접 CLI
- **협업 방식**: 시스템 아키텍처 분석 및 구조적 개선사항 제안 전담

### Senior Code Architect가 전문적으로 담당하는 업무

- 레거시 코드 분석 및 리팩토링 전략 수립
- SOLID 원칙 기반 아키텍처 검증
- TypeScript 타입 안전성 및 최적화
- 기술 부채 식별 및 단계별 개선 로드맵
- 대규모 파일 구조 개선 제안
- 성능 최적화 및 메모리 사용량 분석

### 활용 방법

```
# 자동 위임
"이 코드의 아키텍처 문제점을 분석해줘"

# 명시적 요청
"gemini-specialist 서브에이전트를 사용해서 기술 부채를 분석하고 실제 개선해줘"
```

## 현재 프로젝트 상태

### 기술 환경

- ✅ **Node.js v22.18.0** 업그레이드 완료
- ✅ **TypeScript strict mode** 활성화
- ✅ **ESLint + Prettier** 코드 품질 관리

### AI 시스템

- ✅ **다중 AI 엔진 통합** 완료
- ✅ **UnifiedAIEngineRouter** 중앙 제어
- ✅ **Google AI, Supabase RAG, Korean NLP** 통합

### 성능 최적화

- ✅ **Vercel 사용량 90% 절감** 달성
- ✅ **Edge Runtime** 최적화
- 🔄 **성능 모니터링** 고도화 진행 중

### 개발 도구

- ✅ **Husky Git Hooks v10** 호환성 해결
- ✅ **CLI 도구** 안정성 개선 (ccusage v16.2.0 최신 버전)
- ✅ **TDD 테스트 환경** 구축 (54/55 테스트 통과, 98.2% 커버리지)

### AI 교차 검증 v4.1 (2025-09-18 업데이트)

- ✅ **14개 서브에이전트 최적화** - SDD 서브에이전트 3개 통합 완료
- ✅ **혼합 사용 전략** - Task 서브에이전트 + 직접 CLI 모두 정상 작동
- ✅ **Claude 주도 방식** - Claude A안 → 외부 AI 개선점 제시 → Claude 최종 판단
- ✅ **3-AI 병렬 검증** - Gemini + Codex + Qwen 독립적 교차 검증
- ✅ **교차 발견 시스템** - 각 AI가 놓친 문제를 다른 AI가 발견 (95%+ 문제 발견율)

## 📚 실전 협업 워크플로우

### 1. 코드 리뷰 협업

```bash
# Claude가 작성한 새 기능을 Gemini가 검토
cat src/services/new-feature.ts | gemini SOLID 원칙 위반 여부와 개선점 3가지

# 복잡한 로직에 대한 두 번째 의견
echo "재귀 함수의 성능 문제 해결 방법" | gemini 메모이제이션 적용 예시

# 타입 안전성 검증
git diff HEAD^ | gemini TypeScript 타입 누락이나 any 사용 확인
```

### 2. 아키텍처 결정 협업

```bash
# 설계 결정 시 두 AI의 의견 수렴
echo "마이크로서비스 vs 모놀리스 선택 기준" | gemini 프로젝트 규모별 장단점 3개씩

# 기술 스택 선택
echo "Redis vs PostgreSQL 캐싱 전략" | gemini 무료 티어 기준 추천

# 성능 최적화 전략
cat performance-report.json | gemini 병목 지점 분석과 해결 우선순위
```

### 3. 버그 해결 협업

```bash
# 에러 로그 분석
tail -n 100 error.log | gemini 에러 패턴과 근본 원인 분석

# 스택 트레이스 해석
cat stack-trace.txt | gemini 메모리 누수 가능성 확인

# 해결 방안 검증
echo "useEffect 무한 루프 문제" | gemini 의존성 배열 수정 방법
```

### 4. 문서화 협업

```bash
# API 문서 생성
cat src/api/routes.ts | gemini OpenAPI 스펙 생성

# README 개선
echo "프로젝트 소개 문구 개선" | gemini 엔터프라이즈 고객 대상 3줄 요약

# 변경 로그 작성
git log --oneline -10 | gemini 사용자 친화적 변경사항 요약
```

### 5. 테스트 전략 협업

```bash
# 테스트 케이스 생성
cat src/utils/validator.ts | gemini 엣지 케이스 포함 테스트 시나리오 5개

# 테스트 커버리지 분석
cat coverage/lcov.info | gemini 테스트 부족 영역 우선순위

# E2E 시나리오 검토
echo "결제 프로세스 E2E 테스트" | gemini 중요 검증 포인트 목록
```

## 💡 컨텍스트 관리 자동화 (구 '메모리 저장 권장사항')

Gemini CLI는 현재 상태 저장(stateful) 메모리 기능을 지원하지 않으므로, 모든 요청에 핵심 컨텍스트를 함께 제공해야 합니다. 특히 Claude Code의 서브에이전트로 동작할 때 이는 중요합니다.

이러한 반복 작업을 줄이기 위해, 주요 컨텍스트를 포함하는 래퍼 스크립트(예: `gcli.sh`)를 사용하는 것을 권장합니다.

**래퍼 스크립트 예시 (`scripts/gcli.sh`):**
```bash
#!/bin/bash
#
# Gemini CLI 컨텍스트 래퍼 스크립트
# 사용법: ./scripts/gcli.sh "분석해줘"

# 1. 핵심 컨텍스트 정의
CONTEXT="
- Project: OpenManager VIBE v5 (AI 서버 모니터링 플랫폼)
- Tech Stack: Next.js 15, TypeScript strict mode, Node.js v22.x
- Environment: Vercel (Edge Runtime 최적화)
- Key Rules: SOLID, No 'any' type, TDD, Reuse existing code
- Core Feature: UnifiedAIEngineRouter (다중 AI 엔진 통합)
"

# 2. 사용자 입력을 컨텍스트와 결합하여 Gemini CLI에 전달
echo "$CONTEXT
---
User Request: $1" | gemini Process the following request
```

> **사용법**: 위 스크립트를 생성하고 실행 권한을 부여(`chmod +x scripts/gcli.sh`)한 뒤, Claude Code 에이전트가 `gemini` 대신 `./scripts/gcli.sh`를 호출하도록 설정할 수 있습니다.

---

💡 **참고**: 프로젝트 전체 정보는 `CLAUDE.md` 파일을 참조하세요.