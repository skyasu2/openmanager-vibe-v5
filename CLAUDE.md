# CLAUDE.md

**한국어로 우선 대화, 기술용어는 영어 사용허용**

**Claude Code 프로젝트 가이드** | [공식 문서](https://docs.anthropic.com/en/docs/claude-code)

## 🎯 프로젝트 개요

**OpenManager VIBE**: AI 기반 실시간 서버 모니터링 플랫폼

- **아키텍처**: Next.js 15+ + React 18+ + TypeScript (strict) + Vercel + Supabase
- **데이터 시스템**: StaticDataLoader (v5.71.0) - 99.6% CPU 절약, 92% 메모리 절약
- **무료 티어**: 100% 무료로 운영 (Vercel/Supabase 무료 계정 최적화)
- **AI 시스템**: 4-AI 통합 (Claude Max + Gemini + Codex + Qwen) 교차검증 시스템

## 💻 개발 환경

**WSL 2 (Ubuntu) 중심 개발** 🐧
- **Host**: Windows + WSL 2 (최적화된 메모리/스왑 설정)
- **Shell**: bash (WSL), Node.js 최신 LTS, npm 전역 관리
- **AI 도구**: Claude Code + Gemini CLI + Qwen CLI
- **성능**: Linux 네이티브, MCP 서버 통합, 빠른 I/O
- **보조**: VSCode + GitHub Copilot (이미지 처리, 스크린샷)

## 🐧 WSL 2 최적화 현황

**성능**: 최적화된 메모리 설정, 빠른 I/O, JavaScript heap 안정성
**도구**: Claude/Gemini/Qwen CLI 모두 정상 작동
**메모리**: 단계적 메모리 할당 프로필 지원

→ **[상세 분석](docs/development/wsl-optimization-analysis-report.md)** | **[메모리 가이드](MEMORY-REQUIREMENTS.md)**

## 🚀 빠른 시작

```bash
# Windows에서 WSL Claude 시작
.\claude-wsl-optimized.bat

# WSL 내부 개발 명령어
npm run dev          # 개발 서버
npm run validate:all # 린트+타입+테스트
claude --version     # 버전 확인 (v1.0.112)
```

## 📋 AI 시스템별 파일 구분

**프로젝트에는 서로 다른 AI 시스템을 위한 파일들이 있습니다:**

### 📄 CLAUDE.md (Claude Code 메모리 파일) ⭐ **현재 파일**
- **정확한 역할**: Claude Code의 **메모리 시스템 파일** (설정 + 컨텍스트)
- **공식 위치**: `./CLAUDE.md` (프로젝트 메모리 - 팀 공유용)
- **자동 로드**: Claude Code 실행 시 자동으로 메모리에 로드
- **계층 구조**: Enterprise → Project (이 파일) → User 순 우선순위
- **공식 문서**: [Claude Code Memory System](https://docs.anthropic.com/en/docs/claude-code/memory)

### 📄 AGENTS.md (Codex 전용 설정 및 메모리 파일)
- **정확한 역할**: OpenAI Codex CLI의 **전용 설정 및 메모리 파일**
- **목적**: Codex CLI 에이전트의 코딩 스타일, PR 가이드라인, 테스트 방법 지정
- **기능**: Codex 전용 컨텍스트 및 프로젝트별 메모리 제공
- **내용**: 12개 Codex 전문 에이전트 구성 (TypeScript 엔지니어, Next.js 최적화 등)
- **위치**: 루트 디렉토리 (`/init` 명령으로 생성)

### 📄 docs/claude/sub-agents-complete-guide.md (Claude 서브에이전트 가이드)
- **용도**: Claude Code 서브에이전트 실전 활용 가이드 
- **내용**: 18개 Claude 서브에이전트 (central-supervisor, verification-specialist 등)
- **위치**: docs/claude/ 디렉토리 (문서 체계)

**⚠️ 중요**: 각 파일은 완전히 다른 AI 시스템을 위한 것입니다!

## 🤖 AI CLI 도구 통합 (WSL 환경)

### 설치된 AI CLI 도구들

| 도구                  | 버전    | 요금제              | 역할 구분                   | WSL 실행                   | Windows 네이티브           | 최근 업데이트 |
| --------------------- | ------- | ------------------- | --------------------------- | -------------------------- | -------------------------- | ------------- |
| **Claude Code**       | v1.0.112 | Max ($200/월) | 🏆 **메인 개발 환경**       | WSL 직접 실행 | ✅ 완벽 지원                | 2025-09-15 최신 |
| **OpenAI CLI (Codex)** | v0.29.0 | Plus ($20/월)       | 🤝 **서브에이전트 전용** ⚠️ | Task codex-specialist | ✅ **서브에이전트만 사용**    | 2025-09-15 최신 |
| **Google Gemini CLI** | **v0.4.1** 🆕 | 무료 (60 RPM/1K RPD)   | 👨‍💻 **서브에이전트 전용** ⚠️ | Task gemini-specialist | ✅ **Google OAuth 브라우저 인증**    | **2025-09-15 업그레이드** |
| **Qwen Code**         | v0.0.10  | 무료 (60 RPM/2K RPD)   | 🔷 **서브에이전트 전용** ⚠️ | Task qwen-specialist   | ✅ **Qwen OAuth 브라우저 인증**    | 2025-09-15 최신 |
| **ccusage**           | **v16.2.4** 🆕 | 무료                | 📊 **Claude 사용량 모니터링** | ccusage daily              | ✅ 완벽 지원                | **2025-09-12 업그레이드** |

> ✅ **해결완료**: **Codex CLI WSL 네트워크 문제 완전 해결**됨. DNS 설정 수정으로 서브에이전트 정상 작동. ChatGPT Plus 계정으로 GPT-5 모델 추가 과금 없이 사용 가능.

### WSL 통합 실행

```bash
# WSL 내부에서 서브에이전트 사용
claude --version
Task gemini-specialist "작업 요청"
Task qwen-specialist "작업 요청"  
Task codex-specialist "작업 요청"
```

##### WSL 내부에서 서브에이전트 실행

```bash
# WSL 접속
wsl
cd /mnt/d/cursor/openmanager-vibe-v5

# AI 도구들 서브에이전트 방식 사용 (버전 확인은 직접 가능)
claude --version     # Claude Code v1.0.112 버전 확인
Task gemini-specialist "간단한 테스트"   # Gemini 서브에이전트
Task qwen-specialist "간단한 테스트"     # Qwen 서브에이전트  
Task codex-specialist "간단한 테스트"    # Codex 서브에이전트
ccusage --version    # ccusage 버전 확인
```

## 🔌 MCP & 베르셀 통합

### 📊 MCP 현황: 9/9개 완전 작동 🏆 27% 토큰 절약

| MCP 서버 | 상태 | 기능 |
|----------|------|------|
| **memory** | ✅ | Knowledge Graph 저장 |
| **supabase** | ✅ | PostgreSQL 쿼리 |
| **playwright** | ✅ | 브라우저 자동화 |
| **time** | ✅ | 시간대 변환 |
| **context7** | ✅ | 라이브러리 문서 |
| **sequential-thinking** | ✅ | 순차 사고 |
| **shadcn-ui** | ✅ | UI 컴포넌트 (46개) |
| **serena** | ✅ | 26개 코드 분석 도구 |
| **🆕 vercel** | ✅ | AI-베르셀 플랫폼 브릿지 |

### 🌐 베르셀 MCP - AI 플랫폼 브릿지 (2025.09.15 업데이트)

**핵심 역할**: AI와 베르셀 플랫폼을 연결하는 **표준 MCP 프로토콜** 기반 브릿지

#### 🚀 주요 기능 (AI 교차검증 완료)
- **배포 자동화**: Next.js 프로젝트 원클릭 배포
- **성능 모니터링**: CPU 사용량 50% 절약 (Streamable HTTP)
- **무료 티어 최적화**: 베르셀 무료 계정 100% 활용
- **OAuth 2.1 보안**: 프로덕션급 인증 시스템

#### 📊 검증 결과
- **Level 2-3 AI 교차검증**: 8.5/10점 (조건부 승인)
- **프로덕션 사용**: Zapier, Composio, Vapi, Solana 검증됨
- **표준 준수**: MCP 프로토콜 기반 확장성 보장

```bash
# 베르셀 공식 MCP 서버 연결
claude mcp add --transport http vercel https://mcp.vercel.com

# 활용 가능 기능:
# - 베르셀 프로젝트 관리, 배포 상태 모니터링, 로그 분석
# - 실시간 사용량 추적, 무료 티어 최적화 자동화
```

## 🤖 서브에이전트 최적화 전략

**18개 핵심 에이전트 최적화 완료** - v1.0.112 호환성 확인 (2025.09.15)

### 🎯 핵심 에이전트 구성 (18개)

#### 1. 메인 조정자 (1개)

**central-supervisor**: 복잡한 작업 오케스트레이션 전문가
- **역할**: 500줄+ 코드, 다중 파일 작업 자동 분해 및 전문 에이전트 분배
- **Task 예시**: `Task central-supervisor "전체 인증 시스템 리팩토링"`

#### 2. AI 교차 검증 시스템 (6개)

**verification-specialist**: AI 교차검증 메인 진입점
- **역할**: Level 1-3 복잡도 기반 자동 검증 시스템
- **Task 예시**: `Task verification-specialist "src/components/Button.tsx 자동 검증"`

**codex-specialist**: ChatGPT Codex CLI 전용 외부 AI 연동
- **특화**: 실무 중심 코드 리뷰, 버그 발견, GPT-5 기반 분석
- **Task 예시**: `Task codex-specialist "복잡한 알고리즘 최적화 분석"`

**gemini-specialist**: Google Gemini CLI 전용 외부 AI 연동  
- **특화**: 시스템 아키텍처 분석, 구조적 개선사항 제안
- **Task 예시**: `Task gemini-specialist "시스템 아키텍처 설계 검토"`

**qwen-specialist**: Qwen CLI 전용 외부 AI 연동
- **특화**: 알고리즘 최적화, 성능 분석, 수학적 복잡도 개선
- **Task 예시**: `Task qwen-specialist "알고리즘 성능 최적화 분석"`

#### 3. 전문 도구 (11개)

**개발 환경 & 구조 (2개)**:
- **dev-environment-manager**: WSL 최적화, Node.js 버전 관리
- **structure-refactor-specialist**: 프로젝트 구조 정리, 아키텍처 리팩토링

**백엔드 & 인프라 (3개)**:
- **database-administrator**: Supabase PostgreSQL 전문, RLS 정책, 쿼리 최적화
- **vercel-platform-specialist**: Vercel 플랫폼 최적화, 배포 자동화
- **gcp-cloud-functions-specialist**: GCP Cloud Functions 전문가

**코드 품질 & 보안 (3개)**:
- **code-review-specialist**: 통합 코드 품질 검토 전문가
- **debugger-specialist**: 버그 해결 및 근본 원인 분석
- **security-auditor**: 보안 감사 및 취약점 스캔

**테스트 & 문서화 (3개)**:
- **test-automation-specialist**: 테스트 자동화, Vitest + Playwright E2E 전문
- **simple-test-agent**: 실험용 테스트 에이전트 
- **documentation-manager**: AI 친화적 문서 관리

### 🎯 AI 서브에이전트 직접 지정 사용법

**⚠️ 중요**: 자동 AI 선택 없음. **사용자가 직접 지정할 때만** 서브에이전트 사용

```bash
# Codex (GPT-5) - 논리적 분석 & 실무 코딩 전문가
Task codex-specialist "이 함수에서 메모리 누수 가능성 분석하고 수정"

# Gemini - 아키텍처 설계 & 시스템 전략가
Task gemini-specialist "서버 카드 UI/UX 개선해서 실제 파일 수정해줘"

# Qwen - 성능 최적화 & 알고리즘 전문가
Task qwen-specialist "이 알고리즘 복잡도 O(log n)으로 최적화해서 코드 수정"

# AI 교차검증 (사용자가 원할 때)
Task verification-specialist "src/components/Button.tsx"  # Level 1-3 자동 판단
```

## 🎯 멀티 AI 전략적 활용 방안

### 🏆 메인 개발 라인: Claude Code (Max $200/월)

**WSL 환경 중심의 핵심 개발 도구**
- MCP 서버 9개 통합으로 종합적 기능 제공 (27% 토큰 절약)
- **Max 사용 한계**: 5시간당 200-800 프롬프트
- **효율적 사용**: Opus는 Plan Mode 전용, 기본은 Sonnet 4 사용

### 🤝 서브 에이전트 라인: 3-AI 협업 시스템

#### 💰 Codex CLI (ChatGPT Plus $20/월) ✅ 완전 해결
**GPT-5 기반 고성능 서브 에이전트**
- **사용량**: 30-150 메시지/5시간
- **현재 성능**: codex-wrapper 9.0/10 안정적 운영

```bash
# 서브에이전트 정상 작동 확인
Task codex-specialist "복잡한 알고리즘 최적화 필요"
Task codex-specialist "이 코드의 보안 취약점 분석해줘"
```

#### 🆓 Gemini CLI (Google AI 무료)
**Google OAuth 브라우저 인증**
- **한도**: 60 RPM / 1,000 RPD
- **현재 성능**: gemini-specialist 9.33/10 최고 성능

#### 🆓 Qwen CLI (Qwen OAuth 무료)
**Qwen OAuth 브라우저 인증**
- **한도**: 60 RPM / 2,000 RPD
- **현재 상태**: qwen-wrapper 8.5/10 안정적 운영

### 🔄 협업 시나리오

#### 1. 병렬 개발 패턴
```bash
# Claude Code: 메인 기능 구현
# 동시에 Codex CLI: 테스트 코드 작성
# 동시에 Gemini CLI: 문서화 진행
```

#### 2. 교차 검증 패턴 (Claude 주도)
```bash
# 1단계: Claude Code가 A안 제시
# 2단계: Gemini/Codex/Qwen이 교차 검증 & 개선점 제시
# 3단계: Claude Code가 개선점 검토 → 최종 결정
```

### 📈 효율성 지표 (Max 사용자 특화)

**현재 투자 대비 효과**:
- **총 월 투자**: $220 (Claude Max $200 + ChatGPT Plus $20)
- **실제 작업 가치**: $2,200+ (API 환산 시)
- **비용 효율성**: 10배 이상 절약 효과
- **개발 생산성**: 4배 증가 (멀티 AI 협업)

## 🤝 AI 교차검증 시스템

**✅ 실용적 해결책 구축 완료 (2025-09-15 업데이트)**

### 🚀 구축된 실용적 시스템

```bash
# AI 교차검증 v3.0 (완전 구현)
./scripts/ai-cross-validation-v3.sh src/path/to/file.ts [level]

# Claude 통합 스크립트 (다목적)
./scripts/claude-ai-integration.sh verify src/components/Button.tsx auto
```

### 📊 3단계 레벨 시스템

**Level 1** (50줄 미만): Claude 단독 → 즉시 결과
**Level 2** (50-200줄): Claude + Codex(GPT-5) → 30-60초  
**Level 3** (200줄+): Claude + Codex + Gemini + Qwen → 45-90초

### 🎯 AI별 전문 분야 (가중치 적용)

**Codex CLI (0.99)**: 실무 코드 리뷰, 버그 발견
**Gemini CLI (0.98)**: 아키텍처 분석, 구조 개선
**Qwen CLI (0.97)**: 성능 최적화, 알고리즘 분석

### 📈 실제 성과 측정

- **정확도 향상**: 6.2/10 → 8.8/10 (42% 개선)
- **검증 속도**: Level 1 즉시 → Level 3 90초 
- **비용 효율성**: API 대비 10배 절약
- **버그 발견률**: 90% 증가 (멀티 AI 관점)

## 🎲 Mock 시뮬레이션 시스템

**FNV-1a 해시 기반 현실적 서버 메트릭 생성** - 비용 절감 + 포트폴리오 데모

### 🎯 핵심 아키텍처

- **📊 정규분포 메트릭**: Math.random() → FNV-1a 해시로 현실적 서버 행동 시뮬레이션
- **🏗️ 10개 서버 타입**: web, api, database, cache 등 전문화된 특성
- **⚡ 15+ 장애 시나리오**: 트래픽 폭증, DDoS 공격, 메모리 누수 등 확률 기반
- **🔄 CPU-Memory 상관관계**: 0.6 계수로 현실적 상관성 구현

### 📈 시뮬레이션 성과

- **📊 응답시간**: 평균 272ms - 안정적 성능
- **🤖 AI 호환성**: 실시간 장애 분석 가능한 메타데이터
- **💰 베르셀 호환**: 무료 티어 100% 활용
- **🎯 현실성**: 10개 서버 동시 시뮬레이션

### 🚀 GCP VM 대비 장점

| 구분 | GCP VM (이전) | Mock 시뮬레이션 (현재) |
|------|---------------|---------------------|
| **비용** | $57/월 | $0 (완전 무료) |
| **안정성** | 99.5% | 99.95% (코드 기반) |
| **확장성** | 1개 VM 제한 | 무제한 서버 시뮬레이션 |

## 💰 무료 티어 전략

### 🎯 플랫폼 최적화 성과

**🌐 Vercel**: 30GB/월 (30% 사용) | 152ms 응답시간
**🐘 Supabase**: 15MB (3% 사용) | RLS 정책, 쿼리 50ms
**☁️ GCP**: Cloud Functions 200만 호출/월 (5% 사용)

### 💡 핵심 성과
- **월 운영비**: $0 (100% 무료)
- **절약 효과**: 연간 $1,380-2,280
- **성능**: 엔터프라이즈급 (152ms, 99.95% 가동률)

## 📐 핵심 규칙

1. **TypeScript**: any 금지, strict mode 필수
2. **파일 크기**: 500줄 권장, 1500줄 초과 시 분리
3. **테스트**: 커버리지 70%+, 개발 시 관련 테스트 동시 수정
4. **커밋**: 이모지 + 간결한 메시지
5. **사이드 이펙트 필수 고려**: 모든 수정/삭제/개발 시 영향 분석 및 검증 필수

## 💡 개발 철학

### 1. 🎨 타입 우선 개발 (Type-First)
**타입 정의 → 구현 → 리팩토링** 순서로 개발

### 2. 🔄 사이드 이펙트 우선 개발 (Side-Effect First)
**개발 및 수정 시 테스트, 문서, API 등 연관된 모든 사이드 이펙트를 함께 고려하여 동시 수정**

### 3. 📝 커밋 컨벤션 (이모지 필수)
- **✨ feat**: 새 기능 | **🐛 fix**: 버그 수정 | **♻️ refactor**: 리팩토링

### 4. ⚠️ 사이드 이펙트 관리
**모든 수정, 삭제, 개발 작업 시 반드시 고려할 핵심 원칙**

#### 🔍 사전 영향 분석
- **의존성 추적**: 변경 대상이 다른 컴포넌트/서비스에 미치는 영향 분석
- **호환성 검증**: 기존 API, 설정, 환경과의 하위 호환성 확인

#### 🧪 안전 검증 프로토콜
- **테스트 우선**: 변경 전 기존 기능 테스트, 변경 후 회귀 테스트 필수
- **단계적 적용**: 큰 변경은 단계별로 나누어 각 단계마다 검증
- **롤백 계획**: 모든 변경에 대해 즉시 되돌릴 수 있는 방법 사전 준비

## 🎯 현재 상태

### 프로젝트 현황
- **개발 기간**: 2025년 5월 시작, 현재 4개월 운영 중
- **코드베이스**: 226,356줄 (src), 873개 TypeScript 파일
- **프로젝트 구조**: 기능별 레이어드 아키텍처, JBGE 원칙 적용

### 품질 지표
- **TypeScript 에러**: 0개 완전 해결 ✅ (77개→0개) - strict 모드 100% 달성
- **테스트**: 54/55 통과 (98.2%), 평균 실행 속도 6ms
- **CI/CD**: Push 성공률 99%, 평균 배포 시간 5분

### Vercel 배포 현황
- **배포 상태**: ✅ 완전 성공 (Zero Warnings 달성)
- **Node.js 버전**: ✅ 22.x 통합
- **배포 성과**: 경고 4개 → 0개, 프로덕션 안정성 100% 확보

### WSL 환경 상태 (2025-08-30 최신)
- **메모리**: 16GB 할당, 10.9GB 사용 가능
- **AI CLI 도구**: 5개 모두 완벽 작동
- **멀티 AI 협업**: Max 정액제 + 서브 3개 체제 ($220/월로 $2,200+ 가치)

## 🔧 트러블슈팅

### 일반적 문제 해결
- **MCP 오류**: `claude mcp status`로 상태 확인
- **서브에이전트 실패**: WSL 환경 점검, PATH 확인
- **타입 오류**: `npx tsc --noEmit`으로 strict 설정 확인
- **배포 실패**: `npm run build` 로컬 테스트 후 Vercel 배포

### WSL 특화 문제
```bash
# WSL 메모리 최적화
echo 'export NODE_OPTIONS="--max-old-space-size=8192"' >> ~/.bashrc

# AI CLI 환경 확인
which claude gemini qwen codex
```

### MCP 서버 재연결
```bash
# MCP 서버 상태 확인
claude mcp status

# 문제 서버 재연결
claude mcp remove serena
claude mcp add serena uv run --directory ~/.local/share/uv/tools/serena-mcp serena-mcp
```

## 📊 Claude Code Statusline

**실시간 Claude 효율성 모니터링** - Max 20x 사용량 추적 (가상 비용 환산)

```
🤖 Opus | 💰 $0.23 session / $1.23 today / $0.45 block (2h 45m left) | 🔥 $0.12/hr 🟢
```

### 표시 구성 요소
- **🤖 Active Model**: 현재 사용 중인 Claude 모델 (Opus, Sonnet)
- **💰 Session/Daily/Block Cost**: 세션/일일/5시간 블록 작업량
- **🔥 Burn Rate**: 시간당 토큰 소비 비율 (색상 코딩)
- **🧠 Context Usage**: 입력 토큰 수 및 한계 대비 비율

## 📚 설계도 관리 체계

**체계적 설계도 관리**: current (운영 중) + future (계획) + archive (완료/폐기)

### 🎯 설계도 관리 센터 ⭐ 메인 참조
- **[🏗️ 설계도 관리 센터](docs/design/README.md)**: 체계적 설계도 관리 구조
- **관리 철학**: 현실 기반 설계 + 미래 확장성 고려

### 📊 현재 운영 시스템 설계도

| 설계도 | 설명 | 상태 |
|------|------|------|
| **[📊 시스템 아키텍처](docs/design/current/system-architecture.md)** | v5.71.0 StaticDataLoader 운영 | ✅ 운영 중 |
| **[🔌 API 설계](docs/design/current/api-design.md)** | 76개 기능별 API 구조 | ✅ 운영 중 |
| **[📈 실시간 모니터링](docs/design/current/realtime-monitoring.md)** | StaticDataLoader + 시뮬레이션 | ✅ 운영 중 |
| **[🤖 AI 교차검증](docs/design/current/ai-system-design.md)** | 4-AI 협업 시스템 | ✅ 운영 중 |

### 🔄 아키텍처 진화: 설계도 vs 현실

| 구분 | 이론적 목표 | 실제 구현 (2025.09) | 평가 |
|------|-------------|-------------------|------|
| **코드베이스 규모** | 69,260줄 계획 | 227,590줄 실제 | 🔄 **기능 완성도 우선** |
| **API 구조** | 12개 통합 계획 | 90개 기능별 구조 | 🎯 **실용성 우선** |
| **TypeScript 안전성** | Strict 모드 계획 | 100% 완전 달성 | ✅ **목표 초과 달성** |
| **성능 최적화** | 계획에 없음 | StaticDataLoader 99.6% CPU 절약 | ✅ **예상 초과 혁신** |
| **AI 교차검증** | 계획에 없음 | 4-AI 시스템 완성 | ✅ **예상 초과 혁신** |

## 📚 프로젝트 문서

**체계적 문서 구조**: JBGE 원칙 기반 /docs 폴더 완전 체계화  

**🚀 핵심 가이드**: [빠른 시작](docs/QUICK-START.md) • [시스템 아키텍처](docs/system-architecture.md) • [AI 시스템](docs/AI-SYSTEMS.md)

**⚙️ 전문 도구**: MCP 9개 서버 • AI CLI 4개 • 서브에이전트 18개

→ **[📚 전체 문서 인덱스](docs/README.md)**

---

💡 **핵심 원칙**: Type-First + Side-Effect First + 이모지 커밋 + **사이드 이펙트 필수 고려** + WSL 멀티 AI 통합

⚠️ **사이드 이펙트 우선**: 모든 수정, 삭제, 개발 시 영향 분석 및 검증 필수

📖 **상세 내용**: /docs 폴더 참조 (JBGE 원칙 기반 체계적 구조)

🐧 **WSL 우선**: 모든 AI 개발 작업은 WSL에서 수행

🤖 **멀티 AI 전략**: 메인 1개 + 서브 3개로 비용 효율성과 생산성 극대화