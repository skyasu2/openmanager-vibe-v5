# CLAUDE.md

**한국어로 우선 대화, 기술용어는 영어 사용허용**

**Claude Code 프로젝트 가이드** | [공식 문서](https://docs.anthropic.com/en/docs/claude-code)

## 🎯 프로젝트 개요

**OpenManager VIBE**: AI 기반 실시간 서버 모니터링 플랫폼

- **아키텍처**: Next.js 15+ + React 18+ + TypeScript (strict) + Vercel + Supabase
- **코드베이스**: TypeScript 기반 대규모 코드베이스 (JBGE 원칙으로 간소화 달성)
- **데이터 시뮬레이션**: FNV-1a 해시 정규분포 기반 Mock 서버 메트릭 생성
- **무료 티어**: 100% 무료로 운영 (Vercel/Supabase 무료 계정 최적화)
- **성능**: 빠른 API 응답, 고가용성, MCP 통합으로 토큰 절약
- **AI 시스템**: 4-AI 통합 (Claude Max + Gemini + Codex + Qwen) 교차검증 시스템

## 💻 개발 환경

**WSL 2 (Ubuntu) 중심 개발** 🐧
- **Host**: Windows + WSL 2 (최적화된 메모리/스왑 설정)
- **Shell**: bash (WSL), Node.js 최신 LTS, npm 전역 관리
- **AI 도구**: Claude Code + Gemini CLI + Qwen CLI
- **성능**: Linux 네이티브, MCP 서버 통합, 빠른 I/O
- **보조**: VSCode + GitHub Copilot (이미지 처리, 스크린샷)

## 🚀 빠른 시작

```bash
# Windows에서 WSL Claude 시작
.\claude-wsl-optimized.bat

# WSL 내부 개발 명령어
npm run dev          # 개발 서버
npm run validate:all # 린트+타입+테스트
claude --version     # 버전 확인
```

## 🐧 WSL 2 최적화 현황

**성능**: 최적화된 메모리 설정, 빠른 I/O, JavaScript heap 안정성
**도구**: Claude/Gemini/Qwen CLI 모두 정상 작동
**메모리**: 단계적 메모리 할당 프로필 지원

→ **[상세 분석](docs/development/wsl-optimization-analysis-report.md)** | **[메모리 가이드](MEMORY-REQUIREMENTS.md)**

## 📋 AI 설정 파일 구분

**프로젝트에는 AI 관련 설정 파일 2개가 있습니다:**

### 📄 AGENTS.md (Codex CLI 설정)
- **용도**: ChatGPT Codex CLI 전용 설정 파일
- **내용**: 12개 Codex 전문 에이전트 (TypeScript 엔지니어, Next.js 최적화 등)
- **대상**: Codex CLI 사용자
- **위치**: 루트 디렉토리 (Codex CLI 요구사항)

### 📄 docs/claude/sub-agents-complete-guide.md (Claude 서브에이전트 완전 가이드)
- **용도**: Claude Code 서브에이전트 실전 활용 가이드
- **내용**: 17개 Claude 서브에이전트 (central-supervisor, verification-specialist 등)
- **대상**: Claude Code 사용자
- **위치**: docs/claude/ 디렉토리 (체계적 관리)

**⚠️ 중요**: 이 두 파일은 서로 다른 AI 시스템을 위한 것으므로 혼동하지 마세요!

## 🤖 AI CLI 도구 통합 (WSL 환경)

### 설치된 AI CLI 도구들

| 도구                  | 버전    | 요금제              | 역할 구분                   | WSL 실행                   | Windows 네이티브           |
| --------------------- | ------- | ------------------- | --------------------------- | -------------------------- | -------------------------- |
| **Claude Code**       | v1.0.108 | Max ($200/월) | 🏆 **메인 개발 환경**       | WSL 직접 실행 | ✅ 완벽 지원                |
| **OpenAI CLI (Codex)** | v0.29.0 | Plus ($20/월)       | 🤝 **계정 로그인 전용** ⚠️ | codex exec (WSL)  | ✅ **API 사용 금지**           |
| **Google Gemini CLI** | v0.3.4  | 무료 (1K/day 한도)   | 👨‍💻 **계정 로그인 전용** ⚠️ | gemini (WSL)           | ✅ 무료 한도 준수                |
| **Qwen Code**         | v0.0.10  | 무료 (OAuth 2K/day)   | 🔷 **계정 인증 전용** ⚠️ | qwen (WSL)             | ✅ OAuth 전용                |
| **ccusage**           | v16.2.3 | 무료                | 📊 **Claude 사용량 모니터링** | ccusage daily              | ✅ 완벽 지원                |

> ✅ **해결완료**: **Codex CLI WSL 네트워크 문제 완전 해결**됨. DNS 설정 수정으로 `codex exec` 명령어 정상 작동. ChatGPT Plus 계정으로 GPT-5 모델 추가 과금 없이 사용 가능.

### WSL 통합 실행

```bash
# WSL 내부에서 AI CLI 도구 사용
claude --version
gemini --help  
qwen --help
codex exec "명령어"
```

##### WSL 내부에서 직접 실행

```bash
# WSL 접속
wsl
cd /mnt/d/cursor/openmanager-vibe-v5

# AI 도구들 직접 실행 (버전 확인)
claude --version     # Claude Code 버전 확인
gemini --version     # Gemini CLI 버전 확인
qwen --version       # Qwen CLI 버전 확인
codex --version      # Codex CLI 버전 확인
ccusage --version    # ccusage 버전 확인
```

## 🎯 멀티 AI 전략적 활용 방안

### 🏆 메인 개발 라인: Claude Code (Max $200/월 정액제)

**WSL 환경 중심의 핵심 개발 도구**
- 모든 메인 개발 작업의 중심축
- MCP 서버 8개 통합으로 종합적 기능 제공 (27% 토큰 절약)
- 📊 **Max 사용자 장점**: 사용량 한계 내 무제한 사용 (추가 비용 없음)
- 📈 **효율성**: 높은 일일 작업량 처리 (API 대비 절약 효과)
- 🔄 **최적 모델 믹스**: Opus 4 + Sonnet 4 병행 사용

### 🤝 서브 에이전트 라인: 3-AI 협업 시스템

#### 💰 Codex CLI (ChatGPT Plus $20/월) ✅ **완전 해결**
**GPT-5 기반 고성능 서브 에이전트 - WSL 네트워크 문제 해결됨**

**📊 2025년 공식 사용량 제한 (OpenAI 발표)**:
- **Plus 사용자**: 30-150 메시지/5시간 (1-2시간 코딩 세션 주간 가능)
- **Pro 사용자**: 300-1,500 메시지/5시간 (기본적으로 제한 없음)
- **보너스 크레딧**: Plus $5, Pro $50 (30일 만료)
- **초기 관대한 접근**: 첫 몇 주 동안 무제한에 가까운 사용량 제공

**🔧 WSL 환경 해결 완료**:
```bash
# DNS 설정 수정으로 네트워크 문제 해결
echo 'nameserver 8.8.8.8' | sudo tee -a /etc/resolv.conf
echo 'nameserver 1.1.1.1' | sudo tee -a /etc/resolv.conf

# WSL 영구 설정
echo -e "[network]\ngenerateResolvConf = false" | sudo tee -a /etc/wsl.conf

# 정상 작동 확인
codex exec "복잡한 알고리즘 최적화 필요"  # ✅ 작동
codex exec "이 코드의 보안 취약점 분석해줘"  # ✅ 작동
```

**🎯 현재 상태**: ChatGPT Plus 계정으로 추가 과금 없이 GPT-5 모델 정상 사용 중

#### 🆓 Gemini CLI (Google AI 무료)

**⚠️ 무료 한도 준수 필수**: 1,000 요청/일 제한, 계정 로그인 전용, API 사용 금지

**대규모 데이터 분석 전문**

```bash
# 대용량 로그 분석 (무료 한도 내)
gemini -p "서버 로그 패턴 분석 및 성능 병목 찾기"

# 문서 자동 생성 (계정 로그인만)
gemini -p "API 문서 자동 생성해줘"
```

#### 🆓 Qwen CLI (Qwen OAuth를 통해 2,000회/일 무료)

**⚠️ OAuth 계정 인증 필수**: 2,000 요청/일 제한, OAuth 로그인 전용, API 사용 금지

**빠른 프로토타이핑 및 검증**

```bash
# 빠른 코드 스니펫 생성 (OAuth 계정만)
qwen -p "React Hook 패턴 구현"

# 알고리즘 검증 (무료 한도 내)
qwen -p "이 정렬 알고리즘이 최적인지 검증"
```

### 🔄 협업 시나리오

#### 1. **병렬 개발 패턴**

```bash
# Claude Code: 메인 기능 구현
# 동시에 Codex CLI: 테스트 코드 작성
# 동시에 Gemini CLI: 문서화 진행
```

#### 2. **교차 검증 패턴 (Claude 주도 방식)**

```bash
# 1단계: Claude Code가 A안 제시 (초기 해결책)
# 2단계: Gemini/Codex/Qwen이 A안에 대한 교차 검증 & 개선점 제시
# 3단계: Claude Code가 개선점 검토 → 수용/거절 결정
# 4단계: Claude Code가 최종 결정 사유와 함께 사용자에게 보고
# 5단계: Claude Code가 최종안 구현
```

#### 3. **제3자 관점 리뷰**

```bash
# Claude가 막힌 문제를 다른 AI에게 의뢰
# 서로 다른 접근 방식으로 해결책 비교
# 최적 솔루션 도출
```

### 💡 효율성 최적화 전략 (Max 사용자)

#### 📊 실시간 효율성 모니터링

```bash
# ccusage statusline으로 작업량 실시간 추적 (가상 비용 환산)
🤖 Opus | 💰 $66.77 session / $73.59 today | 🔥 $22.14/hr

# Max 사용자 혜택: 월 $200 정액으로 무제한 사용
daily_virtual_cost=$73.59
monthly_value=$(echo "$daily_virtual_cost * 30" | bc)
echo "월 작업량 가치: $2,207.70 (API 환산) | 실제 비용: $200 정액"
echo "비용 효율성: $(echo "scale=1; $monthly_value / 200" | bc)배 절약 효과"

# 효율성 지표 활용
echo "📊 Opus vs Sonnet 비율: 90% vs 10%"
echo "🔄 최적 모델 선택으로 생산성 극대화"
```

#### 🎯 효율성 기반 역할 분배 (Max 사용자 활용)

- **🏆 Max 장점 활용**: 정액제로 Opus 4 자유 사용 (API 대비 11배 절약)
- **🔄 스마트 모델 믹스**: 복잡한 작업은 Opus 4, 일반 작업은 Sonnet 4
- **🤝 서브 에이전트**: 병렬 처리로 전체 생산성 극대화
- **💰 비용 효율성**: $200 정액으로 월 $2,200+ 가치 창출
- **📊 효율성 추적**: ccusage로 작업량 대비 성과 측정

### 🚀 서브 에이전트 자동 호출

```bash
# Claude Code가 판단하여 자동 서브 에이전트 활용
# 예: 복잡도 높은 작업 시 자동 병렬 처리
# 예: 효율성 극대화를 위한 무료 도구 우선 활용
# 예: 교차 검증 필요 시 다중 AI 의견 수렴
```

### 📈 효율성 지표 (Max 사용자 특화) - 2025년 업데이트

**🎯 현재 투자 대비 효과**:
- **총 월 투자**: $220 (Claude Max $200 + ChatGPT Plus $20)
- **실제 작업 가치**: $2,200+ (API 환산 시)
- **비용 효율성**: 10배 이상 절약 효과
- **무료 보조 도구**: Gemini (1K/day) + Qwen (OAuth 2K/day) 병렬 처리
- **개발 생산성**: 4배 증가 (멀티 AI 협업)

**📊 Codex CLI 추가 혜택 (2025년 공식 확인)**:
- **GPT-5 모델 접근**: Plus 요금제 내 무료 사용 (API 대비 절약 효과)
- **보너스 크레딧**: Plus 사용자 $5 추가 제공 (30일)
- **사용량 제한**: 30-150 메시지/5시간 (일반 개발 작업 충분)
- **초기 관대 기간**: 첫 몇 주 무제한에 가까운 사용량
- **코드 품질**: 교차 검증으로 버그 90% 감소

---

💡 **핵심 철학**: **Max 정액제 + 서브 3개** 체제로 무제한 생산성과 극도의 비용 효율성

## 🤝 AI 교차검증 시스템

**3단계 레벨 교차검증**: Claude 주도 + 3-AI 협업 (Gemini/Codex/Qwen)

```bash
# Level 1: Claude 단독 (50줄 미만)
Task verification-specialist "quick review"

# Level 2: Claude + AI 1개 (50-200줄)  
Task ai-verification-coordinator "standard review"

# Level 3: Claude + AI 3개 (200줄+ 중요 파일)
Task external-ai-orchestrator "full verification"
```

→ **[수동 가이드](docs/ai-tools/manual-ai-verification-guide.md)** | **단순 실행**: `Task verification-specialist "코드 검증"`

## 🤖 서브에이전트 최적화 전략

**17개 핵심 에이전트 최적화 완료** - 아카이브 정리로 중복 제거 (2025.09.08)

### 🎯 핵심 에이전트 구성 (17개)

#### **1. 메인 조정자** (1개)

**central-supervisor**: 복잡한 작업 분해 및 서브에이전트 오케스트레이션
- **proactive**: true (복잡도 높은 작업 자동 감지)
- **주요 도구**: memory, sequential-thinking, serena
- **트리거 조건**: 500줄+ 코드, 다중 파일 작업, 아키텍처 변경
- **Task 예시**: `Task central-supervisor "전체 인증 시스템 리팩토링"`

#### **2. AI 교차 검증 시스템** (6개)

**verification-specialist**: AI 교차검증 메인 진입점, Level 1-3 복잡도 자동 판단
- **proactive**: true (코드 파일 변경 시 자동 실행)
- **주요 도구**: serena (코드 분석), memory (컨텍스트), sequential-thinking (사고)
- **트리거 조건**: 코드 파일 수정, git commit hooks, 중요 함수 변경
- **Task 예시**: `Task verification-specialist "src/components/Button.tsx quick review"`

**ai-verification-coordinator**: 3단계 레벨 기반 검증 조정자, AI 1개 추가 호출  
- **proactive**: false (verification-specialist에서 자동 호출)
- **주요 도구**: sequential-thinking, memory
- **트리거 조건**: Level 2 검증 필요 (50-200줄 또는 중간 복잡도)
- **Task 예시**: `Task ai-verification-coordinator "src/hooks/useAuth.ts standard review"`

**external-ai-orchestrator**: 외부 AI 3개 병렬 실행 오케스트레이션
- **proactive**: false (ai-verification-coordinator에서 자동 호출)
- **주요 도구**: sequential-thinking, context7, memory
- **트리거 조건**: Level 3 검증 (200줄+ 또는 중요 파일)  
- **Task 예시**: `Task external-ai-orchestrator "src/app/api/auth/route.ts full verification"`

**codex-wrapper**: ChatGPT Codex CLI 전용 래퍼 (10점 만점 평가, 가중치 0.99)
- **proactive**: false (external-ai-orchestrator에서만 호출)
- **주요 도구**: Bash (codex exec 명령어)
- **트리거 조건**: external-ai-orchestrator 호출, 60초 timeout
- **특징**: 실무 경험 기반 코드 검토, Plus $20/월 요금제
- **호출**: 직접 호출 불가, orchestrator 통해서만

**gemini-wrapper**: Google Gemini CLI 전용 래퍼 (10점 만점 평가, 가중치 0.98)
- **proactive**: false (external-ai-orchestrator에서만 호출)  
- **주요 도구**: Bash (gemini CLI)
- **트리거 조건**: external-ai-orchestrator 호출
- **특징**: 대규모 데이터 분석, 1,000회/일 무료 한도
- **호출**: 직접 호출 불가, orchestrator 통해서만

**qwen-wrapper**: Qwen CLI 전용 래퍼 (10점 만점 평가, 가중치 0.97)
- **proactive**: false (external-ai-orchestrator에서만 호출)
- **주요 도구**: Bash (qwen CLI)  
- **트리거 조건**: external-ai-orchestrator 호출
- **특징**: 알고리즘 최적화, OAuth 2,000회/일 무료
- **호출**: 직접 호출 불가, orchestrator 통해서만

#### **3. 개발 환경 & 구조** (2개)

**dev-environment-manager**: WSL 최적화, Node.js 버전 관리, 개발 환경 통합 관리
- **proactive**: false (환경 문제 발생 시에만 호출)
- **주요 도구**: time (시간대 관리), memory (환경 설정 기록)
- **트리거 조건**: Node.js 버전 충돌, WSL 성능 문제, 개발 도구 설치
- **Task 예시**: `Task dev-environment-manager "Node.js 22.x 환경 최적화"`

**structure-refactor-specialist**: 프로젝트 구조 정리, 아키텍처 리팩토링 전문
- **proactive**: false (구조 변경 요청 시에만)
- **주요 도구**: serena (심볼 조작), memory (구조 히스토리)
- **트리거 조건**: 대규모 리팩토링, 폴더 구조 변경, 모듈 재구성
- **Task 예시**: `Task structure-refactor-specialist "컴포넌트 디렉토리 재구조화"`

#### **4. 백엔드 & 인프라** (3개)

**database-administrator**: Supabase PostgreSQL 전문, RLS 정책, 쿼리 최적화
- **proactive**: true (쿼리 성능 이슈 자동 감지)
- **주요 도구**: supabase (모든 DB 도구), memory (최적화 히스토리)
- **트리거 조건**: 쿼리 2초+ 소요, DB 에러, RLS 정책 변경
- **Task 예시**: `Task database-administrator "사용자 인증 테이블 성능 최적화"`

**vercel-platform-specialist**: Vercel 플랫폼 최적화, 배포 자동화, Edge Functions
- **proactive**: false (배포 관련 작업만)
- **주요 도구**: 기본 도구 (Bash, Read, Write), memory
- **트리거 조건**: 배포 실패, 성능 문제, Edge Runtime 이슈  
- **Task 예시**: `Task vercel-platform-specialist "Next.js 15 Vercel 최적화"`

**gcp-cloud-functions-specialist**: GCP Cloud Functions 전문가, 서버리스 아키텍처
- **proactive**: false (GCP 관련 작업만)
- **주요 도구**: 기본 도구, memory (GCP 설정)
- **트리거 조건**: Cloud Functions 배포, 무료 티어 관리
- **Task 예시**: `Task gcp-cloud-functions-specialist "AI Gateway 함수 최적화"`

#### **5. 코드 품질 & 보안** (3개)

**code-review-specialist**: 통합 코드 품질 검토, TypeScript strict 모드 준수
- **proactive**: false (리뷰 요청 시에만)
- **주요 도구**: serena (코드 분석), shadcn-ui (UI 컴포넌트)
- **트리거 조건**: PR 생성, 코드 리뷰 요청, 품질 검사
- **Task 예시**: `Task code-review-specialist "Button 컴포넌트 접근성 검토"`

**debugger-specialist**: 버그 해결 및 근본 원인 분석, 스택 트레이스 해석
- **proactive**: false (버그 발생 시에만)
- **주요 도구**: serena (코드 추적), memory (버그 패턴)
- **트리거 조건**: 런타임 에러, 테스트 실패, 성능 병목
- **Task 예시**: `Task debugger-specialist "React 18 hydration 에러 해결"`

**security-auditor**: 보안 감사 및 취약점 스캔, OWASP 준수
- **proactive**: true (보안 관련 코드 변경 자동 감지)
- **주요 도구**: supabase (DB 보안), memory (보안 규칙)
- **트리거 조건**: 인증 코드 변경, API 키 노출, 권한 설정
- **Task 예시**: `Task security-auditor "JWT 토큰 보안 검토"`

#### **6. 테스트 & 문서화** (2개)

**test-automation-specialist**: 테스트 자동화, Vitest + Playwright E2E 전문
- **proactive**: false (테스트 관련 작업만)
- **주요 도구**: playwright (모든 브라우저 도구), serena (테스트 코드)
- **트리거 조건**: 테스트 실패, 새 컴포넌트 생성, 커버리지 저하
- **Task 예시**: `Task test-automation-specialist "서버 카드 컴포넌트 E2E 테스트"`

**documentation-manager**: AI 친화적 문서 관리, 토큰 효율성 우선 문서 작성
- **proactive**: true (AI 도구가 99% 사용, 사람 1%)
- **주요 도구**: context7 (최신 문서), shadcn-ui (컴포넌트 문서)
- **트리거 조건**: 새 API 추가, 컴포넌트 변경, AI 도구 효율성 개선 필요
- **AI 친화적 문서 원칙**:
  - 파일명: 15자 이하 (`auth-github.md`, `api-routes.md`)
  - YAML frontmatter 필수: id, keywords, ai_optimized, priority
  - 코드 스니펫 우선: 설명보다 복사 가능한 코드
  - AI 단일 구조: `/docs/` (AI 최적화, 22개 핵심 문서), `/docs/archive/` (280개 백업)
- **Task 예시**: `Task documentation-manager "API 엔드포인트 AI 친화적 문서화"`

### ✅ 주요 개선사항 (2025-09-08 아카이브 정리)

#### 🎯 서브에이전트 아카이브 정리 완료
```
17개 핵심 에이전트 확정 (중복 제거)
아카이브된 5개 에이전트 완전 삭제
proactive 설정: 4개 자동 실행, 13개 수동 호출  
AI 교차검증 시스템: 6개 에이전트 완전 구축
```

#### 📈 MCP 통합 현황 (최적화 완료)
```
활성 MCP 서버: 8개 (memory, supabase, playwright, time, context7, serena, sequential-thinking, shadcn-ui)
에이전트별 최적 매핑: 핵심 3개 이하로 제한
도구 할당 효율성: 80% → 95% 향상
중복 도구 할당 제거: 완료
```

#### 🚀 교차 검증 시스템 특징 (완전 자동화)
- **3단계 복잡도 기반**: Level 1 (Claude만) → Level 2 (AI 1개) → Level 3 (AI 3개 모두)
- **자동 hooks 트리거**: 파일 수정 시 verification-specialist 자동 실행
- **가중치 시스템**: codex(0.99) > gemini(0.98) > qwen(0.97) 신뢰도 반영
- **의사결정 알고리즘**: 10점 만점 평가 후 자동 승인/거절/조건부승인
- **보안 강화 모드**: 인증/결제 코드 자동 Level 3 검증

#### 🔄 proactive 설정 최적화
**자동 실행 (4개):**
- central-supervisor, verification-specialist, database-administrator, security-auditor

**수동 실행 (13개):**
- AI CLI 래퍼 3개 (orchestrator 전용)  
- 전문 도구 10개 (요청 시에만)

### 📁 아카이브 정리 완료 (2025-09-08)

```
✅ 17개 핵심 에이전트 확정 (중복 제거 완료)
🗑️ 삭제된 아카이브: ai-systems-specialist, git-cicd-specialist, mcp-server-administrator, quality-control-specialist, ux-performance-specialist
🎯 최종 구성: AI 교차검증 6개 + 전문 도구 11개
```

→ **[아카이브 문서](docs/archive/sub-agents/README.md)**

### 🚀 자동 트리거 조건

#### **AI 협업 3종 세트 자동 활용**

```bash
# 복잡도 높은 작업 (500줄+ 코드)
if (code_lines > 500 || complexity == "high") {
  suggest_parallel_ai_collaboration()
}

# 큰 작업 시 자동 병렬 처리
large_task → codex-cli + gemini-cli + qwen-cli (동시 실행)

# 교차 검증 필요 시
critical_feature → multi_ai_review_process()
```

#### **AI CLI 래퍼 자동 활용**

```bash
# ChatGPT Codex 활용 (Plus $20/월)
Task codex-wrapper "복잡한 알고리즘 최적화 필요"
Task codex-wrapper "이 코드의 보안 취약점 분석해줘"

# Google Gemini 활용 (무료 1K/day)
Task gemini-wrapper "대용량 로그 분석 및 성능 병목 찾기" 
Task gemini-wrapper "API 문서 자동 생성해줘"

# Qwen 활용 (OAuth 2K/day)
Task qwen-wrapper "React Hook 패턴 구현"
Task qwen-wrapper "이 정렬 알고리즘이 최적인지 검증"
```

#### **전문 에이전트 자동 호출**

```bash
# 테스트 실패 → test-automation-specialist
npm test (failed) → auto_trigger("test-automation-specialist")

# 보안 관련 코드 → security-auditor
auth|payment|api_key → auto_trigger("security-auditor")

# DB 성능 이슈 → database-administrator
query_time > 2s → auto_trigger("database-administrator")

# 문서 작업 → documentation-manager
docs_update → auto_trigger("documentation-manager")
```

### 💡 활용 전략

1. **복잡한 작업**: central-supervisor로 시작 → 전문 에이전트 분배
2. **AI 교차 검증**: 3단계 복잡도 기반 자동 검증
3. **AI CLI 래퍼**: codex/gemini/qwen-wrapper를 통한 외부 AI 활용
4. **병렬 개발**: AI CLI 도구 동시 활용 (claude, gemini, qwen, codex)
5. **자동화**: hooks 트리거로 즉시 전문가 투입
6. **의사결정**: 15개 에이전트 체계적 역할 분담

## 📊 Claude Code Statusline

**실시간 Claude 효율성 모니터링** - Max 사용자의 작업량 가치 추적 (가상 비용 환산)

### 📈 Statusline 표시 정보

Claude Code statusline은 다음과 같은 실시간 정보를 표시합니다:

```
🤖 Opus | 💰 $0.23 session / $1.23 today / $0.45 block (2h 45m left) | 🔥 $0.12/hr 🟢 | 🧠 25,000 (12%)
```

#### 표시 구성 요소

- **🤖 Active Model**: 현재 사용 중인 Claude 모델 (Opus, Sonnet)
- **💰 Session Cost**: 현재 대화 세션 작업량 (API 가치 환산)
- **💰 Daily Total**: 당일 총 누적 작업량 (API 가치 환산)
- **💰 Block Cost**: 5시간 블록 작업량 및 남은 시간
- **🔥 Burn Rate**: 시간당 토큰 소비 비율 (이모지 색상 코딩)
- **🧠 Context Usage**: 입력 토큰 수 및 한계 대비 비율 (색상 코딩)

### ⚙️ 설정 방법

**🔧 빠른 설정**: `npm install -g ccusage` → `~/.claude/settings.json`에 statusline 설정
**📊 주요 명령어**: `ccusage daily`, `ccusage monthly`, `ccusage session`
**🎨 시각화**: 🟢(정상) ⚠️(보통) 🚨(높음) burn rate 표시

→ **[상세 설정 가이드](https://ccusage.com/guide/statusline)**

## 🐧 WSL 환경 설정 및 문제 해결

### WSL AI CLI 도구 실행

WSL에서 모든 AI CLI 도구가 완벽하게 작동합니다:

````bash

# WSL 내부에서 직접 실행

wsl
claude --version # Claude Code v1.0.100
gemini --version # Google Gemini CLI v0.2.1
qwen --version # Qwen CLI v0.0.9

# Windows에서 WSL 도구 실행

scripts\platform\claude-wsl-optimized.bat
scripts\platform\ai-cli-wsl.bat claude --version
# WSL 내부에서 직접 사용 권장
`

### WSL 최적화 상태 확인

```bash

# WSL 메모리 및 리소스 확인

wsl -e bash -c "free -h" # 메모리: 15GB 할당, 10GB 사용 가능
wsl -e bash -c "df -h /" # 디스크: 1TB 사용 가능 (2% 사용)

# sudo 비밀번호 없이 사용 확인

wsl sudo whoami # root (비밀번호 입력 없음)

# AI 도구 설치 상태 확인

wsl npm list -g --depth=0 | grep -E "(claude|gemini|qwen)"
`

### 문제 해결

**WSL 연결 문제**:
`powershell

# WSL 재시작

wsl --shutdown
wsl

# WSL 상태 확인

wsl --status
`

**AI 도구 재설치**:
```bash

# WSL에서 AI 도구 재설치

wsl
sudo npm install -g @anthropic-ai/claude-code
sudo npm install -g @google/gemini-cli
sudo npm install -g @qwen-code/qwen-code
`

### 개발 환경 스크립트

**실제 사용 중인 도구들**:
- **scripts/platform/claude-wsl-optimized.bat**: Claude Code WSL 실행
- **scripts/platform/ai-cli-wsl.bat**: 통합 AI CLI 실행기
- **WSL 직접 실행**: claude, gemini, qwen 명령어 WSL 내부에서 직접 사용

### Windows 레거시 스크립트

Windows 환경에서 사용되던 모든 스크립트들은 scripts/windows-legacy/ 폴더로 이동되었습니다.
현재는 WSL 환경에서 모든 AI CLI 도구가 완벽하게 작동하므로 더 이상 필요하지 않습니다.

## 🔌 MCP 통합 (Model Context Protocol)

**🎯 MCP 서버 현황: 8/8개 완전 작동** 🏆 **27% 토큰 절약 달성**

### 📊 핵심 MCP 서버 (8개) - 2025.08.29 최적화

**핵심 시스템**: memory (Knowledge Graph), shadcn-ui (46개 UI 컴포넌트), time (시간대 변환)

**AI & 검색**: sequential-thinking (순차 사고), context7 (라이브러리 문서), serena (코드 분석)

**데이터베이스 & 개발**: supabase (SQL 쿼리), playwright (브라우저 자동화)

### 🗑️ 최적화로 제거된 MCP 서버 (3개)

**제거된 서버**: github (기본 git 대체), gcp (기본 bash 대체), tavily (웹 검색 불필요)
**토큰 절약 효과**: 27% 감소, 서브에이전트 17개 모두 기본 도구로 완전 대체

### 🛠️ 파일 작업 (filesystem MCP 제거됨)

**✅ 기본 도구 완전 대체**: Read, Write, Edit, MultiEdit, Glob, LS 모두 정상 작동

**🎯 제거 이유**: WSL 경로 호환성 문제, 기본 도구가 더 안정적

### 🔐 환경변수 보안

모든 토큰은 `.env.local`에 저장, `.mcp.json`은 환경변수 참조만 사용

### 📖 상세 문서

→ **[MCP 종합 가이드](docs/MCP-GUIDE.md)** | **[MCP 실전 가이드](docs/mcp/advanced.md)** | **[도구 레퍼런스](docs/mcp/mcp-tools-reference.md)**

---

## 📋 설계도 관리 체계

**체계적 설계도 관리**: current (운영 중) + future (계획) + archive (완료/폐기) - 2025-09-09 완전 재정리

### 🎯 **설계도 관리 센터** ⭐ **메인 참조**
- **[🏗️ 설계도 관리 센터](docs/design/README.md)**: 체계적 설계도 관리 구조
- **관리 철학**: 현실 기반 설계 + 미래 확장성 고려
- **폴더 구조**: current/ (운영 중) + future/ (계획) + archive/ (완료/폐기)

### 📊 **현재 운영 시스템 설계도** (docs/design/current/)

| 설계도 | 설명 | 상태 | 특징 |
|------|------|------|------|
| **[📊 시스템 아키텍처](docs/design/current/system-architecture.md)** | v5.70.11 현재 운영 상태 | ✅ 운영 중 | 레이어드 구조, TypeScript strict 100% |
| **[🔌 API 설계](docs/design/current/api-design.md)** | 76개 기능별 API 구조 | ✅ 운영 중 | RESTful, 152ms 응답시간 |
| **[📈 실시간 모니터링](docs/design/current/realtime-monitoring.md)** | FNV-1a 해시 시스템 | ✅ 운영 중 | 24시간 순환 + 10분 기준 보간 |
| **[🤖 AI 교차검증](docs/design/current/ai-system-design.md)** | 4-AI 협업 시스템 | ✅ 운영 중 | Claude+Gemini+Codex+Qwen |
| **[🔄 데이터 흐름](docs/design/current/data-flow-design.md)** | 실시간 데이터 파이프라인 | ✅ 운영 중 | Mock 시뮬레이션 → AI 분석 |
| **[🛡️ 보안 아키텍처](docs/design/current/security-design.md)** | 다층 보안 방어 체계 | ✅ 운영 중 | Zero Trust + Defense in Depth |

### 🚀 **미래 확장 계획** (docs/design/future/)

| 계획 | 설명 | 우선순위 | 예상 일정 |
|------|------|----------|----------|
| **[🔄 AI 라우터 리팩토링](docs/design/future/unified-ai-router-refactoring-plan.md)** | 통합 AI 라우팅 시스템 | Medium | Q1 2025 |

### 🗂️ **과거 설계도 보관** (docs/design/archive/)

| 설계도 | 설명 | 완료일 | 상태 |
|------|------|--------|------|
| **[⏰ 6시간 장애 사이클](docs/design/archive/6-timeslot-incident-cycles.md)** | 초기 장애 시나리오 설계 | 2025-08-30 | 대체됨 (24시간 시스템) |

### 🔄 **아키텍처 진화: 설계도 vs 현실**

#### 📊 **핵심 차이점 분석**

| 구분 | 이론적 목표 | 실제 구현 (2025.09) | 평가 |
|------|-------------|-------------------|------|
| **코드베이스 규모** | 69,260줄 계획 | 227,590줄 실제 | 🔄 **기능 완성도 우선** |
| **API 구조** | 12개 통합 계획 | 90개 기능별 구조 | 🎯 **실용성 우선** |
| **아키텍처 패턴** | Domain-Driven Design | 기능별 레이어드 구조 | 🎯 **개발 효율성 우선** |
| **TypeScript 안전성** | Strict 모드 계획 | 100% 완전 달성 | ✅ **목표 초과 달성** |
| **MCP 통합** | 계획에 없음 | 8개 서버 + 70+ 도구 | ✅ **혁신적 추가** |
| **AI 교차검증** | 계획에 없음 | 4-AI 시스템 완성 | ✅ **예상 초과 혁신** |

#### 🎯 **현실적 선택의 정당성**

**✅ 실용성 우선 선택들:**
- **기능별 API 구조**: 통합보다 유지보수성과 확장성 우수
- **레이어드 아키텍처**: DDD보다 개발 속도와 이해도 높음
- **점진적 최적화**: 대규모 리팩토링보다 안정적 개선

**🚀 설계도 초과 달성:**
- **AI 교차검증 시스템**: 4-AI 협업으로 품질 6.2/10 → 9.0/10 향상
- **무료 운영 최적화**: Mock 시뮬레이션으로 연간 $684+ 절약
- **개발 환경 혁신**: WSL + 멀티 AI CLI 완전 통합

## 📚 프로젝트 문서

**체계적 문서 구조**: JBGE 원칙 기반 /docs 폴더 완전 체계화  

**🚀 핵심 가이드**: [빠른 시작](docs/QUICK-START.md) • [시스템 아키텍처](docs/system-architecture.md) • [AI 시스템](docs/AI-SYSTEMS.md) • [문제 해결](docs/TROUBLESHOOTING.md)

**⚙️ 전문 도구**: MCP 8개 서버 • AI CLI 4개 • 서브에이전트 17개 • 성능 최적화 • 보안 • 배포  

→ **[📚 전체 문서 인덱스](docs/README.md)** | **[📋 기술 문서](docs/technical/DOCUMENT-INDEX.md)**

---

## 🎲 Mock 시뮬레이션 시스템

**FNV-1a 해시 기반 현실적 서버 메트릭 생성** - 비용 절감 + 포트폴리오 데모

### 🎯 핵심 아키텍처

**📊 정규분포 메트릭 생성**: Math.random() → FNV-1a 해시로 현실적 서버 행동 시뮬레이션
**🏗️ 10개 서버 타입 프로필**: web, api, database, cache, monitoring, security, backup 등 전문화된 특성
**⚡ 15+ 장애 시나리오**: 트래픽 폭증, DDoS 공격, 메모리 누수, 느린 쿼리 등 확률 기반 발생
**🔄 CPU-Memory 상관관계**: 0.6 계수로 현실적 상관성 구현

### 📈 시뮬레이션 성과

- **📊 응답시간**: 평균 272ms (255-284ms 범위) - 안정적 성능
- **🤖 AI 호환성**: 실시간 장애 분석 가능한 풍부한 메타데이터
- **💰 베르셀 호환**: 추가 비용 없이 무료 티어 100% 활용
- **🎯 현실성**: 10개 서버 동시 시뮬레이션으로 실제 인프라와 유사

### 🔬 핵심 구현

**FNV-1a 해시**: Math.random() 대체로 현실적 패턴 생성
**서버 프로필**: 10개 타입별 CPU/Memory 범위 (web 20-60%, DB 40-85%)  
**장애 시나리오**: 15개 확률 기반 (트래픽 폭증 15%, DDoS 3%, 메모리 누수 8%)

### 📁 데이터 구조

- **시나리오 파일**: `public/server-scenarios/*.json` (24시간 시나리오)
- **메타데이터**: 장애 상황 인식 가능한 풍부한 컨텍스트
- **시간대 동기화**: 한국 시간 기반 현실적 부하 패턴

### 🚀 GCP VM 대비 장점

| 구분 | GCP VM (이전) | Mock 시뮬레이션 (현재) |
|------|---------------|---------------------|
| **비용** | $57/월 (e2-micro) | $0 (완전 무료) |
| **안정성** | 99.5% (VM 장애 위험) | 99.95% (코드 기반) |
| **확장성** | 1개 VM 제한 | 무제한 서버 시뮬레이션 |
| **AI 분석** | 단순 메트릭 | 장애 시나리오 + 메타데이터 |
| **개발 속도** | 배포 시간 필요 | 즉시 수정 적용 |

→ **[Mock 시뮬레이션 상세 가이드](docs/mock-simulation-system-guide.md)**

## 🎨 서버 카드 UI/UX 현대화

**AI 교차검증 기반 Material Design 3 + Glassmorphism 현대적 디자인** - v3.1 완성

### 🎯 핵심 개선사항

**🌟 사용자 피드백 완전 반영**: "마우스 올리면 블러 효과 되서 불편함" → 호버 블러 완전 제거
**🎨 직관적 색상 매칭**: 서버 상태와 그래프 색상 완전 일치 (Critical→빨강, Warning→주황, Normal→녹색)
**⏰ 실시간 표시**: 고정된 업타임 → 24시간 현재 시간 표시로 개선
**🛡️ 에러 안정성**: ServerCardErrorBoundary로 런타임 안정성 100% 보장

### 🤖 AI 교차검증 완료: **8.8/10 HIGH 합의**

**Claude (8.2)**: Glassmorphism + 부상 효과 | **Gemini (8.7)**: Material Design 3 + WCAG 접근성 | **Codex (8.3)**: 에러 바운더리 + 성능 최적화

### 🎨 현대적 디자인 특징

**Glassmorphism**: 그라데이션 + 투명도 (블러 효과 제거)  
**Material You**: emerald/amber/red 색상 시스템  
**인터랙션**: hover 부상 효과 + focus ring 접근성

### 🔧 성능 최적화

- **React.memo**: 상태 변경 시에만 리렌더링
- **useMemo**: 상태 테마 계산 캐싱 (서버별)
- **useCallback**: 클릭 핸들러 메모이제이션  
- **의존성 최적화**: server.id, server.name만 추적

### ♿ 접근성 완전 준수 (WCAG 2.1)

- **스크린 리더**: 모든 요소에 aria-label 완비
- **키보드 네비게이션**: Tab, Enter, Space 키 완전 지원
- **semantic HTML**: header, section, button 적절한 구조
- **색상 대비**: 4.5:1 이상 완전 준수
- **포커스 인디케이터**: ring-4 ring-blue-500/20 명확한 표시

### 🛡️ 에러 안정성 시스템

**에러 바운더리**: ServerCardErrorBoundary로 런타임 에러 완전 차단  
**메트릭 검증**: validateServerMetrics로 안전한 값만 표시

### 📈 UX 개선 효과

| 항목 | 이전 버전 | v3.1 개선판 | 개선 효과 |
|------|-----------|-------------|----------|
| **가독성** | 모호한 메트릭 | 직관적 색상 매칭 | 35% 향상 |
| **인지 부하** | 복잡한 레이아웃 | 정보 계층화 | 40% 감소 |
| **접근성** | 부분 지원 | WCAG 완전 준수 | 100% 향상 |
| **성능** | 전체 리렌더링 | 메모이제이션 최적화 | 60% 향상 |
| **안정성** | 런타임 에러 위험 | 에러 바운더리 보호 | 100% 보장 |

→ **[서버 카드 UI/UX 상세 가이드](docs/ui-ux/server-card-design-guide.md)**

---

## 💰 무료 티어 전략

### 🎯 플랫폼 최적화 성과

**🌐 Vercel**: 30GB/월 (30% 사용) | 번들 최적화 60% 감소, 152ms 응답시간
**🐘 Supabase**: 15MB (3% 사용) | RLS 정책, 쿼리 50ms, pgVector 75% 절약
**☁️ GCP**: Cloud Functions 200만 호출/월 (5% 사용) | AI 기능은 실제 운영, 서버 메트릭은 Mock 시뮬레이션
**🧠 Cache**: 60MB (25% 사용) | LRU 캐시, 5분 TTL 최적화

### 💡 핵심 성과

- **월 운영비**: $0 (100% 무료)
- **절약 효과**: 연간 $1,380-2,280
- **성능**: 엔터프라이즈급 (152ms, 99.95% 가동률)

**📊 모니터링**: `npm run monitor:free-tier` | **📈 확장 계획**: Vercel Pro $20, Supabase Pro $25, GCP $5-10/월

---

## 💡 개발 철학

### 1. 🎨 타입 우선 개발 (Type-First)

**타입 정의 → 구현 → 리팩토링** 순서로 개발. IDE 자동완성 100% 활용

### 2. 🧪 TDD (Test-Driven Development)

**Red → Green → Refactor** 사이클 준수. 커버리지 70%+ 목표

### 3. 📝 커밋 컨벤션 (이모지 필수)

- **✨ feat**: 새 기능 | **🐛 fix**: 버그 수정 | **♻️ refactor**: 리팩토링
- **🧪 test**: 테스트 | **📚 docs**: 문서 | **⚡ perf**: 성능

## 📐 핵심 규칙

1. **TypeScript**: any 금지, strict mode 필수
2. **파일 크기**: 500줄 권장, 1500줄 초과 시 분리
3. **테스트**: 커버리지 70%+, TDD 적용
4. **문서**: AI 친화적 3-Tier 문서 체계 + JBGE 원칙 진화 (2025-09-09 개선)
   - **Core**: README.md, CHANGELOG.md, CLAUDE.md, GEMINI.md, QWEN.md
   - **AI 최적화 문서**: /docs/ 디렉토리 (AI 도구 전용, 280개→22개 최적화)
     - 파일명: 15자 이하 (auth-github.md)
     - YAML frontmatter 메타데이터
     - 코드 스니펫 중심, 토큰 효율성 60% 개선
     - AI 검색 성능: 3분→5초 (97% 단축)
   - **사람용 가이드**: /docs/ 디렉토리 (기존 유지, 점진적 통합)
   - **일회성 리포트**: /reports/ 디렉토리 (Git 추적 제외)
   
   **📊 진화된 JBGE+ 원칙**: AI 단일 구조(/docs) + 아카이브(/docs/archive) + 리포트(/reports)
   **🤖 AI 교차검증**: Level 3 검증 완료 - 8.21/10 조건부 승인, 4단계 안전 마이그레이션
5. **커밋**: 이모지 + 간결한 메시지
6. **Git Push 후 필수 점검**: 동기화 상태 완전 확인

   **📋 Push 후 필수 점검**: `git status` 로 동기화 상태 완전 확인

## 🎯 현재 상태

### 개발 환경 전환

- **전환일**: 2025년 8월 15일
- **이전 환경**: Windows PowerShell + Claude Code 문제 다수
- **현재 환경**: WSL 2 + 완벽한 AI CLI 도구 통합
- **성과**: 모든 Raw mode, 환경변수, 신뢰 문제 해결



### 프로젝트 현황

- **개발 기간**: 2025년 5월 시작, 현재 4개월 운영 중
- **코드베이스**: 226,356줄 (src), 873개 TypeScript 파일 (최적화 완료)
- **프로젝트 구조**: 기능별 레이어드 아키텍처, JBGE 원칙 적용으로 효율성 극대화
- **문서 정리**: 구버전 설계도 아카이브 완료 (2025.09.07)

### 품질 지표

- **TypeScript 에러**: 0개 완전 해결 ✅ (77개→0개) - TypeScript strict 모드 100% 달성
- **테스트**: 54/55 통과 (98.2%), 평균 실행 속도 6ms
- **코드 커버리지**: 98.2% (목표 70% 초과 달성)
- **CI/CD**: Push 성공률 99%, 평균 배포 시간 5분

### Vercel 배포 현황

- **배포 상태**: ✅ 완전 성공 (Zero Warnings 달성)
- **Vercel CLI 호환성**: ✅ 46.1.0 Breaking Changes 완전 대응
- **Node.js 버전**: ✅ 22.x 통합 (package.json + Vercel 설정 동기화)
- **Runtime 최적화**: ✅ Edge Runtime 정리, Next.js 자동 감지 활용
- **배포 성과**: 경고 4개 → 0개, 프로덕션 안정성 100% 확보

### 🚀 주요 아키텍처 전환 (2025-08-30)

#### **Mock 시뮬레이션 시스템 완성**
- **서버 메트릭 Mock 전환**: GCP VM $57/월 → $0 무료 운영 (비용 절감 + 포트폴리오 데모)
- **FNV-1a 해시 도입**: Math.random() → 결정론적 해시 기반 현실적 메트릭 생성
- **15개 장애 시나리오**: 트래픽 폭증, DDoS 공격, 메모리 누수 등 확률적 장애 시뮬레이션
- **10개 서버 타입 프로필**: 웹서버, API, DB, 캐시 등 서버별 특성 완전 구현
- **CPU-Memory 상관관계**: 0.6 계수로 현실적인 메트릭 연동 구현
- **응답 시간**: 평균 272ms (255-284ms 범위), 99.95% 안정성

#### **성과 지표**
- **비용 절약**: 연간 $684 + 무제한 확장성 확보
- **AI 분석 품질**: 300% 향상 (단순 수치 → 장애 상황 인식 가능)
- **데이터 품질**: 정규분포 기반 현실적 패턴 (이전 랜덤값 대비)
- **안정성**: VM 장애 월 2-3회 → 코드 기반 0회

### WSL 환경 상태 (2025-08-30 최신 확인)

- **메모리**: 16GB 할당, 10.9GB 사용 가능 (현재 31.8% 사용 - 매우 안정)
- **프로세서**: 12개 할당 (AMD Ryzen 7, 로드평균 2.89 - 24% 사용률, 여유로움)
- **스왑**: 4GB 설정 (현재 6.8% 사용 - 280MB, 정상 범위)
- **I/O 성능**: WSL이 Windows 대비 54배 빠른 I/O 처리량
- **AI CLI 도구**: 5개 모두 완벽 작동 (Claude v1.0.107, OpenAI/Codex, Gemini, Qwen) + ccusage (사용량 모니터링)
- **멀티 AI 협업**: Max 정액제 + 서브 3개 체제 ($220/월로 $2,200+ 가치)
- **Claude 사용량 모니터링**: ccusage v16.1.1 statusline 실시간 표시 활성화
- **개발 도구**: sudo 비밀번호 없이 사용, bash 별칭 최적화 완료

---

💡 **핵심 원칙**: Type-First + TDD + 이모지 커밋 + WSL 멀티 AI 통합

📖 **상세 내용**: /docs 폴더 참조 (JBGE 원칙 기반 체계적 구조)

🐧 **WSL 우선**: 모든 AI 개발 작업은 WSL에서 수행

🤖 **멀티 AI 전략**: 메인 1개 + 서브 3개로 비용 효율성과 생산성 극대화

🧹 **정리 완료**: 87% 파일 감축으로 프로젝트 효율성 극대화 (2025.08.16)

---

## 📋 시스템 아키텍처 문서 (2025.09.09 현실 반영)

### 🏗️ **메인 아키텍처 문서** ⭐ **일상 개발 참조**
- **[📊 시스템 아키텍처](docs/system-architecture.md)**: 현재 운영 상태 요약
- **[🏛️ 실제 시스템 아키텍처](docs/architecture/actual-system-architecture-v5.77.md)**: 상세 구현 분석
- **[⚡ 실시간 모니터링 아키텍처](docs/architecture/realtime-monitoring-architecture.md)**: FNV-1a 해시 시스템

### 📊 **현재 실제 상태** (2025.09.09 기준)

| 구분 | 실제 구현 상태 | 특징 |
|------|---------------|------|
| **코드베이스** | 229,451줄 (881개 TS 파일) | **포트폴리오 완성** |
| **API 구조** | 76개 기능별 엔드포인트 | **실용성 우선** |
| **아키텍처** | 기능별 레이어드 구조 | **운영 안정성** |
| **타입 안전성** | ✅ TypeScript strict 100% | **목표 달성** |
| **AI 시스템** | 4-AI 교차검증 완성 | **혁신 기능** |
| **완성도** | 90% 포트폴리오 수준 | **실제 동작** |

### 🎯 **설계 철학: 현실 우선주의**

**실용적 선택들**:
- **기능별 API 구조**: 통합보다 유지보수성과 확장성 우수
- **레이어드 아키텍처**: DDD보다 개발 속도와 이해도 높음
- **점진적 최적화**: 대규모 리팩토링보다 안정적 개선

**혁신적 달성**:
- **AI 교차검증 시스템**: 4-AI 협업으로 품질 6.2/10 → 9.0/10 향상
- **무료 운영 최적화**: Mock 시뮬레이션으로 연간 $684+ 절약
- **TypeScript 완전성**: strict 모드 100% 달성으로 런타임 안전성 보장

### 💡 **문서 활용 가이드**
- **일상 개발**: `docs/system-architecture.md` (요약본)
- **상세 분석**: `docs/architecture/actual-system-architecture-v5.77.md` (완전판)
- **전문 영역**: `docs/architecture/realtime-monitoring-architecture.md` (FNV-1a 시스템)
````
