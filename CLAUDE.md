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
claude --version     # 버전 확인 (v1.0.119)
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

## 🤖 AI CLI 도구 통합 (WSL 환경)

### 설치된 AI CLI 도구들

| 도구                  | 버전    | 요금제              | 역할 구분                   | WSL 실행                   | Windows 네이티브           | 최근 업데이트 |
| --------------------- | ------- | ------------------- | --------------------------- | -------------------------- | -------------------------- | ------------- |
| **Claude Code**       | v1.0.119 | Max ($200/월) | 🏆 **메인 개발 환경**       | WSL 직접 실행 | ✅ 완벽 지원                | 2025-09-21 최신 |
| **OpenAI CLI (Codex)** | v0.34.0 | Plus ($20/월)       | 🤝 **직접 CLI 실행** ✅ | `codex exec` | ✅ **GPT-5 실무 통합 전문가**   | 2025-09-17 역할 확장 |
| **Google Gemini CLI** | **v0.4.1** 🆕 | 무료 (60 RPM/1K RPD)   | 👨‍💻 **직접 CLI 실행** ✅ | `gemini` | ✅ **아키텍처 + 디자인 시스템** | **2025-09-17 역할 세분화** |
| **Qwen Code**         | v0.0.11  | 무료 (60 RPM/2K RPD)   | 🔷 **1분 타임아웃 최적화** ✅ | `timeout 60 qwen -p`   | ✅ **알고리즘 최적화 전문**    | 2025-09-17 타임아웃 해결 |
| **ccusage**           | **v16.2.5** 🆕 | 무료                | 📊 **Claude 사용량 모니터링** | npx ccusage daily          | ✅ npx 실행 전용            | **npx 권장 (CPU 이슈 방지)** |

> ✅ **2025-09-16 업데이트**: **공식 서브에이전트 호출 방식 적용**. 명시적 호출(`"서브에이전트명 서브에이전트를 사용하여"`) 및 자동 위임 방식 지원. 외부 AI 도구는 직접 CLI 명령어로 실행.

### WSL 통합 실행

```bash
# WSL 접속 및 프로젝트 이동
wsl
cd /mnt/d/cursor/openmanager-vibe-v5

# AI 도구들 직접 CLI 실행 (2025-09-16 업데이트)
claude --version               # Claude Code v1.0.119 버전 확인
codex exec "작업 요청"         # Codex CLI 직접 실행 (27초)
gemini "작업 요청"             # Gemini CLI 직접 실행 (즉시)
timeout 60 qwen -p "작업 요청" # Qwen CLI 1분 타임아웃 (복잡한 작업용)
npx ccusage daily              # ccusage 일일 사용량 (npx로만 실행)
```

## 🔌 MCP & 베르셀 통합

### 📊 MCP 현황: 9/9개 연결, 3개 완전 작동 🏆 CLI-only 방식 (2025-09-21 업데이트)

| MCP 서버 | 연결 | WSL 성능 | 기능 테스트 | 상태 |
|----------|------|----------|-------------|------|
| **🎉 context7** | ✅ | ✅ 즉시 응답 | ✅ React 라이브러리 조회 | **완전 작동** |
| **🎉 supabase** | ✅ | ✅ 즉시 응답 | ✅ SQL 실행, 테이블 관리 | **완전 작동** |
| **🎉 vercel** | ✅ | ✅ 즉시 응답 | ✅ 프로젝트/팀 관리 | **완전 작동** |
| **memory** | ✅ | ✅ 즉시 응답 | ⏳ 도구 로딩 중 | 연결됨 |
| **time** | ✅ | ✅ 즉시 응답 | ⏳ 도구 로딩 중 | 연결됨 |
| **sequential-thinking** | ✅ | ✅ 즉시 응답 | ⏳ 도구 로딩 중 | 연결됨 |
| **shadcn-ui** | ✅ | ✅ 즉시 응답 | ⏳ 도구 로딩 중 | 연결됨 |
| **serena** | ✅ | ✅ 즉시 응답 | ⏳ 도구 로딩 중 | 연결됨 |
| **🎉 playwright** | ✅ | ✅ 즉시 응답 | ✅ WSL+윈도우 크롬 E2E 테스트 | **완전 작동** |

### 🚀 19GB WSL 최적화 성과 (2025-09-21 업데이트)

**메모리 현황**: 19GB 할당, 16GB 사용 가능 (84% 여유도)
**프로세스 현황**: MCP/AI 관련 프로세스 17개 안정 실행
**성능 개선**: Vercel OAuth 인증 완료, Supabase MCP 완전 복구
**응답속도**: 평균 50ms 유지 (최적화 상태)
**안정성**: 100% 연결 성공률 (9/9개 MCP 서버) 🎯 **완벽 달성**
**도구 버전**: Claude v1.0.119, Node.js v22.19.0, npm v11.6.0

### ⚠️ WSL 설정 변경 시 주의사항 (필수)

#### 🔒 변경 금지 설정
```ini
# ⚠️ 절대 변경하지 말 것 - MCP 서버 크래시 위험
dnsTunneling=true     # MCP DNS 해석 필수
autoProxy=true        # MCP 프록시 연결 필수
memory=19GB          # 최소 16GB, 권장 19GB (현재 최적화 완료)
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

**⚠️ 중요**: Claude Code v1.0.119에서 **CLI-only 방식**만 권장

#### 기본 명령어
```bash
# MCP 서버 상태 확인
claude mcp list

# 환경변수 로드
source ./scripts/setup-mcp-env.sh

# 자동 건강 체크
./scripts/mcp-health-check.sh
```

#### 🎯 핵심 MCP 서버 (3개 완전 작동)
- **🎉 context7**: 라이브러리 문서 검색 - API 키 필요
- **🎉 supabase**: PostgreSQL DB 관리 - Access Token 필요
- **🎉 vercel**: 프로젝트 배포 관리 - OAuth 인증

→ **[📖 상세 설정 가이드](docs/mcp/setup-guide.md)** | **[🔧 트러블슈팅](docs/mcp/setup-guide.md#5%EF%B8%8F%E2%83%A3-mcp-%ED%8A%B8%EB%9F%AC%EB%B8%94%EC%8A%88%ED%8C%85-%EA%B0%80%EC%9D%B4%EB%93%9C)**

## 🤖 서브에이전트 최적화 전략

**15개 핵심 에이전트 최적화 완료** - UI/UX 전문가 독립화 완료 (2025.09.19)

### 📊 AI 교차검증 결과 (9.17/10)
- **Codex (실무 관점)**: 9.2/10 - 단계적 제거, 기능 패리티 우선
- **Gemini (아키텍처)**: 9.5/10 - 응집도 증가, 결합도 감소
- **Qwen (성능 최적화)**: 8.8/10 - 26% 메모리 절약, CPU 효율성 증대

### 🎯 핵심 에이전트 구성 (15개)

#### 1. AI 교차 검증 시스템 (3개)

**codex-specialist**: ChatGPT Codex CLI 전용 외부 AI 연동
- **특화**: 실무 중심 코드 리뷰, 버그 발견, GPT-5 기반 분석
- **호출 예시**: `codex: 복잡한 알고리즘을 최적화 분석해주세요`

**gemini-specialist**: Google Gemini CLI 전용 외부 AI 연동
- **특화**: 시스템 아키텍처 분석, 구조적 개선사항 제안
- **호출 예시**: `gemini: 시스템 아키텍처 설계를 검토해주세요`

**qwen-specialist**: Qwen CLI 전용 외부 AI 연동
- **특화**: 알고리즘 최적화, 성능 분석, 수학적 복잡도 개선
- **호출 예시**: `qwen: 알고리즘 성능을 최적화 분석해주세요`

#### 2. 전문 도구 (12개)

**개발 환경 & 구조 (2개)**:
- **dev-environment-manager**: WSL 최적화, Node.js 버전 관리 + statusline/output-style 설정 통합 ⭐ **강화됨**
- **structure-refactor-specialist**: 프로젝트 구조 정리, 아키텍처 리팩토링

**백엔드 & 인프라 (3개)**:
- **database-administrator**: Supabase PostgreSQL 전문, RLS 정책, 쿼리 최적화
- **vercel-platform-specialist**: Vercel 플랫폼 최적화, 배포 자동화
- **gcp-cloud-functions-specialist**: GCP Cloud Functions 전문가

**코드 품질 & 보안 (3개)**:
- **code-review-specialist**: 통합 코드 품질 검토 + 디버깅 분석 전문가 ⭐ **강화됨**
- **debugger-specialist**: 근본 원인 분석 및 버그 해결 전문가
- **security-specialist**: 종합 보안 전문가 (auditor + reviewer 통합)

**테스트 & 문서화 (2개)**:
- **test-automation-specialist**: 테스트 자동화, Vitest + Playwright E2E 전문 + 실험용 테스트 통합 ⭐ **강화됨**
- **documentation-manager**: AI 친화적 문서 관리

**문서화 & UI/UX 전문가 (2개)**:
- **spec-driven-specialist**: 계획 대비 결과 분석 평가 전문가 (원래 계획과 실제 결과를 분석 및 평가하여 문서화)
- **ui-ux-specialist**: 내장 UI/UX 전문가 (사용자 인터페이스 개선, 디자인 시스템 구축, 사용자 경험 최적화)

### 🗑️ **최적화 완료 (2025-09-19) - SDD 서브에이전트 통합**

**제거된 에이전트 (7개)**:
- ❌ **orchestrator-agent**: 서브에이전트 체이닝 불가능으로 논리적 모순
- ❌ **verification-specialist**: 중간 단계일 뿐, Claude Code가 직접 수행 가능
- ❌ **central-supervisor**: Claude Code 메인이 실제 오케스트레이터 역할
- ❌ **security-auditor**: security-specialist로 통합
- ❌ **security-reviewer**: security-specialist로 통합
- ❌ **requirements-analyst**: 프로젝트 성숙 단계에서 불필요
- ❌ **task-coordinator**: 프로젝트 성숙 단계에서 불필요

**이름 변경된 에이전트 (1개)**:
- 🔄 **design-architect** → **ui-ux-specialist**: UI/UX 전문성을 명확히 하기 위해 이름 변경

**통합된 에이전트 (1개)**:
- ✅ **security-specialist**: auditor + reviewer 기능 통합, Critical priority 유지

### 🎯 AI 활용 방법 - 혼합 전략 (2025-09-16 확정)

**✅ 공식 문서 확인**: 서브에이전트는 명시적 호출 방식과 자동 위임 방식을 지원합니다!

#### **🔄 공식 서브에이전트 호출 방법**

**복잡한 작업 → 간소화된 서브에이전트 호출** ⭐ **60% 효율화**
```
# 프로젝트 컨텍스트가 필요한 전문적 분석
codex: 타입스크립트 안전성을 전체 분석해주세요
gemini: 시스템 아키텍처 설계를 검토해주세요
qwen: 알고리즘 성능을 최적화 분석해주세요

# 문서화 및 프로젝트 정리 전문가
spec-driven: UI/UX 개선 프로젝트 작업계획서를 작성해주세요
spec-driven: 현재까지의 개발 진행 상황을 정리해주세요
spec-driven: 프로젝트 완료 보고서 및 성과 정리를 해주세요
ui-ux: UI/UX 개선을 실제로 구현해주세요
```

**간단한 작업 → 직접 CLI**
```bash
# 빠른 확인이나 간단한 질문
codex exec "이 함수에 버그 있나요?"
gemini "이 구조가 SOLID 원칙에 맞나요?"
qwen -p "시간복잡도는?"

# AI 교차검증 (사용자 요청 시)
"이 코드를 3개 AI로 교차검증해줘" # Claude가 적절한 방식 선택하여 실행
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
# Codex CLI 직접 사용 예시
codex exec "복잡한 알고리즘 최적화 분석"
codex exec "이 코드의 보안 취약점 분석"
```

#### 🆓 Gemini CLI (Google AI 무료)
**Google OAuth 브라우저 인증**
- **한도**: 60 RPM / 1,000 RPD
- **현재 성능**: gemini-specialist 9.33/10 최고 성능

#### 🆓 Qwen CLI (Qwen OAuth 무료)
**Qwen OAuth 브라우저 인증**
- **한도**: 60 RPM / 2,000 RPD
- **현재 상태**: qwen-wrapper 9.2/10 타임아웃 해결 완료

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

### 🚀 표준화된 서브에이전트 기반 시스템

**AI 교차검증 v3.0 - Claude Code 직접 관리 방식**

```bash
# 새로운 방식: Claude Code가 직접 외부 AI 서브에이전트들 조율
"이 코드를 3개 AI로 교차검증해줘"  # Claude가 적절한 방식 선택하여 실행

# 개별 AI 직접 호출도 가능
"codex-specialist 서브에이전트를 사용하여 논리적 분석해주세요"
"gemini-specialist 서브에이전트를 사용하여 아키텍처 검토해주세요"
"qwen-specialist 서브에이전트를 사용하여 성능 최적화해주세요"
```

**⚠️ 폐기된 방식**: verification-specialist 중간 단계 (Claude Code가 직접 수행으로 변경)

### 📊 3단계 레벨 시스템

**Level 1** (50줄 미만): Claude 단독 → 즉시 결과
**Level 2** (50-200줄): Claude + Codex(GPT-5) → 30-60초  
**Level 3** (200줄+): Claude + Codex + Gemini + Qwen → 45-90초

### 🎯 AI별 전문 분야 (가중치 적용)

**Codex CLI (0.99)**: 실무 통합, 권한 시스템, 프레임워크 호환성
**Gemini CLI (0.98)**: 시스템 아키텍처, 디자인 시스템, 구조 개선
**Qwen CLI (0.97)**: 성능 최적화, 알고리즘 분석, 복잡도 개선

### 📈 실제 성과 측정 (2025-09-17 최신)

- **정확도 향상**: 6.2/10 → 9.2/10 (48% 개선) ⬆️
- **검증 속도**: Level 1 즉시 → Level 3 60초 (33% 단축) ⬆️
- **비용 효율성**: API 대비 15배 절약 (50% 개선) ⬆️
- **버그 발견률**: 90% 증가 (멀티 AI 관점)
- **시스템 안정성**: 99.9% 연결 성공률 달성 🆕

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
- **개발 기간**: 2025년 5월 시작, 현재 4개월 운영 중
- **코드베이스**: 226,356줄 (src), 873개 TypeScript 파일
- **프로젝트 구조**: 기능별 레이어드 아키텍처, JBGE 원칙 적용

### 품질 지표 - 2025-09-21 업데이트 ⭐
- **TypeScript 에러**: 0개 완전 해결 ✅ (77개→0개) - strict 모드 100% 달성
- **개발 서버 안정성**: segment-explorer 버그 **100% 해결** (근본적 수정)
- **개발 서버 성능**: 시작 시간 35% 단축 (32초 → 22초)
- **Playwright GUI**: WSL ↔ Windows 브라우저 통합 **완전 구축**
- **테스트**: 54/55 통과 (98.2%), 평균 실행 속도 6ms
- **CI/CD**: Push 성공률 99%, 평균 배포 시간 5분

### Vercel 배포 현황 (Deployment)
- **배포 상태**: ✅ 완전 성공 (Zero Warnings 달성)
- **Node.js 버전**: ✅ 22.x 통합
- **배포 성과**: 경고 4개 → 0개, 프로덕션 안정성 100% 확보
- **프로덕션 환경**: 베르셀 무료 티어 100% 활용, 152ms 응답시간

### WSL 개발 환경 상태 (Development) - 2025-09-17 업데이트
- **메모리**: 19GB 할당, 16GB 사용 가능 (84% 여유도)
- **프로세서**: 8코어 완전 활용, Linux 6.6.87.2 커널
- **AI CLI 도구**: 5개 모두 완벽 작동 (MCP 프로세스 20개 안정 실행)
- **멀티 AI 협업**: Max 정액제 + 서브 3개 체제 ($220/월로 $2,200+ 가치)
- **네트워킹**: 미러 모드 완전 호환, MCP 서버 9/9 연결 성공
- **모니터링 도구**: WSL 성능 추적 및 MCP 서버 상태 분석 도구 완비

## 🔧 트러블슈팅

### 개발 환경 문제 해결 (Development) - 2025-09-21 업데이트 ⭐

#### 🐛 Next.js devtools 버그 해결 (완전 해결)
- **segment-explorer 에러**: `npm run dev:stable` 사용 (100% 해결)
- **개발 서버 불안정**: `npm run dev:clean` 사용 (텔레메트리 비활성화)
- **서버 시작 시간 단축**: 32초 → 22초 (35% 개선)

#### 🖥️ Playwright GUI 브라우저 테스트
- **WSL GUI 설정**: `.wslconfig`에 `guiApplications=true` 추가됨
- **Chrome GUI 테스트**: `export DISPLAY=:0 && npx playwright test --headed`
- **WSL 재시작 필요**: GUI 설정 적용을 위해 `wsl --shutdown` 후 재시작

#### 📊 기존 문제 해결 방법
- **MCP 오류**: `claude mcp list`로 상태 확인
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
claude --version  # v1.0.119 확인

# WSL 종합 진단
./scripts/wsl-monitor/wsl-monitor.sh --once
free -h  # 19GB 메모리 활용도 확인

# 현재 WSL 설정 확인 (Windows 측)
cmd.exe /c "type C:\Users\sky-note\.wslconfig"
```

### MCP 서버 재연결 (Development)
```bash
# MCP 서버 상태 확인
claude mcp status

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
