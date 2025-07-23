# GEMINI.md

이 파일은 Gemini AI에게 프로젝트 컨텍스트와 가이드라인을 제공합니다.

## 📝 목차

1. [핵심 원칙](#핵심-원칙)
2. [프로젝트 개요](#프로젝트-개요)
3. [기술 스택](#기술-스택)
4. [프로젝트 설정](#프로젝트-설정)
5. [MCP 서버 설정](#mcp-서버-설정)
6. [Claude와의 협업 방법](#claude와의-협업-방법)
7. [효율적인 사용 전략](#효율적인-사용-전략)
8. [주요 디렉토리 구조](#주요-디렉토리-구조)
9. [개발 가이드라인](#개발-가이드라인-claude-md와-동일한-규칙-적용)
10. [현재 프로젝트 상태](#현재-프로젝트-상태)
11. [메모리 저장 권장사항](#메모리-저장-권장사항)
12. [문서 생성 위치 규칙](#문서-생성-위치-규칙-필수-준수)
13. [참고 문서](#참고-문서)

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

## Claude Code와의 관계

### 현재 개발 환경

- **메인 개발 도구**: Claude Code가 주도적으로 작업 중
- **Gemini CLI 역할**: 코드 분석, 품질 검토, 간단한 질문 답변
- **협업 방식**: Claude Code에서 필요시 Gemini CLI에게 직접 요청 가능

### Gemini CLI가 잘하는 작업

- 대용량 파일 분석 (`@` 구문 활용)
- 코드베이스 전체 구조 파악
- SOLID 원칙 위반 검토
- any 타입 사용 검사
- 기존 코드 중복 검사
- 간단한 코드 리뷰
- 문서 요약 및 설명

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

## 📝 문서 생성 위치 규칙 (필수 준수)

### 루트 디렉토리 (/) - 4개 파일만 허용

**절대 규칙**: 다음 4개 파일만 루트에 유지

- README.md - 프로젝트 소개
- CLAUDE.md - Claude Code 지시사항
- CHANGELOG.md - 버전 이력
- GEMINI.md - Gemini CLI 가이드

⚠️ **중요**: LICENSE, CONTRIBUTING.md 등 다른 문서는 생성하지 말 것

### docs 폴더 (/docs) - 모든 기타 문서

- 설정 가이드 → `/docs/setup/`
- 트러블슈팅 → `/docs/troubleshooting/`
- 개발 가이드 → `/docs/development/`
- 보안 문서 → `/docs/security/`
- API 문서 → `/docs/api/`
- 기타 모든 문서 → `/docs/`

❌ **절대 금지**: 루트에 임시 문서, 분석 문서, 이슈 문서 생성

## 참고 문서

### 필수 문서

- `README.md`: 프로젝트 개요 및 설치 가이드
- `CLAUDE.md`: Claude Code 지시사항
- `CHANGELOG.md`: 버전 변경 이력

### 추가 참고 자료

- `docs/gemini-dev-tools-v5-guide.md`: Gemini CLI 상세 사용법
- `docs/ai-system-unified-guide.md`: AI 시스템 통합 가이드
- `docs/security-complete-guide.md`: 보안 가이드
