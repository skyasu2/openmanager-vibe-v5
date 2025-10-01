# CLAUDE.md

**한국어로 우선 대화, 기술용어는 영어 사용허용**

**Claude Code 프로젝트 가이드** | [공식 문서](https://docs.anthropic.com/en/docs/claude-code)

## 🎯 프로젝트 개요

**OpenManager VIBE**: AI 기반 실시간 서버 모니터링 플랫폼

- **아키텍처**: Next.js 15+ + React 18+ + TypeScript (strict) + Vercel + Supabase
- **데이터 시스템**: StaticDataLoader (v5.71.0) - 99.6% CPU 절약, 92% 메모리 절약
- **무료 티어**: 100% 무료로 운영 (Vercel/Supabase 무료 계정 최적화)
- **AI 시스템**: Claude Code 중심 + 3-AI 협업 (Gemini + Codex + Qwen) 교차검증 시스템

## 💻 개발 환경 (Development)

**WSL 2 (Ubuntu) 중심 개발** 🐧
- **Host**: Windows + WSL 2 (최적화된 메모리/스왑 설정)
- **Shell**: bash (WSL), Node.js v22.19.0 LTS, npm v11.6.0 전역 관리
- **AI 도구**: Claude Code + Gemini CLI + Qwen CLI
- **성능**: Linux 네이티브, MCP 서버 통합, 빠른 I/O
- **보조**: VSCode + GitHub Copilot (이미지 처리, 스크린샷)
- **🛠️ WSL 모니터링**: WSL 성능 및 MCP 서버 상태 실시간 추적 도구

## 🐧 WSL 2 최적화 현황 (Development)

**성능**: 최적화된 메모리 설정, 빠른 I/O, JavaScript heap 안정성
**도구**: Claude/Gemini/Qwen CLI 모두 정상 작동
**메모리**: 단계적 메모리 할당 프로필 지원
**모니터링**: WSL 리소스 및 MCP 서버 상태 실시간 추적

### 🛠️ WSL 개발 도구

```bash
# WSL 시스템 모니터링 (개발 전용)
./scripts/wsl-monitor/wsl-monitor.sh --once        # 1회 스캔
./scripts/wsl-monitor/wsl-monitor.sh --daemon      # 백그라운드 모니터링
./scripts/emergency-recovery.sh                    # 응급 복구 도구

# 문제 분석용 특화 체크
./scripts/wsl-monitor/wsl-monitor.sh --check-mcp   # MCP 서버 전용 분석
./scripts/wsl-monitor/wsl-monitor.sh --check-processes  # 프로세스 집중 분석
```

→ **[상세 분석](docs/development/wsl-optimization-analysis-report.md)** | **[메모리 가이드](MEMORY-REQUIREMENTS.md)** | **[WSL 모니터링 가이드](docs/troubleshooting/wsl-monitoring-guide.md)**

## 🚀 빠른 시작

```bash
# Windows에서 WSL Claude 시작
.\claude-wsl-optimized.bat

# WSL 내부 개발 명령어 - 2025-09-21 업데이트 ⭐
npm run dev:stable   # 안정화된 개발 서버 (권장) - devtools 버그 해결
npm run dev          # 기본 개발 서버 (호환성 유지)
npm run dev:clean    # 완전 정리된 개발 서버 (텔레메트리 비활성화)
npm run dev:playwright # Playwright 테스트 전용 개발 서버
npm run validate:all # 린트+타입+테스트
claude --version     # 버전 확인 (v2.0.1)

# Claude Code v2.0 신규 기능 (2025-09-30 업데이트) 🆕
/rewind              # 코드 변경 취소 (Esc 두 번으로도 가능)
/usage               # 플랜 사용량 확인 (Max 20x 한도 추적)
Ctrl-R               # 히스토리 검색 (이전 대화 빠르게 찾기)
Tab                  # thinking 모드 토글 (세션 간 유지)
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
- **내용**: 15개 Claude 서브에이전트 (codex-specialist, gemini-specialist, qwen-specialist 등)
- **위치**: docs/claude/ 디렉토리 (문서 체계)

**⚠️ 중요**: 각 파일은 완전히 다른 AI 시스템을 위한 것입니다!

## 🤖 OpenManager VIBE 애플리케이션 AI 엔진

**2-AI 모드 시스템**: 사용자가 애플리케이션에서 직접 사용하는 AI 기능

### 🎯 애플리케이션 AI 모드 구성

| AI 모드 | 설명 | 기술 스택 | 비용 | 용도 |
|---------|------|----------|------|------|
| **LOCAL** | 로컬 AI 엔진 | GCP Functions + Supabase RAG | 무료 | 기본 쿼리, 빠른 응답 |
| **GOOGLE_AI** | Google AI | Gemini 2.5 모델군 (Flash-Lite/Flash/Pro) | 무료/유료 | 자연어 질의, 고급 추론 |

### 🏗️ 핵심 아키텍처

```typescript
// 애플리케이션 내부 AI 엔진 구조
class UnifiedAIEngineRouter {
  // LOCAL 모드: GCP Functions + Supabase RAG (완전 독립)
  private gcpEngine: GCPQueryEngine;
  private ragEngine: SupabaseRAGEngine;

  // GOOGLE_AI 모드: Google Gemini API (완전 독립)
  private googleAIService: GoogleAIService;
}

// 사용자 인터페이스
type AIMode = 'LOCAL' | 'GOOGLE_AI';
```

### ✅ 독립성 확보 (사용자 요구사항 충족)

- **RAG 모드**: Supabase 벡터 검색만 사용, Google AI 의존성 완전 제거 ✅
- **Google AI 모드**: Gemini API만 사용, 완전 독립적 동작 ✅
- **자연어 질의**: Google AI 모드 전용 ✅
- **기타 기능**: LOCAL 모드만 사용 ✅
- **비용 효율**: LOCAL 모드 100% 무료, GOOGLE_AI 모드만 유료 ✅

### 📊 Google AI API 무료 티어 제한사항 (2025-09-23 최신)

**모델별 무료 사용량**:
- **Gemini 2.5 Flash-Lite**: RPM 15, RPD 1,000 ⭐ **권장** (가장 관대한 제한)
- **Gemini 2.5 Flash**: RPM 10, RPD 250 (균형잡힌 성능)
- **Gemini 2.5 Pro**: RPM 5, RPD 100 (고성능, 제한적)

**실제 사용 가이드**:
- **개발/테스트**: Flash-Lite 모델로 충분 (RPD 1,000)
- **프로덕션**: 유료 티어 권장 (무제한 사용량)
- **분당 제한**: RPM 한도 주의 (짧은 시간 내 여러 요청 시)

### 🔗 관련 파일
- `src/services/ai/UnifiedAIEngineRouter.ts` - 메인 AI 라우터
- `src/services/ai/SimplifiedQueryEngine.ts` - 쿼리 처리 엔진
- `src/services/ai/QueryDifficultyAnalyzer.ts` - 모델 자동 선택 로직
- `src/types/ai-types.ts` - AI 모드 타입 정의
- `src/components/ai/AIModeSelector.tsx` - UI 모드 선택기

### ⚡ 두 AI 시스템의 명확한 구분

| 구분 | 🤖 **애플리케이션 AI 엔진** | 🛠️ **개발 도구 AI CLI** |
|------|---------------------------|------------------------|
| **목적** | 사용자가 앱에서 사용 | 개발자가 코딩할 때 사용 |
| **위치** | OpenManager VIBE 내부 | WSL 환경 CLI 도구 |
| **AI 수** | 2개 모드 (LOCAL, GOOGLE_AI) | 4개 도구 (Claude, Codex, Gemini, Qwen) |
| **동작** | 앱 UI에서 모드 선택 | 터미널에서 직접 실행 |
| **예시** | "서버 상태 분석해줘" | `codex exec "코드 리뷰해줘"` |
| **사용자** | 최종 사용자 | 개발자 (나) |

**🎯 핵심 차이점**:
- **애플리케이션 AI**: 제품에 내장된 기능 (최종 사용자용)
- **개발 도구 AI**: 코딩 작업 보조 도구 (개발자용)

---

## 🛠️ 개발 도구 AI CLI 통합 (WSL 환경)

### 설치된 AI CLI 도구들

| 도구                  | 버전    | 요금제              | 역할 구분                   | WSL 실행                   | Windows 네이티브           | 최근 업데이트 |
| --------------------- | ------- | ------------------- | --------------------------- | -------------------------- | -------------------------- | ------------- |
| **Claude Code**       | **v2.0.1** 🆕 | Max ($200/월) | 🏆 **메인 개발 환경**       | WSL 직접 실행 | ✅ 완벽 지원                | **2025-09-30 메이저 업데이트** |
| **OpenAI CLI (Codex)** | **v0.42.0** 🆕 | Plus ($20/월)       | 🤝 **직접 CLI 실행** ✅ | `codex exec` | ✅ **GPT-5 실무 통합 전문가**   | **2025-09-30 수동 패치** |
| **Google Gemini CLI** | **v0.6.1** | 무료 (60 RPM/1K RPD)   | 👨‍💻 **직접 CLI 실행** ✅ | `gemini` | ✅ **아키텍처 + 디자인 시스템** | **2025-09-25 대폭 업그레이드** |
| **Qwen Code**         | **v0.0.14** 🆕 | 무료 (60 RPM/2K RPD)   | 🔷 **설정 최적화 강화** ✅ | `timeout 60 qwen -p`   | ✅ **성능 + 보안 최적화**    | **2025-09-30 수동 패치** |
| **ccusage**           | **v17.1.0** 🆕 | 무료                | 📊 **Claude 사용량 모니터링** | npx ccusage daily          | ✅ npx 실행 전용            | **2025-09-30 최신 업데이트** |

> ✅ **2025-09-30 최신 업데이트**: **AI CLI 도구 메이저 업데이트 완료**. Claude Code v2.0.1 (메이저 업데이트), Codex CLI v0.42.0 (수동 패치), Qwen CLI v0.0.14 (수동 패치), ccusage v17.1.0 업그레이드. Gemini CLI v0.6.1은 최신 버전 유지. 베스트 프랙티스 기반 서브에이전트 최적화 적용.

### WSL 통합 실행

```bash
# WSL 접속 및 프로젝트 이동
wsl
cd /mnt/d/cursor/openmanager-vibe-v5

# AI 도구들 직접 CLI 실행 (2025-09-30 업데이트)
claude --version               # Claude Code v2.0.1 버전 확인
codex exec "작업 요청"         # Codex CLI v0.42.0 직접 실행 (27초)
gemini "작업 요청"             # Gemini CLI v0.6.1 직접 실행 (즉시)
timeout 60 qwen -p "작업 요청" # Qwen CLI v0.0.14 Plan Mode (안전한 코드 계획) 🆕
npx ccusage daily              # ccusage v17.1.0 일일 사용량 (npx로만 실행)

# Qwen CLI Plan Mode 사용법 (v0.0.14 신규) 🆕
qwen -p "기능 구현 계획"       # Plan Mode: 실행 전 안전한 계획 수립
qwen -p "리팩토링 전략"        # EditCorrector 버그 수정으로 안정성 향상
# Plan Mode는 코드 실행 전에 계획을 먼저 세우는 안전한 방식

# 🐧 WSL 환경변수 네이티브 사용 (cross-env 대안)
export NODE_ENV=development    # cross-env 대신 WSL 네이티브 방식
export DEBUG=true              # 환경변수 직접 설정
npm run dev:stable             # 병렬 개발 패턴 권장

# 🔧 베르셀 CLI 통합 (환경변수 토큰 기반)
source .env.local && vercel --version  # 베르셀 CLI 버전 확인
source .env.local && vercel whoami --token $VERCEL_TOKEN  # 인증 상태 확인
```

### 🚀 WSL + Claude Code 병렬 개발 패턴 (2025-09-28 최적화)

**성능 향상 달성**:
- **개발 서버 시작**: 32초 → 22초 (**35% 단축**)
- **테스트 실행**: 37.95초 → 21.08초 (**44% 단축**)
- **E2E 성공률**: 98.2% 달성 (Vercel 실제 환경)

```bash
# 🎯 권장 워크플로우
# Terminal 1: 백그라운드 개발 서버
npm run dev:stable &          # 안정화된 개발 서버 백그라운드 실행

# Terminal 2: Claude Code 메인 작업
claude                        # Claude Code 실행

# Terminal 3: 보조 AI CLI 도구
codex exec "코드 리뷰"        # Codex 병렬 실행
gemini "아키텍처 검토"        # Gemini 병렬 실행

# 🧪 빠른 검증 (필요시)
npm run test:super-fast       # 11초 빠른 테스트
npm run test:vercel:e2e       # Vercel 환경 E2E 테스트
```

## 🎯 환경별 검증 체계 (Environment-Specific Verification)

**핵심 원칙**: **"변경 범위 = 검증 범위"** - AI 교차검증 결과 기반 (96.4% 성능 개선) ⭐

### 🏗️ 3-Layer 환경 구조

| 환경 | 역할 | 검증 대상 | 검증 방법 | 예상 시간 |
|------|------|----------|----------|----------|
| **🐧 개발 환경 (WSL)** | 개발 도구 관리 | AI CLI 도구, Node.js, WSL 환경 | CLI 검증 스크립트 | 0.4초 |
| **🌐 배포 환경 (Frontend)** | 프론트엔드 배포 | Vercel, Next.js, React 컴포넌트 | E2E 테스트 (Vercel 환경) | 8분 |
| **⚙️ 배포 환경 (Backend)** | 백엔드 서비스 | GCP Functions, Supabase PostgreSQL | API 통합 테스트 | 2분 |

### ✅ 올바른 검증 방법 매트릭스

#### 🐧 **개발 환경 (WSL) 검증**

**검증 대상**: AI CLI 도구 업그레이드, Node.js 버전 변경, WSL 설정 변경

```bash
# ✅ 올바른 개발 환경 검증
npm run verify:ai-cli      # AI CLI 도구 검증 (0.4초)
npm run verify:fast        # 성능 개선 메시지 포함
claude --version           # Claude Code 버전 확인
node --version             # Node.js 환경 확인
```

**검증하지 말아야 할 것**:
- ❌ 애플리케이션 유닛 테스트 (`npm run test`)
- ❌ E2E 테스트 (`npm run test:e2e`)
- ❌ Vercel 배포 테스트

#### 🌐 **배포 환경 (Frontend - Vercel) 검증**

**검증 대상**: Next.js 코드 변경, React 컴포넌트 수정, UI/UX 개선

```bash
# ✅ 올바른 프론트엔드 배포 검증
npm run test:vercel:e2e     # Vercel 환경 E2E 테스트 (18개)
npm run test:vercel         # 프로덕션 환경 테스트
npm run lighthouse:vercel   # 베르셀 환경 성능 측정
```

#### ⚙️ **배포 환경 (Backend - GCP/Supabase) 검증**

**검증 대상**: API Routes 변경, 데이터베이스 스키마 변경, 서버리스 함수 수정

```bash
# ✅ 올바른 백엔드 배포 검증
npm run test:integration    # API 통합 테스트 (GCP Functions + Supabase)
npm run test:api           # API Routes 검증
npm run db:test            # 데이터베이스 쿼리 테스트
```

### ❌ 잘못된 검증 사례 (AI 교차검증 결과)

**문제 상황**: AI CLI 도구 업그레이드 후 애플리케이션 테스트 실행

```bash
# ❌ 잘못된 접근 (기존 방식)
# AI CLI 도구 업그레이드 후...
npm run test:super-fast     # 64개 유닛 테스트 실행 (11초)
# → 검증 대상과 방법이 불일치 (범주 오류)
```

**AI 전문가 평가**:
- **Codex (실무)**: 3/10점 - "VSCode 업데이트 후 애플리케이션 테스트"와 동일한 오류
- **Gemini (아키텍처)**: 4/10점 - 개발 도구 레이어와 애플리케이션 레이어 혼재
- **Qwen (성능)**: 9.8/10점 - 96.4% 성능 개선 기회 발견

### 🚀 개선된 검증 프로세스

```bash
# ✅ 개선된 방식 (신규)
# AI CLI 도구 업그레이드 후...
npm run verify:ai-cli       # 0.4초 (96.4% 성능 개선)
# → 정확한 검증 대상과 방법 일치
```

**성능 비교**:
- **기존**: 11초 (불필요한 애플리케이션 테스트)
- **개선**: 0.4초 (정확한 AI CLI 검증)
- **개선률**: **96.4% 성능 향상** ⚡

### 💡 핵심 가이드라인

1. **🎯 변경 범위 원칙**: 변경한 레이어만 검증
2. **⚡ 효율성 우선**: 불필요한 검증 방지
3. **🔄 환경 분리**: 개발/배포 환경 엄격 구분
4. **📊 성능 추적**: 검증 시간 및 효과 측정

---

## 🧪 Vercel 중심 테스트 전략

**핵심 철학**: **"로컬보다 실제 Vercel 환경에서 직접 테스트가 더 효과적"** 🎯

### 📊 현재 테스트 현황 (2025-09-28 최신)
- **유닛 테스트**: 64개 테스트 **100% 통과** (11.72초, 메트릭 검증 시스템 완벽)
- **E2E 테스트**: 베르셀 실제 환경, 핵심 API 정상 작동 (일부 타임아웃 개선 필요)
- **API 테스트**: 대시보드 데이터 API, AI 쿼리 API (LOCAL 모드) 정상 작동
- **보안 테스트**: 권한 시스템, PIN 인증 (환경변수 ADMIN_PASSWORD) 완벽 작동
- **성능 테스트**: **FCP 608ms**, **응답시간 532ms**, Core Web Vitals 실측 (2025-09-28 업데이트)
- **성능 최적화**: **44% 테스트 시간 단축** (37.95초 → 21.08초)
- **개발 서버 최적화**: **35% 시작 시간 단축** (32초 → 22초)

### 🎯 테스트 우선순위
1. **🔴 High Priority**: Vercel E2E 테스트 (실제 운영 환경)
2. **🟡 Medium Priority**: API Routes 실제 성능 테스트
3. **🔵 Low Priority**: 로컬 Unit 테스트 (필요시에만)

### 🚀 실행 방법
```bash
# Vercel 환경 통합 테스트
npm run test:vercel:full    # 종합 프로덕션 테스트
npm run test:vercel:e2e     # E2E 테스트 (실제 환경)
npm run test:vercel         # 프로덕션 테스트

# 1인 AI 개발 최적화 테스트 (2025-09-24 업데이트) ⭐
npm run test:ai             # 1인 AI 개발 기본 (Vercel 실제 환경)
npm run test:super-fast     # 가장 빠른 테스트 (11초)
npm run test:fast           # 최적화된 멀티스레드 테스트 (21초, 44% 성능 향상)
npm run test:dev            # 병렬 개발 테스트 (quick + vercel)

# 보조적 로컬 테스트
npm run test                # Vitest (필요시에만)
npm run test:e2e            # 로컬 Playwright (개발용)
```

### ⚡ 테스트 성능 최적화 (2025-09-24) 🎯

**AI 교차검증 결과 기반 최적화 완료**:
- **Codex 실무 분석**: 테스트 피라미드 문제 → 1인 AI 개발에는 적절
- **Gemini 아키텍처**: Integration-First 패턴 → 혁신적 접근 인정
- **Qwen 성능 최적화**: 단 1줄 수정으로 44% 성능 향상 달성

**최적화 성과**:
- **멀티스레드 활성화**: `singleThread: false` (config/testing/vitest.config.main.ts)
- **성능 개선**: 37.95초 → 21.08초 (**44% 단축** ✅)
- **일일 개발 효율**: 테스트 대기시간 16.87초 절약
- **월간 효과**: 약 6시간 절약 (개발자 시간 $300 가치)

**1인 AI 개발 맞춤 전략**:
```bash
# 🤖 기본 워크플로우
npm run test:ai          # Vercel 실제 환경 (핵심 가치)
npm run test:super-fast  # 빠른 개발 검증 (11초)

# 🧠 AI 교차검증 (Unit 테스트 대체)
"codex: 이 로직 문제있나 검증해줘"
"gemini: 구조적 개선점 있나 확인"
"qwen: 성능 병목점 분석해줘"
```

### ✅ Vercel 중심 접근법의 장점
- **환경 일치**: 테스트 환경 = 운영 환경
- **실제 성능**: Edge Functions, CDN, 실제 네트워크 레이턴시 반영
- **무료 티어 검증**: 실제 사용량 기반 제한 테스트
- **개발 효율성**: Mock 설정 불필요, 디버깅 시간 단축

---

## 🔌 MCP & 베르셀 통합

### 📊 MCP 현황: 9/9개 연결, 완벽 작동 🎉 (2025-09-30 업데이트)

| MCP 서버 | 연결 | WSL 성능 | 기능 테스트 | 상태 |
|----------|------|----------|-------------|------|
| **🎉 vercel** | ✅ | ✅ 즉시 응답 | ✅ 재인증 완료, 배포 관리 | **완전 작동** ⭐ |
| **🎉 serena** | ✅ | ✅ 즉시 응답 | ✅ 프로젝트 분석, 코드 탐색 | **완전 작동** |
| **🎉 supabase** | ✅ | ✅ 즉시 응답 | ✅ SQL 실행, 테이블 관리 | **완전 작동** |
| **🎉 context7** | ✅ | ✅ 즉시 응답 | ✅ 라이브러리 문서 조회 | **완전 작동** |
| **🎉 playwright** | ✅ | ✅ 즉시 응답 | ✅ WSL Sandbox E2E 테스트 | **완전 작동** |
| **🎉 memory** | ✅ | ✅ 즉시 응답 | ✅ 지식 그래프 관리 | **완전 작동** |
| **🎉 time** | ✅ | ✅ 즉시 응답 | ✅ 시간대 변환 | **완전 작동** |
| **🎉 sequential-thinking** | ✅ | ✅ 즉시 응답 | ✅ 사고 프로세스 | **완전 작동** |
| **🎉 shadcn-ui** | ✅ | ✅ 즉시 응답 | ✅ UI 컴포넌트 조회 | **완전 작동** |

**성능 지표 (2025-09-30)**:
- **연결 성공률**: 100% (9/9) 🏆 **완벽 달성**
- **평균 응답속도**: 50ms 미만
- **안정성**: 99.9% 가동률
- **WSL 메모리**: 20GB 할당 (19GB → 20GB 업그레이드)

### 🚀 20GB WSL 최적화 성과 (2025-09-30 업데이트) ⭐

**메모리 현황**: 20GB 할당 (19GB → 20GB 업그레이드), 17GB 사용 가능 (85% 여유도)
**MCP 상태**: 9/9 완벽 연결 (Vercel 재인증 완료) 🎉
**프로세스 현황**: MCP/AI 관련 프로세스 17개 안정 실행
**성능 개선**: 평균 응답 50ms 유지 (최적화 상태)
**안정성**: 100% 연결 성공률 (9/9개 MCP 서버) 🎯 **완벽 달성**
**도구 버전**: Claude v2.0.1, Node.js v22.19.0, npm v11.6.0

### ⚠️ WSL 설정 변경 시 주의사항 (필수)

#### 🔒 변경 금지 설정
```ini
# ⚠️ 절대 변경하지 말 것 - MCP 서버 크래시 위험
dnsTunneling=true     # MCP DNS 해석 필수
autoProxy=true        # MCP 프록시 연결 필수
memory=20GB          # 최소 16GB, 권장 20GB (2025-09-30 업그레이드)
networkingMode=mirrored  # 미러 모드 필수 (MCP 서버 호환성)
```

#### ✅ 안전한 설정 변경 가능
```ini
# 성능 최적화 설정
autoMemoryReclaim=gradual  # 점진적 메모리 회수 (dropcache 금지)
sparseVhd=true            # VHD 압축 활성화
processors=8              # CPU 코어 수 (현재 8코어 최적화)
swap=10GB                 # 스왑 메모리 (현재 10GB 설정)
guiApplications=true      # GUI 애플리케이션 지원
```

#### ❌ 호환성 문제로 사용 불가
```ini
# WSL 버전 호환성 문제
pageReporting=true       # 최신 WSL 빌드에서만 지원
useWindowsDriver=true    # 실험적 기능으로 불안정
```

#### 🛠️ WSL 설정 변경 후 체크리스트
1. `wsl --shutdown` 후 재시작
2. `claude mcp status` 명령으로 MCP 서버 상태 확인
3. 모든 서버가 정상 연결되는지 검증
4. 응답 시간이 50ms 이내인지 확인

### 🚀 MCP 빠른 설정

**⚠️ 중요**: Claude Code v2.0.1에서 **CLI-only 방식**만 권장

#### 기본 명령어
```bash
# MCP 서버 상태 확인
claude mcp list

# 환경변수 로드
source ./scripts/setup-mcp-env.sh

# 자동 건강 체크 (serena 프로젝트 활성화 상태 포함)
./scripts/mcp-health-check.sh
```

#### 🎯 핵심 MCP 서버 (9개 완전 작동) ⭐

**인증 필요 서버**:
- **🎉 vercel**: 프로젝트 배포 관리 - OAuth 인증 (재인증 완료)
- **🎉 supabase**: PostgreSQL DB 관리 - Access Token
- **🎉 context7**: 라이브러리 문서 검색 - API 키

**로컬 실행 서버**:
- **🎉 serena**: 프로젝트 분석 및 코드 탐색 - Python 기반 (uv 도구)
- **🎉 playwright**: E2E 테스트 자동화 - WSL Sandbox v3 wrapper

**범용 도구 서버**:
- **🎉 memory**: 지식 그래프 관리 - npx 실행
- **🎉 time**: 시간대 변환 - uvx 실행
- **🎉 sequential-thinking**: 사고 프로세스 도구 - npx 실행
- **🎉 shadcn-ui**: UI 컴포넌트 조회 - npx 실행

### 🔑 베르셀 인증 방법 (2025-09-30 업데이트)

#### **Vercel MCP 서버 인증** ⭐ **권장 방식**
```bash
# Claude Code 내에서 자동 OAuth 인증
claude mcp list  # vercel: ✓ Connected 확인

# 재인증이 필요한 경우
/mcp  # Claude Code 명령어로 재인증
```

**장점**:
- Claude Code 통합 환경에서 직접 Vercel 기능 사용
- OAuth 인증으로 안전한 토큰 관리
- MCP 도구로 프로젝트/배포 관리 자동화

#### **Vercel CLI 인증** (보조 도구)
```bash
# ✅ 베르셀 CLI 사용법 (.env.local 토큰 기반)
source .env.local && vercel whoami --token $VERCEL_TOKEN    # 인증 확인
source .env.local && vercel ls --token $VERCEL_TOKEN        # 프로젝트 목록
source .env.local && vercel deploy --token $VERCEL_TOKEN    # 배포
source .env.local && vercel logs --token $VERCEL_TOKEN      # 로그 확인
```

**사용 구분**:
- **MCP 서버**: Claude Code 내 통합 작업 (권장)
- **CLI 도구**: 터미널 스크립트 및 자동화

→ **[📖 상세 설정 가이드](docs/mcp/setup-guide.md)** | **[🔧 트러블슈팅](docs/mcp/setup-guide.md#5%EF%B8%8F%E2%83%A3-mcp-%ED%8A%B8%EB%9F%AC%EB%B8%94%EC%8A%88%ED%8C%85-%EA%B0%80%EC%9D%B4%EB%93%9C)**

## 🤖 서브에이전트 시스템

**18개 전문 에이전트**로 복잡한 작업을 효율적으로 처리합니다.

### ⚡ 빠른 선택 가이드

- 🐛 **버그 해결** → debugger-specialist + codex-specialist
- 🔧 **성능 최적화** → qwen-specialist + structure-refactor-specialist
- 📝 **코드 리뷰** → code-review-specialist + gemini-specialist
- 🚀 **배포 이슈** → vercel-platform-specialist + security-specialist
- 🎨 **UI/UX 개선** → ui-ux-specialist + shadcn-ui 도구

### 3가지 호출 방법
1. **자동 위임**: "이 코드를 3개 AI로 교차검증해줘"
2. **명시적 호출**: "codex-specialist를 사용하여 버그를 분석해주세요"
3. **직접 CLI**: `codex exec "복잡한 로직 분석"` (외부 도구)

→ **[📖 서브에이전트 완전 가이드](docs/ai-tools/subagents-complete-guide.md)** - 상세 사용법, 에이전트별 특화 기능, 최적화 전략

---

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
- **현재 성능**: codex-specialist 9.0/10 안정적 운영

```bash
# 서브에이전트 정상 작동 확인
# Codex CLI 직접 사용 예시
codex exec "복잡한 알고리즘 최적화 분석"
codex exec "이 코드의 보안 취약점 분석"
```

#### 🆓 Gemini CLI (개발 도구 전용)
**Google OAuth 브라우저 인증** - 애플리케이션 Google AI API와 별개 시스템
- **한도**: 60 RPM / 1,000 RPD (OAuth 기반 개발자 계정)
- **용도**: 코딩 보조, 아키텍처 분석 전용 (개발자 CLI 도구)
- **구분**: 애플리케이션의 Google AI API (API 키 기반)와 완전히 분리됨
- **현재 성능**: gemini-specialist 9.33/10 최고 성능

#### 🆓 Qwen CLI (Qwen OAuth 무료)
**Qwen OAuth 브라우저 인증**
- **한도**: 60 RPM / 2,000 RPD
- **현재 상태**: qwen-specialist 9.2/10 타임아웃 해결 완료

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

**Claude Code 주도 + 3-AI 협업 교차검증** (2025-10-01 개편) 🆕

### 🎯 핵심 개념: 진짜 교차검증

**같은 코드를 서로 다른 철학으로 평가** - 역할 분리가 아닌 관점 다양성

```yaml
교차검증 원칙:
  - 모든 AI가 동일한 5개 항목 평가 (정확성, 안전성, 성능, 복잡도, 설계합치)
  - 각 AI는 자신의 철학에 따라 항목별 중요도를 다르게 적용
  - Claude는 점수 차이 패턴으로 의견 충돌 자동 감지 및 조율
```

### 📊 표준 점수 루브릭 (100점 만점)

**모든 AI가 동일한 항목 평가**:

```yaml
scoring_rubric:
  정확성: 40점    # 재현 가능/테스트 통과/컴파일 무오류
  안전성: 20점    # 보안·데이터 손상 위험/롤백 용이성
  성능: 20점      # p95/메모리/쿼리플랜 개선 예상치
  복잡도: 10점    # 변경 난이도·리스크·확장성
  설계합치: 10점  # 기존 아키텍처 원칙과의 부합
```

### 🎭 AI별 평가 철학 (핵심 차이점!)

#### Codex - 실무 개발자 관점
**철학**: "작동하면 일단 OK, 나중에 개선하면 됨"

| 항목 | 가중치 | 이유 |
|------|--------|------|
| 정확성 | ⭐⭐⭐ 높음 | 버그 없으면 80% 해결 |
| 안전성 | ⭐⭐⭐ 높음 | 롤백 가능하면 OK |
| 성능 | ⭐ 낮음 | 나중에 최적화 |
| 복잡도 | ⭐⭐ 중간 | 읽기 쉬우면 됨 |
| 설계합치 | ⭐ 낮음 | **작동이 우선** |

**평가 예시**:
```
정확성 38/40, 안전성 18/20, 성능 15/20, 복잡도 8/10, 설계합치 6/10
→ 총점 85/100 "실무적으로 문제없음, 배포 가능"
```

#### Gemini - 아키텍트 관점
**철학**: "원칙 위배는 절대 안 됨, 장기 유지보수 중요"

| 항목 | 가중치 | 이유 |
|------|--------|------|
| 정확성 | ⭐⭐ 중간 | 버그 적으면 됨 |
| 안전성 | ⭐⭐⭐ 높음 | 확장 시 안전해야 함 |
| 성능 | ⭐ 낮음 | 설계가 우선 |
| 복잡도 | ⭐⭐⭐ 높음 | 확장성 중요 |
| 설계합치 | ⭐⭐⭐⭐ 매우 높음 | **원칙이 생명** |

**평가 예시**:
```
정확성 35/40, 안전성 16/20, 성능 12/20, 복잡도 5/10, 설계합치 4/10
→ 총점 72/100 "SOLID 위배! 설계 원칙 준수 필요, 리팩토링 권장"
```

#### Qwen - 성능 엔지니어 관점
**철학**: "1ms라도 빨라야 함, 자원 낭비 안 됨"

| 항목 | 가중치 | 이유 |
|------|--------|------|
| 정확성 | ⭐⭐ 중간 | 작동하면 됨 |
| 안전성 | ⭐⭐ 중간 | 성능만 안 해치면 됨 |
| 성능 | ⭐⭐⭐⭐ 매우 높음 | **생명** |
| 복잡도 | ⭐⭐ 중간 | 최적화 가능하면 됨 |
| 설계합치 | ⭐ 낮음 | 성능이 우선 |

**평가 예시**:
```
정확성 36/40, 안전성 17/20, 성능 10/20, 복잡도 7/10, 설계합치 7/10
→ 총점 77/100 "메모리 3배, CPU 2배 저하! 성능 최적화 필수"
```

### 🧠 Claude의 종합 판단 로직

```yaml
점수 차이 분석:
  차이 < 10점:
    "3개 AI 합의 (예: 82/85/87점)"
    → 평균 점수로 자동 승인

  차이 10~20점:
    "중간 불일치 (예: 72/85/77점)"
    → 항목별 편차 분석
    → 프로젝트 상황 고려:
       - 프로토타입 단계 → Codex 우선 (빠른 구현)
       - 장기 운영 → Gemini 우선 (설계 안정성)
       - 대용량 처리 → Qwen 우선 (성능 최적화)

  차이 > 20점:
    "심각한 불일치 (예: 65/90/72점)"
    → 충돌 항목 확인 (성능 vs 설계합치)
    → 사용자에게 최종 판단 요청
```

### 🎲 실제 사례: "for문 vs map()"

**상황**: 가독성 좋은 map()이지만 메모리 2배 소비

#### 3개 AI 평가 결과

**Codex: 85/100** ✅
- 가독성 좋아서 복잡도 +5점
- 버그 없어서 정확성 만점
- 성능은 신경 안 씀
- **결론**: "map()이 더 실무적, 채택 권장"

**Gemini: 90/100** ✅✅
- 함수형 패턴이라 설계합치 +10점
- 원칙 잘 지켜서 높은 점수
- **결론**: "map()이 설계 원칙 부합, 강력 추천"

**Qwen: 65/100** ❌
- 메모리 2배 때문에 성능 -15점
- 최적화 필수라고 경고
- **결론**: "for문 유지 필요, map() 부적합"

#### Claude 최종 판단

```yaml
점수 차이: 90 - 65 = 25점 (심각한 불일치)
충돌 항목: 성능(10-12-15) vs 설계합치(7-10-6)

최종 결정:
  if 성능_크리티컬_구간:
    "Qwen 의견 우선 → for문 유지"
    "2단계에서 최적화된 함수형 패턴 재검토"

  elif 일반_비즈니스_로직:
    "Gemini 의견 우선 → map() 채택"
    "성능 모니터링 추가, 병목 시 즉시 롤백"
```

### ⚖️ 의견 불일치 해소 규칙

```yaml
arbitration_rules:
  설계_충돌:
    - Gemini 설계합치 항목 가중치 +10점
    - 장기 유지보수 프로젝트일 경우 우선

  성능_미달:
    - Qwen 성능 항목 가중치 +10점
    - 성능 목표치 명시 시 우선

  버그_의심:
    - Codex 정확성 항목 가중치 +10점
    - 프로덕션 안정성 최우선

  최종_결정:
    - Claude가 가중 평균 + 프로젝트 컨텍스트로 결론
    - 불확실 시 사용자에게 선택권 위임
```

### 🚀 사용 방법 (방식 B - Claude 주도) 🆕

```bash
# 기본 AI 교차검증 (Claude가 3개 서브에이전트 병렬 호출)
"이 파일을 3개 AI로 교차검증해줘"
→ Claude: 파일 읽기
→ Claude: Task codex-specialist "실무 관점 평가"
         Task gemini-specialist "아키텍처 관점 평가"
         Task qwen-specialist "성능 관점 평가"
         (병렬 실행 - 15초)
→ Claude: 점수 통합 분석 및 최종 결론

# 특정 관점 강조
"성능 크리티컬 구간이니 Qwen 의견 중시해서 교차검증해줘"
→ Qwen 성능 항목 가중치 +10점

# 히스토리 기반 개선 확인
"지난번 검증과 비교하여 개선사항 확인해줘"
→ reports/quality/ai-verifications/ 자동 참조

# Performance log 확인
tail -f logs/ai-perf/ai-perf-$(date +%F).log

# ⚠️ 직접 실행 (bash 스크립트) - DEPRECATED
# bash scripts/ai-verification/improved-ai-cross-validation.sh src/types/ai-types.ts
# → 권장: 위의 방식 B 사용 (40% 더 빠르고 투명한 UX)
```

### 📈 실제 성과 측정 (2025-10-01 업데이트)

- **정확도 향상**: 6.2/10 → 9.2/10 (48% 개선) ⬆️
- **의견 충돌 자동 감지**: 100% (점수 차이 패턴 분석)
- **버그 발견률**: 90% 증가 (멀티 관점 교차검증)
- **시스템 안정성**: 99.9% 연결 성공률 달성 🆕
- **Claude 토큰 효율**: 평균 55토큰 (기존 300 대비 82% 절약)
- **Codex 실무 평가**: 7.3/10 → **8.5+/10 예상** (Phase 1 개선 후)

### 🔄 업계 베스트 프랙티스 대비 분석 (2025-10-01)

**AI 교차검증 (메타 분석 결과)**:
- Codex (실무): 78/100 "작동하고 버그 잡으면 OK"
- Gemini (설계): 67/100 "업계 패턴 누락"
- Qwen (성능): 62/100 "응답 70초 너무 느림"
- **평균**: 69/100 (조건부 승인)

**강점** (업계 대비):
- ✅ 관점 다양성 (실무/설계/성능 철학) - 업계 드묾
- ✅ 모델 다양성 (3개 독립 AI) - 업계 표준 준수
- ✅ LLM 네이티브 판단 (Claude 능력 활용) - 혁신적

**개선 필요** (업계 표준 누락):
- ⚠️ Performance Monitoring 부재 (정확도 하락 감지 불가)
- ⚠️ Adaptive Weighting 없음 (비효율적 AI 계속 사용)
- ⚠️ Consensus Mechanism 부재 (Claude 단독 판단)
- 🔴 성능 병목: 응답 70초 (업계 30초 대비 2.5배)

### 🚀 개선 로드맵 (3-AI 공통 권장)

#### **Phase 1: 즉시 적용** (1시간) ⭐ **✅ 완료 (2025-10-01)**

```yaml
1. Codex 타임아웃 단축:
   변경: 30초 → 15초
   효과: 응답 시간 70초 → 58초 (17% 개선)
   적용: codex-specialist 서브에이전트 (방식 B)

2. Performance Log 개선:
   변경: /tmp/important → logs/ai-perf/ai-perf-YYYY-MM-DD.log
   포맷: JSON Lines (ai, duration_ms, timestamp)
   효과: 세션 유지, 일자별 롤링, 영구 보관
   적용: 서브에이전트 성능 추적 시스템

3. 에러 핸들링 강화:
   추가: 병렬 실행 종료 코드 검사 + fallback 점수 5.0
   효과: 타임아웃/오류 시 안정적 점수 제공
   파일: scripts/ai-verification/improved-ai-cross-validation.sh (DEPRECATED - 참고용)

4. Claude 오판 감지 보정:
   기존: scoreDiff > 30점 (100점 만점)
   추가: 2엔진 합의 확인 (consensus_count >= 2)
   효과: Single Point of Failure 완화 + 신뢰도 향상
   파일: scripts/ai-verification/improved-ai-cross-validation.sh (DEPRECATED - 참고용)
```

**실제 테스트 결과**:
```
Codex:   8.2/10
Gemini:  8.5/10
Qwen:    8.5/10
가중평균: 8.3/10
✅ 2엔진 이상 합의 (신뢰도 높음) ← 새로 추가된 기능
```

### 🎯 미래 확장 가능성 (필요시에만)

**Phase 1 완료로 실무적 목표 달성** ✅

Phase 2/3는 **오버엔지니어링**으로 판단:
- Fast-path: "간단한 코드" 판단 로직이 더 복잡
- Context Caching: Max 플랜이라 토큰 비용 큰 문제 아님
- Adaptive Weighting: 데이터 축적 + ML = 과도한 복잡도

**Codex 실무 철학**: "작동하면 OK, 나중에 개선" - **지금 작동함** ✅

**필요 시 고려할 항목**:
- Performance log 대시보드 (Grafana/Supabase)
- CI/CD 통합 (PR 자동 검증)
- 히스토리 기반 트렌드 분석

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

**🌐 Vercel**: 30GB/월 (30% 사용) | FCP 608ms, 응답시간 532ms (2025-09-28 실측)
**🐘 Supabase**: 15MB (3% 사용) | RLS 정책, 쿼리 50ms
**☁️ GCP**: Cloud Functions 200만 호출/월 (5% 사용)

### 💡 핵심 성과
- **월 운영비**: $0 (100% 무료)
- **절약 효과**: 연간 $1,380-2,280
- **성능**: 엔터프라이즈급 (FCP 608ms, 응답시간 532ms, 99.95% 가동률)

## 📐 핵심 규칙

1. **TypeScript**: any 금지, strict mode 필수
2. **파일 크기**: 500줄 권장, 1500줄 초과 시 분리
3. **테스트**: Vercel 중심 E2E 테스트 우선, 실제 운영 환경에서 검증
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
- **Vercel 환경 테스트 우선**: 변경 전 기존 기능 테스트, 변경 후 실제 환경에서 회귀 테스트
- **단계적 적용**: 큰 변경은 단계별로 나누어 각 단계마다 Vercel 배포 후 검증
- **롤백 계획**: 모든 변경에 대해 즉시 되돌릴 수 있는 방법 사전 준비

## 🤖 AI 개발 히스토리 관리

**1인 AI 개발 환경** - spec-driven-specialist 서브에이전트를 통한 선택적 기록 관리

> **목적**: 90% 완성 프로젝트에서 필요할 때만 사용하는 실용적 히스토리 추적
> **방식**: 복잡한 강제 프로세스 대신 AI 서브에이전트 활용

### 🎯 실용적 사용법

```bash
# 💡 아이디어 정리
Task spec-driven-specialist "오늘 떠오른 아이디어를 정리해줘: [내용]"

# ✅ 작업 완료 기록
Task spec-driven-specialist "방금 [기능명] 완성했는데 어떻게 됐는지 정리해줘"

# 📊 프로젝트 분석
Task spec-driven-specialist "프로젝트 현재 상태 분석하고 다음 할 일 정리해줘"

# 🔄 막바지 정리
Task spec-driven-specialist "마무리 단계에서 뭘 했고 뭘 배웠는지 정리해줘"
```

## 📁 간소화된 구조

현재 **90% 완성** 프로젝트 마무리 단계에 맞는 최소한의 기록 체계:

```
docs/specs/
├── README.md                    # 이 파일 (사용법)
├── dev-notes/                   # AI와 함께한 개발 기록들
├── ideas/                       # 떠오른 아이디어들
└── archived/                    # 옛날 복잡한 템플릿들
```

## ✅ 1인 AI 개발의 현실

- **🧠 기억 보조**: 개발 과정에서 놓친 것들 기록
- **🔄 연결성**: 흩어진 아이디어들의 연결고리 발견
- **📈 성장 추적**: "아 내가 이렇게 발전했구나" 실감
- **⚡ 즉석 정리**: 생각 정리하는 시간도 아까운 1인 개발자용

---

**💡 진짜 핵심**: 완벽한 문서보다는 **"어? 이거 기록해둬야겠다"** 싶을 때 바로 AI에게 맡기기

## 🎯 현재 상태

### 프로젝트 현황
- **코드베이스**: 226,356줄 (src), 873개 TypeScript 파일
- **프로젝트 구조**: 기능별 레이어드 아키텍처, JBGE 원칙 적용
- **개발 상태**: 프로덕션 운영 중

### 품질 지표 - 2025-09-28 업데이트 ⭐
- **TypeScript 에러**: 0개 완전 해결 ✅ (77개→0개) - strict 모드 100% 달성
- **개발 서버 안정성**: segment-explorer 버그 **100% 해결** (근본적 수정)
- **개발 서버 성능**: 시작 시간 **35% 단축** (32초 → 22초)
- **테스트 성능**: **44% 단축** (37.95초 → 21.08초) - 멀티스레드 최적화
- **Vercel E2E 테스트**: 18개 Playwright 테스트, **98.2% 통과율** (실제 운영 환경)
- **테스트 전략**: Vercel 중심 접근법 ✅ - 실제 환경에서 직접 테스트
- **CI/CD**: Push 성공률 99%, 평균 배포 시간 5분
- **베르셀 CLI**: .env.local 토큰으로 **100% 작동 확인**
- **WSL 최적화**: cross-env 대신 네이티브 환경변수 사용

### Vercel 배포 현황 (Deployment) - 2025-09-28 업데이트
- **배포 상태**: ✅ 완전 성공 (Zero Warnings 달성)
- **프로덕션 URL**: https://openmanager-vibe-v5-jns171qwy-skyasus-projects.vercel.app
- **Node.js 버전**: ✅ 22.x 통합
- **배포 성과**: 경고 4개 → 0개, 프로덕션 안정성 100% 확보
- **프로덕션 환경**: 베르셀 무료 티어 100% 활용, FCP 608ms, 응답시간 532ms (실측)
- **테스트 접근**: PIN 인증 (환경변수 ADMIN_PASSWORD) 또는 GitHub OAuth 지원

### WSL 개발 환경 상태 (Development) - 2025-09-17 업데이트
- **메모리**: 19GB 할당, 16GB 사용 가능 (84% 여유도)
- **프로세서**: 8코어 완전 활용, Linux 6.6.87.2 커널
- **AI CLI 도구**: 5개 모두 완벽 작동 (MCP 프로세스 20개 안정 실행)
- **멀티 AI 협업**: Max 정액제 + 서브 3개 체제 ($220/월로 $2,200+ 가치)
- **네트워킹**: 미러 모드 완전 호환, MCP 서버 9/9 연결 성공
- **모니터링 도구**: WSL 성능 추적 및 MCP 서버 상태 분석 도구 완비

## 🔧 트러블슈팅

### 개발 환경 문제 해결 (Development) - 2025-09-28 업데이트 ⭐

#### 🐛 Next.js devtools 버그 해결 (완전 해결)
- **segment-explorer 에러**: `npm run dev:stable` 사용 (100% 해결)
- **개발 서버 불안정**: `npm run dev:clean` 사용 (텔레메트리 비활성화)
- **서버 시작 시간 단축**: 32초 → 22초 (35% 개선)

#### 🖥️ Vercel E2E 테스트 (Playwright) - 2025-09-28 최적화
- **실제 환경 우선**: `npm run test:vercel:e2e` - Vercel 배포 환경에서 직접 실행
- **로컬 보조 테스트**: WSL GUI + `export DISPLAY=:0 && npx playwright test --headed`
- **타임아웃 최적화**: Action 30초, Navigation 60초, 전체 테스트 2분 (타임아웃 오류 해결)
- **테스트 전략**: 핵심 API 및 보안 시스템 검증 (실제 운영 환경)

#### 🔐 관리자 모드 접근 테스트 - 2025-09-29 신규 ⭐
- **기본 접근 방법**: 메인페이지 → "게스트로 체험하기" → 프로필 드롭다운 → "관리자 모드" → PIN 입력 (환경변수 ADMIN_PASSWORD)
- **인증 순서**:
  1. **"게스트로 체험하기" 버튼 클릭** (메인페이지에서 최초 진입 필수)
  2. 프로필 메뉴 클릭 (우상단 GU 아이콘)
  3. "관리자 모드" 메뉴 아이템 클릭
  4. 4자리 PIN 입력 (환경변수 ADMIN_PASSWORD 참조)
  5. "확인" 버튼 클릭
- **인증 성공 확인**:
  - 프로필 상태: "게스트 사용자" → "관리자 모드" 변경
  - 시스템 시작 버튼: "GitHub 로그인이 필요합니다" → "🚀 시스템 시작" 활성화
  - 관리자 권한으로 대시보드 및 고급 기능 접근 가능
- **보안 특징**: 연속 실패 시 계정 일시 잠금, 서버 사이드 검증

#### 📊 기존 문제 해결 방법
- **MCP 오류**: `claude mcp list`로 상태 확인
- **Serena "No active project" 오류**: `mcp__serena__activate_project`로 프로젝트 활성화
- **MCP 종합 진단**: `./scripts/mcp-health-check.sh` (serena 프로젝트 상태 포함) ⭐ **개선됨**
- **MCP 보안 검사**: `./scripts/setup-mcp-env.sh --security-check` (9개 서버 상태 포함) ⭐ **개선됨**
- **Playwright MCP 실패**: [📋 Playwright MCP 복구 가이드](docs/troubleshooting/playwright-mcp-recovery-guide.md) ⭐ **2025-09-22 신규**
- **서브에이전트 실패**: WSL 환경 점검, PATH 확인
- **WSL 성능 이슈**: `./scripts/wsl-monitor/wsl-monitor.sh --once`로 진단
- **메모리 부족**: `./scripts/emergency-recovery.sh`로 응급 복구

### WSL 특화 개발 도구 (Development)
```bash
# WSL 메모리 최적화 (19GB 환경)
echo 'export NODE_OPTIONS="--max-old-space-size=12288"' >> ~/.bashrc

# AI CLI 환경 확인
which claude gemini qwen codex
claude --version  # v2.0.1 확인

# WSL 종합 진단
./scripts/wsl-monitor/wsl-monitor.sh --once
free -h  # 19GB 메모리 활용도 확인

# 현재 WSL 설정 확인 (Windows 측)
cmd.exe /c "type C:\Users\sky-note\.wslconfig"
```

### MCP 서버 재연결 (Development)
```bash
# MCP 서버 상태 확인
claude mcp list

# 문제 서버 재연결
claude mcp remove serena
claude mcp add serena uv run --directory ~/.local/share/uv/tools/serena-mcp serena-mcp
```

### Git 인증 문제 해결 (Development)
```bash
# GitHub Personal Access Token 기반 인증 설정
# 1. .env.local에 GIT_TOKEN 환경변수 설정
source .env.local

# 2. HTTPS 토큰 인증으로 원격 저장소 URL 설정
git remote set-url origin https://username:$GIT_TOKEN@github.com/username/repository.git

# 3. 정상 푸시
git push

# 토큰 기반 인증의 장점:
# - SSH 키 설정 불필요
# - WSL 환경에서 안정적 작동
# - 환경변수 기반 보안 관리
```

### cross-env 오류 해결 (WSL 환경) - 2025-09-28 신규
```bash
# ❌ 문제: cross-env 오류 발생
# cross-env: command not found

# ✅ 해결: WSL 네이티브 환경변수 사용
# cross-env NODE_ENV=development → export NODE_ENV=development
export NODE_ENV=development
export DEBUG=true
export NEXT_TELEMETRY_DISABLED=1

# 📋 package.json 스크립트 최적화
# "dev": "cross-env NODE_ENV=development next dev"
# ↓ WSL 최적화
# "dev": "NODE_ENV=development next dev"

# 🎯 권장 방식: 환경변수 파일 활용
echo 'export NODE_ENV=development' >> ~/.bashrc
echo 'export DEBUG=true' >> ~/.bashrc
source ~/.bashrc
```

### 베르셀 CLI 인증 문제 해결 - 2025-09-28 신규
```bash
# ❌ 문제: vercel login 실패 또는 권한 오류

# ✅ 해결: .env.local 토큰 기반 인증
# 1. .env.local에 VERCEL_TOKEN 확인
cat .env.local | grep VERCEL_TOKEN

# 2. 토큰 유효성 검증
source .env.local && vercel whoami --token $VERCEL_TOKEN

# 3. 모든 베르셀 명령어에 --token 플래그 사용
source .env.local && vercel ls --token $VERCEL_TOKEN
source .env.local && vercel deploy --token $VERCEL_TOKEN
source .env.local && vercel logs --token $VERCEL_TOKEN

# 📋 자동화 스크립트 (선택사항)
echo 'alias vtoken="source .env.local && vercel --token \$VERCEL_TOKEN"' >> ~/.bashrc
source ~/.bashrc
# 사용법: vtoken ls, vtoken deploy 등
```

### 프로덕션 배포 문제 해결 (Deployment)
- **타입 오류**: `npx tsc --noEmit`으로 strict 설정 확인
- **배포 실패**: `npm run build` 로컬 테스트 후 Vercel 배포
- **런타임 오류**: Vercel 로그 분석 및 환경변수 검증

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
| **[🔌 API 설계](docs/design/current/api-design.md)** | 90개 기능별 API 구조 | ✅ 운영 중 |
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

**⚙️ 전문 도구**: MCP 9개 서버 • AI CLI 4개 • 서브에이전트 15개

→ **[📚 전체 문서 인덱스](docs/README.md)**

---

💡 **핵심 원칙**: Type-First + Side-Effect First + 이모지 커밋 + **사이드 이펙트 필수 고려** + WSL 멀티 AI 통합

⚠️ **사이드 이펙트 우선**: 모든 수정, 삭제, 개발 시 영향 분석 및 검증 필수

📖 **상세 내용**: /docs 폴더 참조 (JBGE 원칙 기반 체계적 구조)

🐧 **WSL 우선**: 모든 AI 개발 작업은 WSL에서 수행

🤖 **멀티 AI 전략**: 메인 1개 + 서브 3개로 비용 효율성과 생산성 극대화
