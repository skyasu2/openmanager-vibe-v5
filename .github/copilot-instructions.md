# GitHub Copilot 설정
# OpenManager VIBE v5 프로젝트용 Copilot 컨텍스트

## 개발 환경 구성
**메인 개발**: WSL 터미널 내 Claude Code
**보조 개발**: VS Code + GitHub Copilot (Windows)

## 프로젝트 정보
프로젝트: OpenManager VIBE v5
타입: Next.js + TypeScript 기반 AI 플랫폼
버전: v5.66.40

## AI 에이전트 아키텍처
### 주력 AI (WSL 환경)
- **Claude Code** - 메인 개발 AI
- **서브 에이전트 전략적 활용**:
  - `gemini-cli` - 주력 보조 AI (Claude 사용량 조절 및 토큰 부족시)
  - `codex-cli` - ChatGPT Plus 요금제 활용 (추가 코드 생성 옵션)  
  - `qwen-cli` - 무료 제공량 풍부 (비용 절약용 백업)

### 보조 AI (Windows VS Code)
- **GitHub Copilot** - 특수 용도 보조
  - 이미지 캡쳐 및 분석
  - 시각적 콘텐츠 처리
  - 보조 코드 제안

## 기술 스택
- Frontend: Next.js 15, React 18, TypeScript (strict)
- Backend: Edge Runtime, GCP Functions, Supabase
- AI: Claude Code (주), 서브 에이전트들, GitHub Copilot (보조)
- UI: Tailwind CSS, shadcn/ui

## 핵심 아키텍처
- 모듈화된 서비스 레이어 (8개 전문 모듈)
- AI 엔진 라우터 (UnifiedAIEngineRouter)
- 실시간 메트릭 시스템
- MCP (Model Context Protocol) 통합

## VS Code + WSL + Copilot 역할 분담
### VS Code 주요 역할
1. **WSL 터미널 호스팅** - Claude Code 실행 환경
2. **이미지 처리** - 캡쳐, 붙여넣기, 시각 분석
3. **보조 코드 제안** - Claude Code 보완용
4. **GUI 도구** - 파일 탐색, 디버깅

### Claude Code 주요 역할 (WSL)
1. **메인 개발** - 코드 작성, 리팩토링, 아키텍처 설계
2. **서브 에이전트 조율** - 필요시 gemini/codex/qwen 호출
3. **프로젝트 컨텍스트 관리** - 전체 구조 이해 및 활용

## 코드 스타일
- 200-400줄 파일 크기 유지
- JSDoc 주석 필수
- 타입 안전성 100%
- 모듈화 패턴 준수

## 중요 디렉토리
- src/services/ai/ - AI 엔진 서비스
- src/components/ - React 컴포넌트
- src/types/ - TypeScript 타입 정의
- docs/ - 프로젝트 문서

## GitHub Copilot 특화 역할
1. **이미지 기반 작업**
   - 스크린샷 분석 및 코드 생성
   - 디자인 목업 → 컴포넌트 변환
   - UI/UX 개선 제안

2. **보조 코드 지원**
   - Claude Code 작업 중 빠른 스니펫 제공
   - 타입 정의 자동완성
   - 반복 패턴 코드 생성

## 개발 우선순위
1. Claude Code 메인 개발 플로우 유지
2. 서브 에이전트 효율적 활용
3. VS Code Copilot 보조 역할 최적화
4. 타입 안전성 확보
5. 문서화 완성

## 개발 가이드라인 (Copilot용)

### 기존 코드 스타일 분석 우선
- 먼저 프로젝트의 기존 코드 패턴을 분석하고 이해
- 기존 애니메이션 구현 방식과 일관성 유지  
- 현재 사용 중인 UI 라이브러리 패턴 따르기
- 기존 타입 정의 스타일과 통일성 유지

### 권장사항
- Claude Code 워크플로우와 조화로운 제안
- 200-400줄 적정 파일 크기 유지
- TypeScript strict 모드 규칙 준수
- 기존 8-모듈 분리 패턴 활용

### 특별 고려사항  
- 과도한 애니메이션 추가보다는 기존 UI/UX 패턴 개선
- 새로운 의존성 추가 시 기존 기술 스택과의 호환성 확인
