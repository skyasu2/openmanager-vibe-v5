# GEMINI.md

> **작성일**: 2025년 6월 1일 | **최종 수정일**: 2025년 8월 5일

Gemini CLI 사용 가이드 및 Claude Code Sub Agent 협업 방법

> **🔄 2025년 7월 업데이트**: Gemini CLI는 Claude Code의 **👨‍💻 Senior Code Architect** Sub Agent로 통합되어 아키텍처 리뷰와 코드 품질 검토를 담당합니다.

## 🎯 핵심 원칙

### 1. 효율성 최우선

- **토큰 절약**: 단순하고 명확한 요청으로 사용량 최적화
- **일일 한도 관리**: 1,000회 제한 내에서 최대 가치 창출
- **적시 적소**: Claude와 역할 분담으로 생산성 극대화

### 2. 코드 품질 수호자

- **SOLID 원칙 검토**: 대규모 파일과 부적절한 구조 감지
- **타입 안전성 강화**: any 타입 사용 지적 및 개선 제안
- **중복 코드 방지**: 기존 코드 검색으로 재사용성 향상

### 3. TDD 워크플로우 파트너

- **Red 단계**: 문제 분석 및 원인 파악
- **Green 단계**: 최소 구현 가이드
- **Refactor 단계**: 품질 개선 제안

## 효율적인 사용 전략

### 💊 사용량 관리

#### 일일 제한 (Google 계정 OAuth 인증 시)

- **무료 제한**: 1,000회/일, 60회/분 
- **리셋 시간**: 태평양 표준시(PST) 자정 = 한국 시간 오후 4-5시경
- **인증 방법**: Google 계정 OAuth 로그인 (이메일 인증)

#### 사용량 명령어

```bash
gemini /stats      # 사용량 확인
gemini /compress   # 대화 압축 (토큰 절약)
gemini /clear      # 컨텍스트 초기화
gemini /memory list # 저장된 메모리 확인
```

#### 사용량 임계값 가이드

- **0-50%**: 자유롭게 사용
- **50-80%**: 중요한 작업 위주
- **80-100%**: 복잡한 작업은 Claude Code에게 요청

### 🎯 토큰 절약 전략

#### 효율적 사용 패턴

```bash
# ❌ 비효율적 (토큰 낭비)
gemini  # 장시간 대화형 모드

# ✅ 효율적 (토큰 절약)
echo "질문" | gemini -p "3줄로 답변"
cat 파일명.js | gemini -p "핵심만 요약"
```

#### 일일 워크플로우 예시

```bash
# 아침 (사용량 0%)
gemini /stats  # 사용량 확인
gemini /memory list  # 컨텍스트 확인

# 개발 중 (사용량 ~50%)
git diff | gemini -p "변경사항 리뷰"  # 간단한 리뷰
echo "버그 분석 요청" | gemini -p "원인 분석"  # 로그 분석

# 오후 (사용량 ~80%)
gemini /stats  # 남은 사용량 확인
gemini /compress  # 대화 압축으로 토큰 절약
```

#### 백업 전략

```bash
# 중요 대화 내용 저장
gemini /export > gemini_session_$(date +%Y%m%d).txt

# 메모리 백업
gemini /memory list > project_memory.txt
```

## 👨‍💻 Senior Code Architect Sub Agent 역할

### 현재 개발 환경

- **메인 개발 도구**: Claude Code가 주도적으로 작업
- **Gemini CLI 역할**: **Senior Code Architect** sub agent로 통합
- **협업 방식**: 아키텍처 리뷰 및 코드 품질 검토 전담

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
"Senior Code Architect를 사용해서 기술 부채 분석해줘"
```

## 현재 프로젝트 상태

### 기술 환경

- ✅ **Node.js v22.15.1** 업그레이드 완료
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
- ✅ **CLI 도구** 안정성 개선
- ✅ **TDD 테스트 환경** 구축

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
gemini /memory add "OpenManager VIBE v5 - AI 서버 모니터링 플랫폼"
gemini /memory add "Next.js 15, TypeScript strict mode, Node.js v22.15.1"
gemini /memory add "Vercel 무료 티어 최적화, Edge Runtime 사용"
```

### 개발 규칙

```bash
gemini /memory add "SOLID 원칙 준수, 1500줄 초과 시 파일 분리"
gemini /memory add "any 타입 사용 금지, 타입 안전성 필수"
gemini /memory add "기존 코드 우선 재사용, 중복 코드 방지"
gemini /memory add "TDD 접근: Red-Green-Refactor 사이클"
```

### 주요 기능

```bash
gemini /memory add "UnifiedAIEngineRouter: 다중 AI 엔진 통합 시스템"
gemini /memory add "Supabase Auth: GitHub OAuth 인증"
gemini /memory add "실시간 서버 모니터링 및 AI 분석"
```

---

💡 **참고**: 프로젝트 전체 정보는 `CLAUDE.md` 파일을 참조하세요.
