# 📁 OpenManager VIBE v5 전체 폴더 구조

**통합 아카이브/백업 분리 시스템 적용 완료** - 2025-09-10

## 🎯 핵심 원칙

- **🏛️ 아카이브**: 프로젝트 내부 (`archive/` 폴더) - Git 제외
- **💾 백업**: 프로젝트 내부 (`.backup/` 폴더) - Git 제외
- **🚀 활성**: Git 추적되는 실제 개발 파일들

---

## 📂 프로젝트 루트 구조

```
openmanager-vibe-v5/
├── 📄 README.md                    # 프로젝트 메인 문서
├── 📄 CLAUDE.md                    # Claude Code 프로젝트 가이드 ⭐
├── 📄 CHANGELOG.md                 # 변경 기록
├── 📄 folder-structure.md          # 전체 폴더 구조 가이드 ⭐
├── 📄 package.json                 # 프로젝트 설정
├── 📄 next.config.mjs              # Next.js 설정
├── 📄 tsconfig.json                # TypeScript 설정
├── 📄 postcss.config.mjs            # PostCSS + Tailwind v4 설정
├── 📄 .gitignore                   # Git 제외 파일 (아카이브/백업 포함)
├── 📄 .vercelignore                # Vercel 배포 제외 파일
├── 📄 .env.local                   # 환경변수 (Git 제외)
└── 📄 vitest.config.ts             # 테스트 설정
```

---

## 🗂️ 메인 디렉토리 구조

### 📚 **docs/** - AI 최적화 문서 (Git 추적)

```
docs/
├── 📄 README.md                    # 문서 메인 인덱스
├── 📄 archive-backup-separation-guide.md  # 아카이브 시스템 가이드 ⭐
├── 📁 .ai-index/                   # AI 캐시 (11개 파일)
├── 📁 .backup/                     # 문서 백업 (Git 제외)
│   ├── daily/                      # 일별 백업 (7일)
│   ├── weekly/                     # 주별 백업 (4주)
│   └── monthly/                    # 월별 백업 (12개월)
├── 📁 ai/                          # AI 도구 가이드 (6개)
├── 📁 api/                         # API 문서 (3개)
├── 📁 design/                      # 설계도 (14개) ⭐
├── 📁 mcp/                         # MCP 서버 가이드 (6개)
├── 📁 performance/                 # 성능 최적화 (3개)
├── 📁 simulation/                  # Mock 시뮬레이션 (2개)
├── 📁 testing/                     # 테스트 가이드 (2개)
└── 📁 archive/                     # 280개 레거시 문서 (Git 추적, 참조용)
```

### 💻 **src/** - 소스 코드 (Git 추적)

```
src/
├── 📁 .backup/                     # 코드 백업 (Git 제외)
│   ├── daily/                      # 일별 백업
│   ├── weekly/                     # 주별 백업
│   ├── monthly/                    # 월별 백업
│   └── emergency/                  # 긴급 백업
├── 📁 app/                         # Next.js App Router
│   ├── 📁 api/                     # API 라우트 (76개)
│   │   └── 📁 .backup/             # API 백업 (Git 제외)
│   ├── 📁 dashboard/               # 대시보드 페이지
│   ├── 📁 globals.css              # 전역 스타일
│   └── 📁 layout.tsx               # 루트 레이아웃
├── 📁 components/                  # React 컴포넌트
├── 📁 lib/                         # 유틸리티 라이브러리
├── 📁 types/                       # TypeScript 타입 정의
├── 📁 domains/                     # 도메인별 컴포넌트
└── 📁 hooks/                       # React 훅
```

### 🛠️ **scripts/** - 자동화 스크립트

```
scripts/
├── 📁 archive/                     # 아카이브 관리 스크립트 ⭐
│   ├── 📄 archive-management-system.sh    # 문서 아카이브
│   ├── 📄 backup-automation.sh            # 백업 자동화
│   ├── 📄 recovery-system.sh              # 복구 시스템
│   ├── 📄 git-optimization.sh             # Git 최적화
│   ├── 📄 code-archive-system.sh          # 코드 아카이브
│   ├── 📄 api-archive-system.sh           # API 아카이브
│   ├── 📄 unified-archive-system.sh       # 통합 관리 ⭐
│   └── 📄 setup-permissions.sh            # 권한 설정
├── 📁 platform/                    # 플랫폼별 스크립트
└── 📁 build/                       # 빌드 스크립트
```

### ⚙️ **config/** - 설정 파일들

```
config/
├── 📁 build/                       # 빌드 설정
├── 📁 infra/                       # 인프라 설정
├── 📁 linting/                     # 린팅 설정
├── 📁 next/                        # Next.js 설정
├── 📁 security/                    # 보안 설정
├── 📁 testing/                     # 테스트 설정
└── 📁 typescript/                  # TypeScript 설정
```

### 📊 **logs/** - 로그 파일들 (Git 제외)

```
logs/
├── 📁 archive/                     # 아카이브 작업 로그
├── 📁 backup/                      # 백업 작업 로그
├── 📁 recovery/                    # 복구 작업 로그
└── 📁 git-optimization/            # Git 최적화 로그
```

---

## 🏠 외부 아카이브 구조 (Git 완전 제외)

### 📚 **~/openmanager-archive/** - 문서 아카이브

```
~/openmanager-archive/
├── 📁 current/                     # 현재 접근 가능한 280개 문서
├── 📁 snapshots/                   # 날짜별 스냅샷
│   └── 📁 20250910-071306/         # 타임스탬프별 백업
├── 📁 metadata/                    # 아카이브 메타데이터
│   └── 📄 migration-*.json         # 이전 기록
└── 📄 openmanager-archive-*.tar.gz # 압축 아카이브 (선택사항)
```

### 💻 **~/openmanager-code-archive/** - 코드 아카이브 (구축 완료)

```
~/openmanager-code-archive/
├── 📁 current/                     # 레거시 코드 파일
├── 📁 snapshots/                   # 날짜별 코드 스냅샷
├── 📁 metadata/                    # 코드 아카이브 메타데이터
└── 📄 code-archive-*.tar.gz        # 압축 아카이브 (선택사항)
```

### 🌐 **~/openmanager-api-archive/** - API 아카이브 (구축 완료)

```
~/openmanager-api-archive/
├── 📁 current/                     # deprecated API, 레거시 스키마
├── 📁 snapshots/                   # 날짜별 API 스냅샷
├── 📁 schemas/                     # 스키마 백업
├── 📁 configs/                     # 설정 백업
├── 📁 metadata/                    # API 아카이브 메타데이터
└── 📄 api-archive-*.tar.gz         # 압축 아카이브 (선택사항)
```

---

## 🚫 Git 제외 디렉토리 (.gitignore 적용)

### 📁 **백업 디렉토리들**

- `docs/.backup/` - 문서 백업
- `src/.backup/` - 코드 백업
- `src/app/api/.backup/` - API 백업
- `logs/` - 모든 로그 파일

### 📁 **임시/캐시 디렉토리들**

- `.next/` - Next.js 빌드 캐시
- `node_modules/` - npm 패키지
- `coverage/` - 테스트 커버리지
- `playwright-report/` - E2E 테스트 리포트

### 📁 **개발 환경 디렉토리들**

- `.claude/` - Claude Code 설정 (개인)
- `.vscode/` - VSCode 설정 (개인)
- `.serena/` - Serena MCP 캐시

---

## 🎯 핵심 특징

### ✅ **Git 추적 파일들** (1,464개)

- 활성 문서 (62개)
- 소스 코드 (전체)
- 설정 파일
- 아카이브 참조용 문서

### 🚫 **Git 제외 파일들**

- 모든 백업 디렉토리
- 외부 아카이브 (3개 시스템)
- 로그 파일
- 임시/캐시 파일

### 🔄 **관리 원칙**

- **아카이브**: 장기 보관 → 외부 디렉토리
- **백업**: 임시 보관 → 프로젝트 내부
- **활성**: 개발 파일 → Git 추적

**🎉 이 구조로 문서, 코드, API가 체계적으로 분리 관리되며, Git 저장소는 최적화된 상태를 유지합니다!**
