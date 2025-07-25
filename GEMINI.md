# GEMINI.md

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

#### 일일 제한

- **무료 제한**: 1,000회/일
- **리셋 시간**: 태평양 표준시(PST) 자정 = 한국 시간 오후 4-5시경

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
