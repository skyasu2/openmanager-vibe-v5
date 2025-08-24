# 🤖 수동 AI 교차 검증 가이드

**AI 교차 검증 시스템을 수동으로 요청하여 활용하는 완전한 가이드**

## 📋 개요

AI 교차 검증 시스템이 수동 모드로 개선되어, 필요에 따라 다양한 AI 전문가들을 선택적으로 활용할 수 있습니다.

### 🎯 주요 AI 에이전트

| 에이전트 | 전문 분야 | 사용 시나리오 |
|----------|-----------|---------------|
| **verification-specialist** | 코드 분석, 검증 진입점 | 일반적인 코드 분석 및 검토 |
| **ai-verification-coordinator** | 3단계 레벨 조정자 | 체계적인 교차 검증 (Level 1-3) |
| **external-ai-orchestrator** | 외부 AI 통합 관리 | 복수 AI 병렬 실행 |
| **gemini-wrapper** | 종합 코드 검토 | Google Gemini 활용 (무료 1K/day) |
| **codex-wrapper** | 실무 경험, 버그 탐지 | ChatGPT Codex 활용 (유료) |
| **qwen-wrapper** | 알고리즘, 성능 최적화 | Qwen AI 활용 (무료 2K/day) |

## 🔍 사용 시나리오별 명령어

### 1. 자료 조사 (Research)

#### 기술 스택 조사
```bash
# 특정 기술에 대한 조사
Task verification-specialist "React 18 Server Components 최신 패턴 조사"
Task gemini-wrapper "Next.js 15 새로운 기능과 변경사항 분석"
Task qwen-wrapper "TypeScript 5.0 성능 최적화 기법 조사"
```

#### 라이브러리 분석
```bash
# 라이브러리 비교 분석
Task external-ai-orchestrator "Zustand vs Redux Toolkit 비교 분석"
Task gemini-wrapper "React Query vs SWR 장단점 분석"
```

#### 아키텍처 패턴 연구
```bash
# 설계 패턴 조사
Task verification-specialist "마이크로프론트엔드 아키텍처 패턴 조사"
Task codex-wrapper "서버리스 아키텍처 모범 사례 분석"
```

### 2. 코드 리뷰 (Code Review)

#### 단일 파일 리뷰
```bash
# 간단한 리뷰 (Level 1)
Task verification-specialist "src/components/Button.tsx quick review"

# 표준 리뷰 (Level 2) 
Task ai-verification-coordinator "src/hooks/useAuth.ts standard review"

# 전체 리뷰 (Level 3)
Task ai-verification-coordinator "src/app/api/auth/route.ts full review"
```

#### 컴포넌트별 전문 리뷰
```bash
# React 컴포넌트 리뷰
Task gemini-wrapper "src/components/Dashboard/ 컴포넌트 구조 분석"

# API 엔드포인트 리뷰
Task codex-wrapper "src/app/api/ 보안 및 에러 처리 검토"

# 성능 최적화 리뷰
Task qwen-wrapper "src/services/ 알고리즘 효율성 검토"
```

#### PR 전체 리뷰
```bash
# 전체 변경사항 검토
Task external-ai-orchestrator "PR #123 전체 변경사항 교차 검증"
Task ai-verification-coordinator "branch feature/auth-system Level 3 검증"
```

### 3. 개선 방법 제안 (Improvement)

#### 성능 최적화
```bash
# 성능 병목점 분석
Task qwen-wrapper "src/app/main/page.tsx 성능 최적화 방법 제안"
Task verification-specialist "렌더링 성능 개선 전략 수립"
```

#### 코드 품질 개선
```bash
# 타입 안전성 강화
Task codex-wrapper "TypeScript strict 모드 적용 전략"
Task gemini-wrapper "코드 품질 메트릭 개선 방안"
```

#### 아키텍처 개선
```bash
# 구조적 개선
Task external-ai-orchestrator "모듈화 및 의존성 관리 개선 방안"
Task ai-verification-coordinator "전체 프로젝트 구조 리팩토링 계획"
```

### 4. 특수 검증 (Special Verification)

#### 보안 검토
```bash
# 보안 취약점 분석
Task codex-wrapper "인증/인가 시스템 보안 검토"
Task verification-specialist "API 엔드포인트 보안 검증"
```

#### 호환성 검증
```bash
# 브라우저 호환성
Task gemini-wrapper "크로스 브라우저 호환성 검증"
Task external-ai-orchestrator "모바일 반응형 디자인 검증"
```

#### 테스트 전략
```bash
# 테스트 커버리지 분석
Task verification-specialist "테스트 전략 수립 및 커버리지 분석"
Task codex-wrapper "E2E 테스트 시나리오 설계"
```

## 🎖️ 검증 레벨 가이드

### Level 1: 빠른 검토
- **대상**: < 50줄 변경, 단순 수정
- **시간**: 1-2분
- **명령어**: `Task verification-specialist "[대상] quick"`

### Level 2: 표준 검토
- **대상**: 50-200줄 변경, 일반적인 기능
- **시간**: 3-5분
- **명령어**: `Task ai-verification-coordinator "[대상] standard"`

### Level 3: 전체 검토
- **대상**: >200줄 변경, 중요한 시스템
- **시간**: 5-10분
- **명령어**: `Task ai-verification-coordinator "[대상] full"`

## 💡 활용 팁

### 효율적인 AI 선택
```bash
# 무료 AI 우선 활용 (Gemini, Qwen)
Task gemini-wrapper "기본 코드 검토"  # 1K/day 무료
Task qwen-wrapper "성능 분석"         # 2K/day 무료

# 복잡한 문제는 유료 AI 활용
Task codex-wrapper "복잡한 버그 분석"  # ChatGPT Plus 필요
```

### 병렬 분석 패턴
```bash
# 동시에 여러 관점 분석
Task external-ai-orchestrator "
다음 3가지 관점으로 병렬 분석:
1. Gemini: 아키텍처 검토
2. Codex: 실무 이슈 탐지  
3. Qwen: 성능 최적화
"
```

### 점진적 검증
```bash
# 1단계: 빠른 검토
Task verification-specialist "src/app/login/page.tsx quick"

# 2단계: 발견된 이슈에 대해 심화 분석
Task codex-wrapper "로그인 보안 이슈 상세 분석"

# 3단계: 최종 검증
Task ai-verification-coordinator "로그인 시스템 전체 검증 Level 3"
```

## 🛠️ 고급 활용법

### 맞춤형 분석 요청
```bash
# 구체적인 요구사항 명시
Task verification-specialist "
src/components/Chart.tsx를 분석하여:
1. 성능 병목점 찾기
2. 메모리 누수 가능성 검토
3. 접근성 개선점 제안
4. 타입 안전성 강화 방안
"
```

### 연속 작업 패턴
```bash
# 1단계: 문제 식별
Task gemini-wrapper "현재 인증 시스템의 문제점 분석"

# 2단계: 해결책 도출
Task codex-wrapper "인증 시스템 개선 방안 구체적 제시"

# 3단계: 구현 검증
Task qwen-wrapper "제안된 해결책의 성능 영향 분석"

# 4단계: 최종 검토
Task ai-verification-coordinator "인증 시스템 개선 계획 전체 검증"
```

## 📊 비용 효율성

### 무료 티어 활용 전략
```bash
# Gemini (1K/day) - 일반적인 검토
Task gemini-wrapper "기본 코드 품질 검토"

# Qwen (2K/day) - 성능 분석
Task qwen-wrapper "알고리즘 최적화 분석"

# Codex (유료) - 복잡한 이슈만
Task codex-wrapper "해결 어려운 버그 심층 분석"
```

### 검증 빈도 최적화
- **매일**: 기본적인 코드 품질 검토 (Gemini)
- **주간**: 성능 분석 및 최적화 (Qwen)  
- **월간**: 전체 시스템 검토 (Codex + 전체 교차 검증)

## 🚀 빠른 시작

```bash
# 1. 간단한 파일 검토
Task verification-specialist "src/utils/helpers.ts 검토해줘"

# 2. 특정 이슈 분석
Task gemini-wrapper "React hooks 사용 패턴 분석해줘"

# 3. 전체 교차 검증
Task ai-verification-coordinator "중요한 변경사항 Level 3 검증"
```

이 가이드를 따라 필요에 맞는 AI 전문가를 선택적으로 활용하여 효율적인 코드 품질 관리를 수행할 수 있습니다.