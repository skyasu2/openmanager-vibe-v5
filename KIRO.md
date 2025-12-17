<!--
Kiro CLI configuration reference for OpenManager VIBE v5
Maintained for active Kiro CLI usage in WSL2
-->

# 🤖 KIRO.md - Kiro CLI 전용 레퍼런스

> **이 문서는 Kiro CLI 설정 및 사용 지침의 공식 레퍼런스입니다.**
> **OpenManager VIBE v5 Kiro CLI 연동 안내**
> **Language Policy**: 한국어 우선, 기술용어 영어 허용
> **Last Updated**: 2025-11-29
> **Environment**: Windows 11 + WSL2 (Ubuntu)
> **다른 AI 도구**: `CLAUDE.md` (Claude Code/Multi-AI MCP), `AGENTS.md` (Codex), `GEMINI.md` (Gemini), `QWEN.md` (Qwen)

## 문서 목적

- **Kiro CLI 전용**: AWS Kiro CLI의 설치 상태, 사용법, 특징을 문서화합니다.
- **실제 상태만 기록**: 리포지터리에 존재하는 확인 가능한 정보만 유지합니다.
- **다른 AI는 별도 문서**: Codex는 AGENTS.md, Gemini는 GEMINI.md, Qwen은 QWEN.md, Claude Code는 CLAUDE.md 참조

## 현재 환경 요약

| 항목               | 값                                  | 출처                          |
| ------------------ | ----------------------------------- | ----------------------------- |
| 프로젝트 버전      | 5.80.0                              | `package.json`                |
| Node.js            | 22.21.1                             | `.nvmrc`                      |
| npm                | 10.9.2                              | `package.json:packageManager` |
| Next.js            | ^15.5.5                             | `package.json`                |
| TypeScript         | ^5.7.2                              | `package.json`                |
| 주요 테스트 러너   | Vitest, Playwright                  | `package.json`                |
| 기본 작업 디렉터리 | `/mnt/d/cursor/openmanager-vibe-v5` | 현 세션                       |

## Kiro CLI 개요

### 특징

- **AWS 공식 AI 어시스턴트**: Amazon Web Services에서 제공하는 CLI 기반 AI 도구
- **시스템 컨텍스트 인식**: 운영체제, 작업 디렉터리 등 환경 정보 자동 파악
- **파일 시스템 작업**: 파일 읽기/쓰기, 디렉터리 탐색 지원
- **Bash 명령 실행**: 시스템 명령어 직접 실행 가능
- **AWS CLI 통합**: AWS 리소스 관리 및 쿼리 지원
- **MCP(Model Context Protocol) 지원**: 로컬 MCP 서버와 연동 가능

### 핵심 역량

1. **코드 작성 및 수정**: TypeScript, JavaScript, Python 등 다양한 언어 지원
2. **인프라 관리**: AWS 리소스 조회 및 관리
3. **디버깅 지원**: 로그 분석, 오류 추적
4. **문서 작성**: 마크다운 기반 문서 생성 및 편집
5. **테스트 실행**: 단위 테스트, E2E 테스트 실행 및 분석

## 사용법

### 기본 명령어

```bash
# Kiro CLI 대화형 모드 시작
kiro-cli chat

# 특정 질문 실행
kiro-cli chat "Next.js 프로젝트 구조 분석해줘"

# 파일 컨텍스트와 함께 질문
kiro-cli chat --context src/app/page.tsx "이 파일 최적화 방법 알려줘"
```

### 프로젝트 내 활용

1. **코드 리뷰 지원**
   ```bash
   kiro-cli chat "src/components/**/*.tsx 파일들의 타입 안전성 검토해줘"
   ```

2. **디버깅 지원**
   ```bash
   kiro-cli chat "logs/error.log 분석하고 해결 방법 제시해줘"
   ```

3. **문서 생성**
   ```bash
   kiro-cli chat "API 엔드포인트 문서 작성해줘"
   ```

4. **테스트 실행 및 분석**
   ```bash
   kiro-cli chat "npm run test 실행하고 실패한 테스트 분석해줘"
   ```

## Kiro CLI 역할 및 관련 도구

### Kiro CLI (본 문서)

- **역할**: AWS 통합 AI 어시스턴트, 시스템 레벨 작업 지원
- **강점**: 파일 시스템 작업, AWS 리소스 관리, 범용 개발 지원
- **특화**: 인프라 코드, 설정 파일, 문서 작성

### 다른 AI 도구와의 차별점

| 도구        | 주요 역할                    | 강점                          |
| ----------- | ---------------------------- | ----------------------------- |
| Kiro        | AWS 통합 AI 어시스턴트       | 시스템 작업, AWS 리소스 관리  |
| Codex       | 코드 리뷰 & 검증             | 함수 단위 문제 해결, 리팩토링 |
| Claude Code | 설계 & 아키텍처              | 복잡한 문제 분석, 설계 의도   |
| Gemini      | 자연어 처리 & 문서 생성      | 한국어 NLP, RAG 검색          |
| Qwen        | 다국어 지원 & 번역           | 중국어 특화, 다국어 문서      |

## 다른 AI 도구 (별도 문서)

| 도구                       | 현재 버전 | 참고 문서   |
| -------------------------- | --------- | ----------- |
| Claude Code / Multi-AI MCP | v2.0.37   | `CLAUDE.md` |
| Codex CLI                  | v0.58.0   | `AGENTS.md` |
| Gemini CLI                 | v0.15.4   | `GEMINI.md` |
| Qwen CLI                   | v0.2.1    | `QWEN.md`   |

## Kiro CLI와 다른 도구 연계

### 1. Kiro ↔ Claude Code

- Claude가 설계한 아키텍처를 Kiro가 파일로 구현
- Kiro가 생성한 코드를 Claude가 리뷰

### 2. Kiro ↔ Codex

- Kiro가 작성한 코드를 Codex가 검증
- Codex 리뷰 결과를 Kiro가 반영

### 3. Kiro ↔ Gemini

- Kiro가 생성한 문서를 Gemini가 자연어 최적화
- Gemini RAG 검색 결과를 Kiro가 코드로 구현

### 4. 통합 워크플로우

```bash
# 1. Claude로 설계
"새로운 API 엔드포인트 설계해줘"

# 2. Kiro로 구현
kiro-cli chat "Claude 설계를 기반으로 /api/new-endpoint 구현해줘"

# 3. Codex로 검증
codex exec "새로 작성된 API 코드 리뷰해줘"

# 4. Gemini로 문서화
gemini-cli "API 엔드포인트 사용 가이드 작성해줘"
```

## Wrapper 스크립트 (선택사항)

필요시 `scripts/ai-subagents/kiro-wrapper.sh` 생성 가능:

```bash
#!/usr/bin/env bash
# Kiro CLI Wrapper v1.0.0
# 타임아웃, 로깅, 컨텍스트 주입 지원

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 600초 타임아웃
timeout 600s kiro-cli chat "$@"
```

## 추천 워크플로우

### 일반 개발

1. **설계**: Claude Code로 아키텍처 설계
2. **구현**: Kiro로 파일 생성 및 코드 작성
3. **검증**: Codex로 코드 리뷰
4. **문서화**: Gemini로 문서 생성

### 디버깅

1. **로그 분석**: Kiro로 에러 로그 분석
2. **원인 파악**: Claude로 근본 원인 분석
3. **수정**: Kiro로 코드 수정
4. **검증**: 테스트 실행 및 확인

### AWS 리소스 관리

1. **조회**: Kiro로 AWS 리소스 상태 확인
2. **분석**: Claude로 최적화 방안 도출
3. **적용**: Kiro로 인프라 코드 수정
4. **배포**: Kiro로 배포 스크립트 실행

## 유지보수 체크리스트

- [ ] Kiro CLI 버전 업데이트 시 문서 갱신
- [ ] 새로운 기능 추가 시 사용 예시 작성
- [ ] Wrapper 스크립트 생성 시 버전 및 경로 기록
- [ ] 다른 AI 도구와의 연계 패턴 발견 시 문서화

## 업데이트 로그

- **2025-11-29**: Kiro CLI 전용 문서 최초 생성. 기본 사용법, 다른 AI 도구와의 연계 방법 정리.
