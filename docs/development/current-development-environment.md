# 현재 개발 환경 상세 가이드

> **작성일**: 2025-08-17  
> **최종 업데이트**: 2025-08-17  
> **환경**: Windows 11 + WSL 2 (Ubuntu 24.04.3 LTS)

## 🎯 개요

OpenManager VIBE v5는 Windows 11에서 WSL 2를 활용한 하이브리드 개발 환경으로 구성되어 있습니다. AI CLI 도구들은 WSL에서 실행되며, IDE는 Windows에서 WSL 터미널을 연동하여 사용합니다.

## 🖥️ 시스템 사양

### 하드웨어 환경

- **CPU**: AMD Ryzen 5 7430U with Radeon Graphics (6 코어)
- **메모리**: 7.8GB (WSL 할당)
- **스왑**: 16GB (WSL)
- **디스크**: 1007GB (약 1TB, 사용률 1%)

### 운영체제

- **Host OS**: Windows 11 Pro
- **WSL 버전**: WSL 2
- **Linux 배포판**: Ubuntu 24.04.3 LTS (noble)
- **커널**: Linux 6.6.87.2-microsoft-standard-WSL2

## 🛠️ 개발 도구 스택

### Node.js 환경

- **Node.js**: v22.18.0
- **npm**: 10.9.3
- **Package Manager**: npm (WSL 전역 설치)

### AI CLI 도구 통합 (WSL)

| 도구            | 버전   | 역할                   | 실행 환경 |
| --------------- | ------ | ---------------------- | --------- |
| **Claude Code** | 1.0.81 | 메인 AI 개발 도구      | WSL       |
| **Gemini CLI**  | 0.1.21 | 무료 보조 AI 도구      | WSL       |
| **Qwen CLI**    | 0.0.6  | 무료 검증 AI 도구      | WSL       |
| **ccusage**     | 15.9.7 | Claude 사용량 모니터링 | WSL       |

### 🏆 메인 개발 환경 (압도적 사용)

- **WSL + Claude Code**: 모든 개발 작업의 핵심 환경
  - WSL 2 (Ubuntu 24.04 LTS)에서 실행
  - 19개 서브에이전트, 12개 MCP 서버 통합
  - 멀티 AI 협업 (Codex, Gemini, Qwen CLI 병렬 사용)

### 🛠️ Windows IDE (보조 도구)

- **VS Code + GitHub Copilot** (현재 사용)
  - **주요 역할**: WSL 터미널 연동하여 Claude Code 지원
  - **특별 기능**: 이미지 붙여넣기, 웹페이지 수정, 캡쳐 전달
  - **사용 빈도**: 아주 가끔 (폭넓은 도구 활용)
  - **사용 이유**:
    - CLI와 GUI 도구의 각 강점을 활용한 상호 보완적 접근
    - 시각적 콘텐츠(이미지) 처리 시 CLI 도구의 한계 보완
    - Cursor AI 사용 경험으로 IDE AI 기능에 익숙하여 유연한 활용
    - 종합적 개발 환경 구축을 위한 전략적 도구 조합
  - **사용 경험**: Cursor → Windsurf → Kiro → VS Code 순서로 테스트

## 📦 프로젝트 구성

### 메인 프로젝트

- **프로젝트명**: openmanager-vibe-v5
- **버전**: 5.66.40
- **프로젝트 경로**: `/mnt/d/cursor/openmanager-vibe-v5`
- **Windows 경로**: `D:\cursor\openmanager-vibe-v5`

### 기술 스택

- **Frontend**: Next.js 15 + TypeScript (strict mode)
- **UI**: Tailwind CSS + Radix UI
- **Backend**: Vercel Edge Functions + Supabase
- **Database**: PostgreSQL (Supabase)
- **인프라**: GCP VM (무료 티어) + Vercel (무료 티어)

### 빌드 및 개발 설정

```bash
# 개발 서버 (메모리 최적화)
npm run dev  # 6144MB Node.js 힙 할당

# 빌드 (프로덕션)
npm run build  # 6144MB Node.js 힙 할당

# 테스트 (초고속)
npm run test:quick  # Vitest 최소 설정
```

## 🔌 MCP 서버 통합

### 활성화된 MCP 서버 (11/12)

- ✅ **filesystem**: 파일 시스템 직접 조작
- ✅ **memory**: 지식 그래프 관리
- ✅ **github**: GitHub API 연동
- ✅ **supabase**: PostgreSQL 데이터베이스 관리
- ✅ **gcp**: Google Cloud Platform 리소스
- ✅ **tavily**: 웹 검색 및 크롤링
- ✅ **playwright**: 브라우저 자동화
- ✅ **thinking**: 고급 사고 프로세스
- ✅ **context7**: 문서 검색 및 분석
- ✅ **time**: 시간대 관리
- ✅ **shadcn**: UI 컴포넌트 라이브러리
- ⚠️ **serena**: 연결됨, 도구 등록 실패 (프로토콜 호환성)

### MCP 설정 파일

- **설정 파일**: `.mcp.json`
- **예제 파일**: `.mcp.json.example`

## 🤖 AI 협업 시스템

### 멀티 AI 전략

- **메인**: Claude Code (Max $200/월 정액제)
- **서브**: Codex CLI (ChatGPT Plus $20/월)
- **무료**: Gemini CLI + Qwen CLI (병렬 처리)

### 서브에이전트 (18개 핵심)

1. **central-supervisor**: 작업 분해 및 오케스트레이션
2. **dev-environment-manager**: WSL 최적화 관리
3. **gcp-vm-specialist**: GCP 인프라 관리
4. **database-administrator**: Supabase PostgreSQL 전문
5. **ai-systems-engineer**: AI 시스템 최적화
6. **code-review-specialist**: 코드 품질 검증
7. **debugger-specialist**: 버그 해결 전문가
8. **security-auditor**: 보안 검사 자동화
9. **test-automation-specialist**: 테스트 자동화
10. **documentation-manager**: 문서 관리 전문가
11. **git-cicd-specialist**: Git 워크플로우 전문가
12. **structure-refactor-agent**: 프로젝트 구조 최적화
13. **quality-control-checker**: 규칙 준수 검증
14. **vercel-platform-specialist**: Vercel 플랫폼 최적화
15. **mcp-server-admin**: MCP 서버 관리
16. **ux-performance-optimizer**: 성능 최적화
17. **codex-cli**: ChatGPT Plus 병렬 개발
18. **gemini-cli-collaborator**: Gemini 병렬 개발

## 🔧 Git 및 품질 관리

### Git 설정

- **Remote**: https://github.com/skyasu2/openmanager-vibe-v5.git
- **Branch**: main
- **User**: Test User (test@example.com)

### 품질 관리 도구

- **Husky**: Git hooks 관리
- **lint-staged**: 변경된 파일만 검사
- **ESLint**: 코드 품질 검사 (최대 100 경고)
- **Prettier**: 코드 포매팅
- **Vitest**: 테스트 러너 (16개 테스트, 6.03초)

### Pre-commit/Pre-push 훅

- **Pre-commit**: lint-staged (ESLint + Prettier)
- **Pre-push**: test:quick (핵심 테스트만 실행)

## 📁 프로젝트 구조

```
/mnt/d/cursor/openmanager-vibe-v5/
├── .vscode/                 # VS Code 설정
│   └── ai-context.json      # AI 도구 컨텍스트 설정
├── .husky/                  # Git hooks
│   ├── pre-commit          # lint-staged 실행
│   └── pre-push            # test:quick 실행
├── src/                     # 소스 코드 (69,260줄)
├── docs/                    # 프로젝트 문서
├── scripts/                 # 자동화 스크립트
├── .env.local              # 로컬 환경변수
├── .env.wsl                # WSL 환경변수
├── .mcp.json               # MCP 서버 설정
└── package.json            # 프로젝트 설정
```

## ⚡ 성능 최적화

### WSL 최적화 설정

- **메모리**: 8GB 설정 → 7.8GB 사용 가능
- **스왑**: 16GB (대용량 작업 지원)
- **네트워킹**: mirrored 모드 (localhost 접속 최적화)
- **실험적 기능**:
  - autoMemoryReclaim=gradual (자동 메모리 회수)
  - sparseVhd=true (디스크 공간 절약)
  - dnsTunneling=true (빠른 외부 API 호출)
  - firewall=false (로컬 개발용)

### Node.js 메모리 관리

- **Node.js 힙**: 6144MB (개발), 8192MB (Mock 모드)
- **빌드 캐시**: .next/cache/ 활용

### 테스트 최적화

- **최소 설정**: config/testing/vitest.config.minimal.ts
- **실행 시간**: 평균 6.03초 (16개 테스트)
- **커버리지**: 98.2% (목표 70% 초과)

### 번들 최적화

- **Tree Shaking**: 활성화
- **Code Splitting**: 자동
- **Image Optimization**: Next.js Image 컴포넌트

## 🔐 보안 설정

### 환경변수 관리

- **암호화**: AES-256 (production)
- **개발 환경**: 평문 저장 (.env.local)
- **템플릿**: .env.local.template

### API 키 관리

- **GitHub**: Personal Access Token
- **Google AI**: API Key (AIza...)
- **Supabase**: Service Key
- **GCP**: 서비스 계정

## 🚀 배포 환경

### Vercel (무료 티어)

- **Frontend**: Next.js 정적 배포
- **Edge Functions**: API 엔드포인트
- **도메인**: 자동 HTTPS

### GCP (무료 티어)

- **VM 인스턴스**: 104.154.205.25:10000
- **API 서버**: Express.js + PM2
- **헬스체크**: /health 엔드포인트

### Supabase (무료 티어)

- **데이터베이스**: PostgreSQL
- **인증**: NextAuth.js 연동
- **실시간**: WebSocket 지원

## 🎯 개발 워크플로우

### 일반적인 개발 사이클

1. **개발 환경**: WSL + Claude Code 메인, Windows IDE(VS Code) 보조 활용
2. **WSL 터미널**: Windows IDE에서 WSL 터미널 연결
3. **AI 도구 활용**: Claude Code + 보조 AI들 병렬 사용
4. **코드 작성**: TypeScript strict mode + TDD
5. **자동 검증**: Pre-commit hooks (ESLint + Prettier)
6. **테스트**: Vitest 최소 설정 (6초 실행)
7. **배포**: Vercel 자동 배포

### 멀티 AI 활용 패턴

- **복잡한 작업**: central-supervisor로 분해 → 전문 에이전트 분배
- **병렬 개발**: Claude + Codex + Gemini + Qwen 동시 활용
- **교차 검증**: 다른 AI의 제3자 관점 리뷰

## 📊 모니터링

### Claude Code 사용량

- **실시간 추적**: ccusage statusline
- **일일 사용량**: ccusage daily
- **효율성 분석**: API 대비 절약 효과 추적

### 시스템 리소스

- **메모리**: free -h (WSL)
- **디스크**: df -h (프로젝트 디렉토리)
- **프로세스**: htop (개발 서버 모니터링)

## 🔄 업데이트 및 유지보수

### 정기 업데이트

- **Node.js**: LTS 버전 추적
- **AI CLI 도구**: 월 1회 업데이트 확인
- **MCP 서버**: 주간 상태 점검
- **보안 패치**: 즉시 적용

### 백업 전략

- **Git**: 모든 변경사항 버전 관리
- **환경설정**: .vscode/, .husky/ 폴더 백업
- **데이터베이스**: Supabase 자동 백업

---

## 📝 참고 문서

- **[MCP 종합 가이드](../MCP-GUIDE.md)**: MCP 서버 완전 활용법
- **[AI 시스템 가이드](../AI-SYSTEMS.md)**: 멀티 AI 협업 전략
- **[WSL 최적화 가이드](./wsl-optimization-analysis-report.md)**: WSL 성능 최적화
- **[개발 환경 설정](./development-environment.md)**: 상세 설정 가이드

---

💡 **핵심 원칙**: WSL 멀티 AI 통합 + Type-First 개발 + 무료 티어 최적화
