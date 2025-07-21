# GEMINI.md

이 파일은 Gemini AI에게 프로젝트 컨텍스트와 가이드라인을 제공합니다.

## 프로젝트 개요

**OpenManager VIBE v5**는 AI 기반 서버 모니터링 플랫폼입니다.

- 실시간 서버 관리 및 모니터링
- 다중 AI 엔진 통합 (Google AI, Supabase RAG, Korean NLP)
- Vercel 무료 티어 최적화 (월 사용량 90% 절감)

## 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript (strict mode)
- **런타임**: Node.js v22.15.1
- **스타일링**: Tailwind CSS
- **데이터베이스**: Supabase (PostgreSQL)
- **캐싱**: Upstash Redis
- **AI**: Google Generative AI (Gemini)
- **배포**: Vercel (Edge Runtime)

## 프로젝트 설정

### 파일 스캔 제한

이 프로젝트는 TypeScript/React 프로젝트입니다.

- 주요 파일: `src/app/page.tsx`, `src/services/`
- 불필요한 파일 스캔 경고 무시
- 필요시 `@` 구문으로 특정 파일만 참조

## MCP 서버 설정

✅ **MCP 서버 설정 완료**

- 설정 파일: `~/.gemini/settings.json`
- MCP 도구: `gemini-mcp-tool`
- 파일 참조: `@파일경로` 구문 사용 가능

```bash
# 파일 분석 예시
echo "분석 요청" | gemini -p "메인 페이지 파일의 구조를 설명해주세요"
```

## Claude와의 협업 방법

### 작업 분담 전략

#### Gemini CLI가 효율적인 작업:

- 대용량 파일 분석 (`@` 구문 활용)
- 코드베이스 전체 구조 파악
- 간단한 코드 리뷰
- 문서 요약 및 설명
- 반복적인 질문/답변
- **기존 코드 중복 검사** (개발 규칙 #2)
- **SOLID 원칙 위반 검토** (1500줄 초과 파일 탐지)
- **any 타입 사용 검사** (타입 안전성)
- **문서 업데이트 필요 파일 찾기**

#### Claude가 효율적인 작업:

- 복잡한 코드 작성 및 리팩토링
- 실시간 디버깅
- 파일 생성/수정
- Git 작업 및 PR 생성
- 아키텍처 설계

### TDD 협업 워크플로우 (실제 예시: Husky Hook 버그 수정)

#### Gemini의 TDD 역할

1. **Red 단계 (문제 분석)**: 기존 코드 분석으로 문제 원인 파악
2. **Green 단계 (구현 가이드)**: 테스트를 통과할 최소한의 코드 변경 가이드
3. **Refactor 단계 (개선 제안)**: 리팩토링 및 사이드 이펙트 검토

```bash
# 1. 문제 분석 (TDD Red 이전)
# 실제 발생한 Husky pre-commit hook 실패 문제 분석
echo "Husky pre-commit hook 실패" | gemini -p "기존 스크립트 분석 및 v10 deprecated 구문 문제 원인 파악"

# 2. Claude가 테스트 또는 수정 진행 (TDD - Red/Green)
# 로컬에서 hook을 수정하고 직접 실행하여 테스트

# 3. Gemini로 코드 리뷰 (TDD - Refactor 준비)
# 수정된 내용을 기반으로 잠재적 문제 검토
git diff | gemini -p "이 변경으로 인해 pre-push 등 다른 Git hook에 사이드 이펙트가 발생할 가능성이 있는지 검토해줘"

# 4. Claude가 Gemini 피드백 반영하여 리팩토링 (TDD - Refactor)

# 5. 문서 업데이트 확인
# 관련된 문서가 있는지 확인하고 업데이트 필요시 목록 요청
echo "Husky hook 수정 완료" | gemini -p "관련된 문서가 있는지 확인하고, 없다면 생성 가이드라인 제안"
```

## 효율적인 사용 전략

### 💊 사용량 관리

#### 1. 일일 제한

- **무료 제한**: 1,000회/일
- **리셋 시간**: 태평양 표준시(PST) 자정 = 한국 시간 오후 4-5시경

#### 2. 사용량 명령어

```bash
gemini /stats      # 사용량 확인
gemini /compress   # 대화 압축 (토큰 절약)
gemini /clear      # 컨텍스트 초기화
gemini /memory list # 저장된 메모리 확인
```

#### 3. 사용량 임계값 가이드

- **0-50%**: Gemini 자유롭게 사용
- **50-80%**: 중요한 작업 위주
- **80-100%**: Claude로 전환 권장

### 🎯 토큰 절약 전략

#### 1. 효율적 사용 패턴

```bash
# ❌ 비효율적 (토큰 낭비)
gemini  # 장시간 대화형 모드

# ✅ 효율적 (토큰 절약)
echo "질문" | gemini -p "3줄로 답변"
cat 파일명.js | gemini -p "핵심만 요약"
```

#### 2. 일일 워크플로우 예시

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

# 저녁 (사용량 90%+)
# Claude로 전환하여 복잡한 작업 수행
```

#### 3. 백업 전략

```bash
# 중요 대화 내용 저장
gemini /export > gemini_session_$(date +%Y%m%d).txt

# 메모리 백업
gemini /memory list > project_memory.txt
```

### 개발 규칙 검토 명령어

```bash
# 기존 코드 중복 검사 (토큰 절약형)
echo "로깅 기능" | gemini -p "기존 로깅 코드 위치만 알려줘"

# SOLID 원칙 위반 검사
echo "파일 크기" | gemini -p "1500줄 넘는 TypeScript 파일 목록"

# any 타입 검사
echo "타입 검사" | gemini -p "any 타입 사용 개수만"

# 문서 업데이트 체크
git diff --name-only | gemini -p "이 변경에 영향받는 문서"
```

## 주요 디렉토리 구조

```
src/
├── app/           # Next.js App Router (pages + API)
├── components/    # React 컴포넌트 (도메인별 구성)
├── services/      # 비즈니스 로직 및 외부 연동
├── domains/       # 도메인별 모듈 (DDD)
├── lib/          # 공유 유틸리티
├── hooks/        # 커스텀 React hooks
├── stores/       # Zustand 상태 관리
├── types/        # TypeScript 타입 정의
└── utils/        # 헬퍼 함수
```

## 개발 가이드라인 (CLAUDE.md와 동일한 규칙 적용)

### 🚀 핵심 개발 규칙

#### 1. TDD (Test-Driven Development) 필수

- Red → Green → Refactor 사이클 준수
- Gemini로 기존 코드 분석 → Claude로 구현 → Gemini로 리뷰

#### 2. SOLID 원칙 검토

- **1500줄 규칙**: 파일이 1500줄 넘으면 분리 검토

```bash
# SOLID 원칙 검토 명령어
echo "파일 분석" | gemini -p "SOLID 원칙 위반 사항 찾기"
```

#### 3. 기존 코드 우선

```bash
# 중복 코드 방지
echo "새 기능: 로깅 시스템" | gemini -p "기존 로깅 관련 코드 모두 찾기"
```

#### 4. Next.js 최적화 검토

```bash
# 최적화 포인트 찾기
echo "성능 분석" | gemini -p "Image 컴포넌트 미사용 부분 찾기"
```

#### 5. 타입 안전성 검사

```bash
# any 타입 사용 검사
echo "타입 검사" | gemini -p "any 타입 사용 부분 모두 찾기"
```

#### 6. 문서화 확인

```bash
# 문서 업데이트 필요 부분
echo "API 변경" | gemini -p "API 문서 업데이트 필요한 파일 목록"
```

### 테스트

- **단위 테스트**: Vitest
- **통합 테스트**: API 엔드포인트
- **E2E 테스트**: Playwright
- **커버리지 목표**: 70% 이상

### 커밋 메시지

- 한국어 이모지 프리픽스 사용
- 예: `🔧 설정 업데이트`, `✨ 새 기능 추가`

### 환경 변수

- `GOOGLE_AI_API_KEY`: Google AI 인증
- `SUPABASE_*`: Supabase 설정
- `UPSTASH_REDIS_*`: Redis 설정

## 현재 프로젝트 상태

- ✅ **Node.js v22.15.1** 업그레이드 완료
- ✅ **MCP 서버 설정** 완료
- ✅ **AI 엔진 통합** 완료
- ✅ **Vercel 사용량 최적화**: 자동 로그아웃, API 호출 빈도 조절 등 적용 완료
- ✅ **CLI 도구 개선**: `cm`, `cu` 명령어 안정성 및 사용성 개선 완료
- 🔧 **Husky Git Hooks**: v10 호환성 문제 해결 완료
- 🔄 **성능 모니터링**: 고도화 작업 진행 중

## 메모리 저장 권장사항

프로젝트 시작 시 다음 정보를 메모리에 저장하세요:

```bash
gemini /memory add "OpenManager VIBE v5 - AI 서버 모니터링"
gemini /memory add "Next.js 15, TypeScript, Node.js v22.15.1"
gemini /memory add "Vercel 무료 티어 최적화 중점"
gemini /memory add "TDD 필수: Red-Green-Refactor 사이클"
gemini /memory add "SOLID 원칙 준수, 1500줄 넘으면 파일 분리"
gemini /memory add "any 타입 금지, 기존 코드 우선 재사용"
```

## 참고 문서

- `CLAUDE.md`: Claude AI 가이드라인
- `GEMINI_USAGE_GUIDE.md`: 효율적 사용 가이드
- `docs/gemini-cli-mcp-setup.md`: MCP 설정 가이드
- `development/gemini-local/`: 로컬 개발 가이드
