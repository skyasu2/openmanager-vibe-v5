# GEMINI.md

> **작성일**: 2025년 6월 1일 | **최종 수정일**: 2025년 9월 18일

Gemini CLI 사용 가이드 및 Claude Code Sub Agent 협업 방법

> **🔄 2025년 9월 업데이트**: Gemini CLI는 Claude Code의 **gemini-specialist** 서브에이전트로 통합되어 아키텍처 설계, UI/UX 개선, 그리고 직접 구현까지 담당합니다.

## 🎯 핵심 원칙

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

### 💊 사용량 관리

#### 일일 제한 (Google 계정 OAuth 인증 시)

- **무료 제한**: 1,000회/일, 60회/분 (2025년 8월 현재)
- **리셋 시간**: 태평양 표준시(PST) 자정 = 한국 시간 오후 4-5시경
- **인증 방법**: Google 계정 OAuth 로그인 (이메일 인증)
- **Code Assist**: Google의 무료 Code Assist 라이선스 (미리보기 단계)

#### 사용량 명령어 (WSL 환경)

```bash
# WSL 환경에서 직접 실행 (2025-09-18 업데이트)
# 주의: Gemini CLI는 프롬프트 기반으로 동작, 슬래시 명령어는 인터랙티브 모드에서만 작동
echo "Show usage stats" | gemini -p "Current usage"  # 사용량 확인 대체
echo "Compress conversation" | gemini -p "Summarize"  # 대화 압축 대체
# 인터랙티브 모드 진입 후 사용 가능한 명령어
gemini  # 인터랙티브 모드 진입
# /stats, /compress, /clear, /memory 등 사용 가능
```

> **⚠️ 중요**: Gemini CLI v0.5.3는 `-p` 플래그로 프롬프트 모드 실행 권장. 인터랙티브 모드는 타임아웃 이슈 가능성 있음.

#### 사용량 임계값 가이드

- **0-50%**: 자유롭게 사용
- **50-80%**: 중요한 작업 위주
- **80-100%**: 복잡한 작업은 Claude Code에게 요청

### 🎯 토큰 절약 전략

#### 효율적 사용 패턴

```bash
# ❌ 비효율적 (타임아웃 위험)
gemini  # 인터랙티브 모드 - WSL에서 타임아웃 가능

# ✅ 효율적 (안정적 실행)
echo "질문" | gemini -p "3줄로 답변"  # 프롬프트 모드 권장
cat 파일명.js | gemini -p "핵심만 요약"  # 파일 분석에 최적
```

#### 일일 워크플로우 예시

```bash
# 아침 (사용량 0%)
echo "Show my usage" | gemini -p "Usage stats"  # 사용량 확인 대체

# 개발 중 (사용량 ~50%)
git diff | gemini -p "변경사항 리뷰"  # 간단한 리뷰
echo "버그 분석 요청" | gemini -p "원인 분석"  # 로그 분석

# 오후 (사용량 ~80%)
echo "Remaining quota check" | gemini -p "Check limit"  # 남은 사용량 확인
```

#### 백업 전략

```bash
# 중요 대화 내용 저장 (프롬프트 모드 활용)
echo "Summarize our conversation" | gemini -p "Key points" > gemini_session_$(date +%Y%m%d).txt

# 컨텍스트 정리
echo "Clear context" | gemini -p "Reset"  # 새 세션 시작
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

#### **2. 직접 CLI 방식** (빠른 분석)
```bash
# 구조 분석이나 간단한 제안
gemini "이 컴포넌트 구조를 Material Design 3로 개선 방법"
gemini "SOLID 원칙 적용해서 실제 리팩토링 코드 생성"
```

### 현재 개발 환경

- **OS**: WSL 2 (Ubuntu 24.04.3 LTS)
- **터미널**: WSL 터미널 (bash)
- **서브에이전트**: 14개 체계 (Claude Code 공식 지원)
- **Gemini CLI**: v0.5.3 (npm 전역 설치)

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
cat src/services/new-feature.ts | gemini -p "SOLID 원칙 위반 여부와 개선점 3가지"

# 복잡한 로직에 대한 두 번째 의견
echo "재귀 함수의 성능 문제 해결 방법" | gemini -p "메모이제이션 적용 예시"

# 타입 안전성 검증
git diff HEAD^ | gemini -p "TypeScript 타입 누락이나 any 사용 확인"
```

### 2. 아키텍처 결정 협업

```bash
# 설계 결정 시 두 AI의 의견 수렴
echo "마이크로서비스 vs 모놀리스 선택 기준" | gemini -p "프로젝트 규모별 장단점 3개씩"

# 기술 스택 선택
echo "Redis vs PostgreSQL 캐싱 전략" | gemini -p "무료 티어 기준 추천"

# 성능 최적화 전략
cat performance-report.json | gemini -p "병목 지점 분석과 해결 우선순위"
```

### 3. 버그 해결 협업

```bash
# 에러 로그 분석
tail -n 100 error.log | gemini -p "에러 패턴과 근본 원인 분석"

# 스택 트레이스 해석
cat stack-trace.txt | gemini -p "메모리 누수 가능성 확인"

# 해결 방안 검증
echo "useEffect 무한 루프 문제" | gemini -p "의존성 배열 수정 방법"
```

### 4. 문서화 협업

```bash
# API 문서 생성
cat src/api/routes.ts | gemini -p "OpenAPI 스펙 생성"

# README 개선
echo "프로젝트 소개 문구 개선" | gemini -p "엔터프라이즈 고객 대상 3줄 요약"

# 변경 로그 작성
git log --oneline -10 | gemini -p "사용자 친화적 변경사항 요약"
```

### 5. 테스트 전략 협업

```bash
# 테스트 케이스 생성
cat src/utils/validator.ts | gemini -p "엣지 케이스 포함 테스트 시나리오 5개"

# 테스트 커버리지 분석
cat coverage/lcov.info | gemini -p "테스트 부족 영역 우선순위"

# E2E 시나리오 검토
echo "결제 프로세스 E2E 테스트" | gemini -p "중요 검증 포인트 목록"
```

## 메모리 저장 권장사항

### 프로젝트 기본 정보

```bash
# 메모리 기능은 현재 버전에서 미지원
# 대신 프로젝트 컨텍스트를 프롬프트에 포함
echo "Project: OpenManager VIBE v5" | gemini -p "OpenManager VIBE v5 - AI 서버 모니터링 플랫폼"
# 메모리 기능은 현재 버전에서 미지원
# 대신 프로젝트 컨텍스트를 프롬프트에 포함
echo "Project: OpenManager VIBE v5" | gemini -p "Next.js 15, TypeScript strict mode, Node.js v22.15.1"
# 메모리 기능은 현재 버전에서 미지원
# 대신 프로젝트 컨텍스트를 프롬프트에 포함
echo "Project: OpenManager VIBE v5" | gemini -p "Vercel 무료 티어 최적화, Edge Runtime 사용"
```

### 개발 규칙

```bash
# 메모리 기능은 현재 버전에서 미지원
# 대신 프로젝트 컨텍스트를 프롬프트에 포함
echo "Project: OpenManager VIBE v5" | gemini -p "SOLID 원칙 준수, 1500줄 초과 시 파일 분리"
# 메모리 기능은 현재 버전에서 미지원
# 대신 프로젝트 컨텍스트를 프롬프트에 포함
echo "Project: OpenManager VIBE v5" | gemini -p "any 타입 사용 금지, 타입 안전성 필수"
# 메모리 기능은 현재 버전에서 미지원
# 대신 프로젝트 컨텍스트를 프롬프트에 포함
echo "Project: OpenManager VIBE v5" | gemini -p "기존 코드 우선 재사용, 중복 코드 방지"
# 메모리 기능은 현재 버전에서 미지원
# 대신 프로젝트 컨텍스트를 프롬프트에 포함
echo "Project: OpenManager VIBE v5" | gemini -p "TDD 접근: Red-Green-Refactor 사이클"
```

### 주요 기능

```bash
# 메모리 기능은 현재 버전에서 미지원
# 대신 프로젝트 컨텍스트를 프롬프트에 포함
echo "Project: OpenManager VIBE v5" | gemini -p "UnifiedAIEngineRouter: 다중 AI 엔진 통합 시스템"
# 메모리 기능은 현재 버전에서 미지원
# 대신 프로젝트 컨텍스트를 프롬프트에 포함
echo "Project: OpenManager VIBE v5" | gemini -p "Supabase Auth: GitHub OAuth 인증"
# 메모리 기능은 현재 버전에서 미지원
# 대신 프로젝트 컨텍스트를 프롬프트에 포함
echo "Project: OpenManager VIBE v5" | gemini -p "실시간 서버 모니터링 및 AI 분석"
```

---

💡 **참고**: 프로젝트 전체 정보는 `CLAUDE.md` 파일을 참조하세요.
