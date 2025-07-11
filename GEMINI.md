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

## MCP 서버 설정

✅ **MCP 서버 설정 완료**
- 설정 파일: `~/.gemini/settings.json`
- MCP 도구: `gemini-mcp-tool`
- 파일 참조: `@파일경로` 구문 사용 가능

```bash
# 파일 분석 예시
echo "분석 요청" | gemini -p "@src/app/page.tsx 이 파일의 구조를 설명해주세요"
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

### TDD 협업 워크플로우

#### Gemini의 TDD 역할
1. **Red 단계**: 기존 코드 분석으로 중복 방지
2. **Green 단계**: 구현 가이드 제공
3. **Refactor 단계**: SOLID 원칙 기반 리뷰 및 개선점 제안

```bash
# 1. 기존 코드 분석 (중복 방지) - TDD Red 이전
echo "새 기능: 사용자 인증" | gemini -p "@src/ 기존 인증 로직 찾아서 재사용 가능한 부분 분석"

# 2. Claude가 테스트 작성 (TDD - Red)
# 실패하는 테스트 먼저 작성

# 3. Claude가 구현 (TDD - Green)
# 테스트를 통과하는 최소 구현

# 4. Gemini로 코드 리뷰 (TDD - Refactor 준비)
git diff | gemini -p "SOLID 원칙 관점에서 리뷰: 1) 단일 책임 원칙 위반 사항 2) 1500줄 넘는 파일 3) 의존성 역전 필요 부분"

# 5. Gemini로 개선점 제안
echo "현재 구현" | gemini -p "@src/services/ 비슷한 패턴 찾아서 리팩토링 방향 제시"

# 6. Claude가 Gemini 피드백 반영하여 리팩토링 (TDD - Refactor)

# 7. 문서 업데이트
echo "변경사항" | gemini -p "@docs/ @CHANGELOG.md 업데이트할 문서 목록"
```

## 효율적인 사용 전략

### 일일 제한 관리
- **무료 제한**: 1,000회/일
- **리셋 시간**: 한국 시간 오후 4-5시

### 사용량 명령어
```bash
gemini /stats      # 사용량 확인
gemini /compress   # 대화 압축 (토큰 절약)
gemini /clear      # 컨텍스트 초기화
gemini /memory list # 저장된 메모리 확인
```

### 토큰 절약 팁
```bash
# ❌ 비효율적
gemini  # 장시간 대화형 모드

# ✅ 효율적
echo "질문" | gemini -p "3줄로 답변"
cat file.js | gemini -p "핵심만 요약"
```

### 개발 규칙 검토 명령어
```bash
# 기존 코드 중복 검사 (토큰 절약형)
echo "로깅 기능" | gemini -p "@src/ 기존 로깅 코드 위치만 알려줘"

# SOLID 원칙 위반 검사
echo "파일 크기" | gemini -p "@src/**/*.ts 1500줄 넘는 파일 목록"

# any 타입 검사
echo "타입 검사" | gemini -p "@src/services/ any 타입 사용 개수만"

# 문서 업데이트 체크
git diff --name-only | gemini -p "@docs/ 이 변경에 영향받는 문서"
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
echo "파일 분석" | gemini -p "@src/services/example.ts SOLID 원칙 위반 사항 찾기"
```

#### 3. 기존 코드 우선
```bash
# 중복 코드 방지
echo "새 기능: 로깅 시스템" | gemini -p "@src/ 기존 로깅 관련 코드 모두 찾기"
```

#### 4. Next.js 최적화 검토
```bash
# 최적화 포인트 찾기
echo "성능 분석" | gemini -p "@src/components/ Image 컴포넌트 미사용 부분 찾기"
```

#### 5. 타입 안전성 검사
```bash
# any 타입 사용 검사
echo "타입 검사" | gemini -p "@src/ any 타입 사용 부분 모두 찾기"
```

#### 6. 문서화 확인
```bash
# 문서 업데이트 필요 부분
echo "API 변경" | gemini -p "@docs/ API 문서 업데이트 필요한 파일 목록"
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

- ✅ Node.js v22.15.1 업그레이드 완료
- ✅ MCP 서버 설정 완료
- ✅ AI 엔진 통합 완료
- 🔄 Vercel 무료 티어 최적화 진행 중
- 🔄 성능 모니터링 개선 중

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