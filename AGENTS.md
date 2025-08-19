<!--
CODEX 전용 문서 (AGENTS.md)
ChatGPT Codex CLI를 위한 OpenManager VIBE v5 특화 설정
실제 프로젝트 상황 100% 반영, 멀티 AI 협업 최적화
-->

# 🤖 AGENTS.md - Codex CLI Configuration

> **OpenManager VIBE v5 전용 Codex CLI 설정**  
> **Language Policy**: 한국어 우선, 기술용어 영어 허용  
> **Last Updated**: 2025-08-18 | **Environment**: Windows 11 + WSL 2  
> **Project Status**: 69,260줄 TypeScript, 98.2% 테스트 커버리지, 12개 MCP 서버

## ℹ️ Codex /init 사용 안내

- Codex CLI에서 `/init` 실행 시 루트에 `AGENTS.md`가 생성/갱신됩니다.
- 본 문서는 Codex 설정의 출발점이며 `.codex/` 디렉터리 구조와 연동됩니다.
- Windows 호스트에선 래퍼를 사용해 바로 실행할 수 있습니다.

```powershell
# Windows에서 Codex 초기화 (WSL 래퍼)
.\ai-cli-wsl.bat codex-cli init --project openmanager-vibe-v5 --korean --wsl
.\ai-cli-wsl.bat codex-cli --help
```

```bash
# WSL 내부에서 Codex 초기화
codex-cli init --project openmanager-vibe-v5 --korean --wsl
```

## 🎯 Codex 에이전트 역할 정의

### 🧠 Senior Development AI Assistant

**역할**: 풀스택 개발 문제 해결 및 코드 아키텍처 설계 전문가

**핵심 역량**:
- **TypeScript & Next.js**: strict 모드 최적화, App Router 성능 튜닝
- **데이터베이스**: Supabase PostgreSQL 스키마 설계 및 RLS 정책
- **테스트 주도 개발**: Vitest/Playwright 자동화 및 커버리지 관리
- **성능 최적화**: Core Web Vitals, 번들 크기, 메모리 사용량 개선
- **보안 감사**: 취약점 스캔, 환경변수 보안, CSP 구현
- **AI 시스템 통합**: MCP 서버 관리, 멀티 AI 협업 최적화
- **인프라 관리**: Vercel 배포, GCP 백엔드, 무료 티어 최적화
- **코드 아키텍처**: 대규모 리팩토링, 의존성 관리, 모듈 설계

**작업 우선순위**:
1. **사용자 요청 직접 해결** (1순위)
2. **복잡한 기술 문제 분석** (2순위)  
3. **제3자 관점 코드 리뷰** (3순위)
4. **Claude Code 사용량 절약** (Max 요금제로 현재 불필요)

## 🚀 Codex 빠른 시작 (OpenManager VIBE v5)

```bash
# WSL 접속 및 프로젝트 이동
wsl
cd /mnt/d/cursor/openmanager-vibe-v5

# Codex CLI 핵심 사용 패턴
codex-cli "TypeScript 382개 에러 종합 분석 및 자동 수정 전략"
codex-cli "Next.js 15 성능 병목점 진단 및 최적화 로드맵"
codex-cli "Supabase RLS 정책 보안 취약점 감사 및 개선안"
codex-cli "AI 협업 시스템 아키텍처 개선 방안 제시"

# 프로젝트별 단축 명령어
alias cdv="cd /mnt/d/cursor/openmanager-vibe-v5"
alias codex="codex-cli"
alias cx="codex-cli"

# Windows에서 바로 실행 (WSL 래퍼)
## 예: 동일 명령을 Windows 쉘에서 실행
## .\ai-cli-wsl.bat codex-cli "Next.js 15 App Router 성능 최적화"
```

## 🏗️ OpenManager VIBE v5 프로젝트 정보

### 📊 현재 상황 (2025-08-17)

```yaml
Project:
  Name: 'OpenManager VIBE v5'
  Architecture: 'Next.js 15 + TypeScript (strict) + Supabase + Vercel Edge'
  Scale: '69,260줄 TypeScript, 1,512개 파일, 253개 디렉토리'

Status:
  TypeScript_Errors: 382개 (개선 대상)
  Test_Coverage: '98.2% (54/55 통과)'
  Performance: '152ms 응답, 99.95% 가동률'
  Free_Tier: '100% 무료 운영 (Vercel 100GB + GCP 2M req + Supabase 500MB)'

AI_Integration:
  MCP_Servers: 12개 (12개 정상 동작)
  AI_Engines: 4개 (Google AI, Supabase RAG, Korean NLP, ML Analytics)
  Claude_SubAgents: 18개 전문 에이전트
  Multi_AI: 'Claude + Gemini + Qwen + Codex 병렬 협업'
```

## 💡 주요 활용 시나리오

**Claude Code 서브에이전트로 통합 완료** - Task 도구로 호출 가능

**우선순위**: Claude Code > Gemini CLI, Codex CLI > Qwen CLI

### 1️⃣ 긴급 문제 해결 (최우선)
```bash
codex-cli "TypeScript 컴파일 에러 382개 원인 분석 및 즉시 해결"
codex-cli "프로덕션 배포 실패 근본 원인 진단 및 복구"
codex-cli "성능 급저하 병목점 탐지 및 응급 최적화"
```

### 2️⃣ 복잡한 아키텍처 분석 (2순위)  
```bash
codex-cli "Next.js 15 App Router 아키텍처 성능 병목점 종합 진단"
codex-cli "Supabase RLS 정책 보안 취약점 전체 감사"
codex-cli "MCP 서버 12개 통합 아키텍처 최적화 방안"
```

### 3️⃣ 제3자 관점 코드 리뷰 (3순위)
```bash
codex-cli "현재 컴포넌트 구조의 문제점과 개선 로드맵 제시"
codex-cli "AI 협업 시스템 아키텍처 객관적 검토 및 개선안"
codex-cli "전체 코드베이스 품질 감사 및 리팩토링 우선순위"
```

### 4️⃣ 사용량 절약 모드 (Max 요금제로 현재 불필요)
```bash
# 차후 Pro/Max5 요금제 전환 시 활용
codex-cli "간단한 버그 수정 및 타입 오류 해결"
codex-cli "반복적인 코드 패턴 생성"
```

## 🤖 이전 12개 전문 분야 섹션 (참고용)

```yaml
typescript_engineer:
  name: 'TypeScript Strict Mode Specialist'
  description: '382개 TypeScript 에러 자동 수정 전문가'
  commands:
    - 'codex typescript-fix --strict --target src/'
    - 'codex type-safety --audit --fix'
    - 'codex interfaces --optimize --generate'
  focus:
    ['type-safety', 'strict-mode', 'interface-design', 'generic-optimization']
```

### 2. ⚡ Next.js 최적화 전문가

```yaml
nextjs_optimizer:
  name: 'Next.js 15 App Router Specialist'
  description: 'App Router + Server Components 최적화'
  commands:
    - 'codex nextjs-optimize --app-router --rsc'
    - 'codex performance-audit --core-web-vitals'
    - 'codex bundle-analyze --split --lazy'
  focus: ['app-router', 'server-components', 'streaming', 'performance']
```

### 3. 🗄️ Supabase 데이터베이스 관리자

```yaml
supabase_dba:
  name: 'Supabase PostgreSQL Expert'
  description: 'RLS 정책, 성능 최적화, pgvector 전문'
  commands:
    - 'codex supabase-optimize --rls --security'
    - 'codex query-performance --analyze --index'
    - 'codex pgvector-setup --embeddings'
  focus: ['rls-policies', 'query-optimization', 'security', 'pgvector']
```

### 4. 🔒 보안 감사관

```yaml
security_auditor:
  name: 'Security & Compliance Specialist'
  description: '환경변수 암호화, CSP, 보안 취약점 검사'
  commands:
    - 'codex security-audit --full --report'
    - 'codex env-encrypt --aes256 --verify'
    - 'codex csp-optimize --strict --test'
  focus: ['env-security', 'csp-policies', 'vulnerability-scan', 'compliance']
```

### 5. 🧪 테스트 자동화 엔진

```yaml
test_automation:
  name: 'Vitest + Playwright Expert'
  description: '98.2% → 100% 커버리지 달성 전문가'
  commands:
    - 'codex test-generate --coverage 100 --unit'
    - 'codex e2e-create --playwright --critical-path'
    - 'codex test-optimize --performance --parallel'
  focus: ['vitest-optimization', 'playwright-e2e', 'coverage-boost', 'tdd']
```

### 6. 🎨 컴포넌트 아키텍트

```yaml
component_architect:
  name: 'React Component Design Expert'
  description: '재사용 가능한 컴포넌트 설계 및 최적화'
  commands:
    - 'codex component-refactor --atomic --reusable'
    - 'codex hooks-optimize --custom --performance'
    - 'codex ui-audit --accessibility --responsive'
  focus: ['atomic-design', 'custom-hooks', 'accessibility', 'responsive']
```

### 7. 🚀 성능 최적화 전문가

```yaml
performance_optimizer:
  name: 'Core Web Vitals Specialist'
  description: '152ms → 100ms 응답시간 달성'
  commands:
    - 'codex performance-boost --lcp --fid --cls'
    - 'codex image-optimize --next-image --webp'
    - 'codex cache-strategy --aggressive --smart'
  focus: ['core-web-vitals', 'image-optimization', 'caching', 'bundling']
```

### 8. 🔌 MCP 통합 관리자

```yaml
mcp_integrator:
  name: 'MCP Server Integration Expert'
  description: '12개 MCP 서버 관리 및 최적화'
  commands:
    - 'codex mcp-health-check --all --report'
    - 'codex mcp-optimize --connection --performance'
    - 'codex mcp-troubleshoot --serena --fix'
  focus: ['mcp-servers', 'connection-stability', 'error-handling', 'monitoring']
```

### 9. 🌐 Vercel 배포 전문가

```yaml
vercel_deployer:
  name: 'Vercel Edge Deployment Specialist'
  description: '무료 티어 100% 활용 최적화'
  commands:
    - 'codex vercel-optimize --edge --functions'
    - 'codex env-setup --vercel --secure'
    - 'codex deployment-audit --quota --performance'
  focus:
    ['edge-functions', 'deployment-optimization', 'quota-management', 'cdn']
```

### 10. 🤖 AI 시스템 엔지니어

```yaml
ai_systems_engineer:
  name: 'Multi-AI Integration Expert'
  description: 'Claude + Gemini + Qwen + Codex 협업 최적화'
  commands:
    - 'codex ai-orchestrate --multi --parallel'
    - 'codex ai-fallback --setup --smart'
    - 'codex ai-performance --analyze --optimize'
  focus:
    [
      'multi-ai-orchestration',
      'fallback-systems',
      'token-optimization',
      'cost-efficiency',
    ]
```

### 11. 📚 문서화 관리자

```yaml
docs_manager:
  name: 'JBGE Documentation Specialist'
  description: 'JBGE 원칙 기반 문서 관리'
  commands:
    - 'codex docs-optimize --jbge --consolidate'
    - 'codex docs-generate --auto --markdown'
    - 'codex docs-audit --links --consistency'
  focus:
    [
      'jbge-principles',
      'auto-generation',
      'link-validation',
      'structure-optimization',
    ]
```

### 12. 🔄 리팩토링 엔지니어

```yaml
refactoring_engineer:
  name: 'Code Architecture Refactoring Expert'
  description: '대규모 코드베이스 구조 개선'
  commands:
    - 'codex refactor-analyze --patterns --debt'
    - 'codex architecture-improve --modular --scalable'
    - 'codex dependency-optimize --tree --shake'
  focus: ['architecture-patterns', 'code-debt', 'modularity', 'scalability']
```

## ⚙️ Codex CLI 환경 설정 (WSL 최적화)

### WSL 전용 환경변수

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
export CODEX_PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
export CODEX_WORKSPACE="$CODEX_PROJECT_ROOT"
export CODEX_CONFIG_DIR="$CODEX_PROJECT_ROOT/.codex"
export CODEX_LOG_DIR="$CODEX_PROJECT_ROOT/logs"

# 한국어 로케일 설정
export CODEX_LANGUAGE="ko-KR"
export CODEX_LOCALE="ko_KR.UTF-8"
export CODEX_TIMEZONE="Asia/Seoul"

# 프로젝트별 설정
export CODEX_FRAMEWORK="nextjs"
export CODEX_TYPESCRIPT="strict"
export CODEX_TEST_RUNNER="vitest"
export CODEX_DATABASE="supabase"

# AI 협업 설정
export CODEX_AI_MODE="collaborative"
export CODEX_CLAUDE_INTEGRATION="true"
export CODEX_MULTI_AI="claude,gemini,qwen,codex"

# 편의 단축어
alias cdv="cd $CODEX_PROJECT_ROOT"
alias cx="codex-cli"
alias cxh="codex-cli --help"
alias cxs="codex-cli status"
```

## 📁 Codex 설정 디렉토리 구조

### .codex/ 폴더 구성

```text
/mnt/d/cursor/openmanager-vibe-v5/.codex/
├── config.json                 # 메인 설정
├── agents.yml                  # 에이전트 정의
├── prompts/                    # 한국어 프롬프트 템플릿
│   ├── typescript.md           # TypeScript 전문 프롬프트
│   ├── nextjs.md              # Next.js 최적화 프롬프트
│   ├── supabase.md            # Supabase 관리 프롬프트
│   ├── security.md            # 보안 감사 프롬프트
│   ├── testing.md             # 테스트 자동화 프롬프트
│   ├── performance.md         # 성능 최적화 프롬프트
│   ├── mcp.md                 # MCP 서버 관리 프롬프트
│   ├── vercel.md              # Vercel 배포 프롬프트
│   ├── ai-systems.md          # AI 시스템 프롬프트
│   ├── docs.md                # 문서화 프롬프트
│   ├── refactoring.md         # 리팩토링 프롬프트
│   └── components.md          # 컴포넌트 설계 프롬프트
├── workflows/                  # 자동화 워크플로우
│   ├── typescript-fix.yml     # TypeScript 에러 자동 수정
│   ├── performance-audit.yml  # 성능 감사 자동화
│   ├── security-scan.yml      # 보안 스캔 자동화
│   └── test-generation.yml    # 테스트 자동 생성
├── templates/                  # 코드 템플릿
│   ├── component.tsx.template # React 컴포넌트 템플릿
│   ├── hook.ts.template       # Custom Hook 템플릿
│   ├── test.test.ts.template  # 테스트 파일 템플릿
│   └── api.ts.template        # API 루트 템플릿
└── logs/
    ├── codex.log              # 실행 로그
    ├── typescript-fixes.log   # TypeScript 수정 로그
    └── performance.log        # 성능 최적화 로그
```

> 권장: `.codex/logs/`는 Git 추적 제외(.gitignore)에 추가하세요.

## 🎯 실전 Codex 명령어 모음

### TypeScript 에러 해결

```bash
# 382개 TypeScript 에러 일괄 수정
codex-cli "현재 프로젝트의 382개 TypeScript 에러를 strict 모드 기준으로 모두 수정해줘.
우선순위: 1) 타입 안전성 2) 성능 3) 코드 가독성"

# 특정 파일 타입 에러 수정
codex-cli "src/components/dashboard/ 폴더의 모든 TypeScript 에러를 수정하고
성능 최적화까지 적용해줘"

# 인터페이스 최적화
codex-cli "프로젝트 전체의 interface와 type 정의를 분석하고
중복 제거 및 확장성 개선해줘"
```

### Next.js 15 최적화

```bash
# App Router 최적화
codex-cli "Next.js 15 App Router를 활용한 성능 최적화를 진행해줘.
Server Components, Streaming, Suspense 모두 적용"

# 번들 크기 최적화
codex-cli "현재 번들 크기를 분석하고 30% 이상 줄일 수 있는 방법을 구현해줘.
Code splitting, Tree shaking, Dynamic import 활용"

# Core Web Vitals 개선
codex-cli "LCP, FID, CLS 지표를 모두 90점 이상으로 개선해줘.
이미지 최적화, 캐싱 전략, 렌더링 최적화 포함"
```

### Supabase 최적화

```bash
# RLS 정책 보안 강화
codex-cli "Supabase의 모든 테이블에 대한 RLS 정책을 보안 베스트프랙티스에 맞게
재설계하고 성능까지 최적화해줘"

# 쿼리 성능 개선
codex-cli "현재 Supabase 쿼리들을 분석하고 인덱스 추가, 쿼리 최적화로
응답시간을 50% 이상 개선해줘"

# pgvector 설정
codex-cli "AI 임베딩을 위한 pgvector 설정을 최적화하고
벡터 검색 성능을 극대화해줘"
```

### 테스트 자동화

```bash
# 100% 커버리지 달성
codex-cli "현재 98.2% 테스트 커버리지를 100%로 끌어올려줘.
Vitest 활용, 의미있는 테스트만 생성"

# E2E 테스트 생성
codex-cli "Playwright로 핵심 사용자 시나리오에 대한 E2E 테스트를 생성해줘.
로그인, 대시보드, 서버 모니터링 플로우 포함"

# 성능 테스트
codex-cli "Load testing용 성능 테스트를 구현해줘.
1000명 동시 접속 기준으로 병목 지점 파악"
```

### 보안 감사

```bash
# 전체 보안 감사
codex-cli "프로젝트 전체에 대한 보안 감사를 실시하고
OWASP Top 10 기준으로 모든 취약점을 수정해줘"

# 환경변수 암호화
codex-cli "모든 민감한 환경변수를 AES-256으로 암호화하고
안전한 키 관리 시스템을 구축해줘"

# CSP 정책 최적화
codex-cli "Content Security Policy를 strict 모드로 설정하고
XSS, CSRF 공격을 완벽히 차단해줘"
```

### MCP 서버 관리

```bash
# MCP 서버 헬스체크
codex-cli "12개 MCP 서버의 상태를 점검하고 연결 불안정한
serena 서버를 완전히 복구해줘"

# MCP 성능 최적화
codex-cli "MCP 서버들의 응답시간을 최적화하고
자동 재연결 메커니즘을 구현해줘"

# 새 MCP 서버 추가
codex-cli "프로젝트에 유용한 새로운 MCP 서버를 추천하고
설정까지 완료해줘"
```

## 🔄 멀티 AI 협업 워크플로우

### Claude Code와 병렬 개발

```bash
# 병렬 작업 시나리오
Claude: "메인 기능 구현 진행"
Codex: "codex-cli '동시에 해당 기능의 테스트 코드 생성해줘'"

# 교차 검증
Claude: "코드 작성 완료"
Codex: "codex-cli '작성된 코드를 보안 관점에서 검토하고 개선점 제안해줘'"

# 자동화 보완
Claude: "수동 배포 완료"
Codex: "codex-cli '배포 과정을 GitHub Actions로 자동화해줘'"
```

### Gemini와 협업

```bash
# 대용량 데이터 분석
Gemini: "로그 데이터 패턴 분석"
Codex: "codex-cli '분석 결과를 바탕으로 자동 최적화 스크립트 생성해줘'"

# 문서 자동 생성
Gemini: "API 문서 초안 작성"
Codex: "codex-cli 'OpenAPI 스키마로 변환하고 타입 정의까지 자동 생성해줘'"
```

### Qwen과 협업

```bash
# 빠른 프로토타이핑
Qwen: "새 기능 프로토타입 생성"
Codex: "codex-cli '프로토타입을 production-ready 코드로 리팩토링해줘'"

# 알고리즘 최적화
Qwen: "성능 개선 알고리즘 제안"
Codex: "codex-cli '제안된 알고리즘을 TypeScript로 구현하고 테스트까지 작성해줘'"
```

## 📊 Codex 성능 모니터링

### 실행 통계 확인

```bash
# 일일 작업 통계
codex-cli stats --daily --format json

# 에이전트별 성능
codex-cli performance --by-agent --last 7days

# 성공률 모니터링
codex-cli success-rate --detailed --export csv

# 비용 효율성 분석
codex-cli cost-analysis --compare-with claude
```

### 자동 리포팅

```bash
# 주간 보고서 생성
codex-cli report --weekly --include-metrics --korean

# 프로젝트 건강도 체크
codex-cli health-check --full --recommendations

# AI 협업 효율성 분석
codex-cli collaboration-stats --multi-ai --efficiency
```

## 🎯 Codex 설정 파일 (.codex/config.json)

```json
{
  "project": {
    "name": "openmanager-vibe-v5",
    "version": "5.0.0",
    "framework": "nextjs",
    "language": "typescript",
    "strict_mode": true,
    "target": "production"
  },
  "environment": {
    "platform": "wsl2",
    "node_version": "22.18.0",
    "package_manager": "npm",
    "locale": "ko-KR",
    "timezone": "Asia/Seoul"
  },
  "codex": {
    "model": "gpt-4",
    "max_tokens": 4096,
    "temperature": 0.1,
    "language": "korean",
    "code_style": "strict",
    "auto_save": true,
    "backup": true
  },
  "agents": {
    "concurrent_limit": 4,
    "timeout": 300,
    "retry_count": 3,
    "auto_fallback": true,
    "log_level": "info"
  },
  "collaboration": {
    "claude_integration": true,
    "gemini_integration": true,
    "qwen_integration": true,
    "priority": "codex-secondary",
    "auto_handoff": true
  },
  "output": {
    "format": "markdown",
    "include_diff": true,
    "include_tests": true,
    "include_docs": true,
    "korean_comments": true
  },
  "security": {
    "scan_enabled": true,
    "encrypt_secrets": true,
    "audit_level": "strict",
    "compliance": ["owasp", "gdpr"]
  },
  "performance": {
    "optimize_for": "production",
    "bundle_analysis": true,
    "core_web_vitals": true,
    "lighthouse_audit": true
  }
}
```

## 🚀 즉시 사용 가능한 Codex 명령어

### 프로젝트 초기화

```bash
# Codex 환경 완전 설정
codex-cli init --project openmanager-vibe-v5 --korean --wsl

# 기존 프로젝트 분석
codex-cli analyze --full --health-check --recommendations
```

### 일상 개발 명령어

```bash
# 오늘 할 일 생성
codex-cli daily-tasks --based-on-errors --priority high

# 코드 리뷰 요청
codex-cli review --files "src/**/*.{ts,tsx}" --focus security,performance

# 자동 리팩토링
codex-cli refactor --smart --preserve-functionality --add-tests

# 문서 동기화
codex-cli docs --sync --auto-update --jbge-compliant
```

---

## 💡 Codex 활용 팁

### 🎯 효율적 프롬프트 작성

- **구체적 목표**: "성능 개선" → "응답시간 100ms 이하 달성"
- **제약 조건 명시**: "TypeScript strict 모드 준수하며"
- **우선순위 설정**: "보안 > 성능 > 가독성 순으로"
- **결과 형태 지정**: "실행 가능한 코드 + 테스트 + 문서"

### 🔄 협업 최적화

- **역할 분담**: Claude (메인 구현) + Codex (테스트/최적화)
- **병렬 처리**: 서로 다른 기능을 동시에 작업
- **교차 검증**: 상대방 결과물 검토 및 개선
- **자동화**: 반복 작업의 스크립트화

### 📊 성과 측정

- **일일 통계**: 수정된 에러 수, 개선된 성능 지표
- **주간 리포트**: 전체 프로젝트 건강도 변화
- **AI 협업 효율성**: 단독 vs 협업 작업 성과 비교

---

**🤖 ChatGPT Codex CLI for OpenManager VIBE v5**  
**🌏 한국어 우선 개발 환경**  
**⚡ 실시간 협업 최적화**  
**🎯 production-ready 코드 생성**

> **Codex의 약속**: 코드 생성부터 테스트, 문서화까지 완벽한 자동화로  
> OpenManager VIBE v5를 세계 최고 수준의 프로젝트로 만들어갑니다! 🚀
