# 📚 문서 체계화 계획

> 생성 시간: 2025-08-12 23:30 KST

## 🎯 목표

현재 docs 루트의 83개 파일을 JBGE 원칙에 따라 6개 이하로 정리:

### 현재 상황
- **총 파일**: 168개 (archive 포함)
- **루트 파일**: 83개 (심각한 bloat)
- **큰 파일**: 830줄(gcp-vm-ai-backend-guide.md), 621줄(tavily-mcp-advanced-guide.md) 등
- **목표**: 루트 6개 이하, 나머지는 카테고리별 정리

## 📁 새로운 구조 설계

### 루트 레벨 (최대 6개) - 인간 친화적 README
```
docs/
├── README.md                     # 메인 문서 인덱스 (현재 존재)
├── QUICK-START.md               # 5분 빠른 시작 가이드 
├── SYSTEM-OVERVIEW.md           # 시스템 아키텍처 개요
├── MCP-GUIDE.md                 # MCP 서버 완전 가이드 (통합)
├── AI-SYSTEMS.md                # AI 엔진 및 협업 가이드 (통합)
└── TROUBLESHOOTING.md           # 주요 문제 해결 가이드
```

### 하위 디렉토리 - 세부 기술 문서
```
docs/
├── technical/                   # Claude 참조용 기술 문서
│   ├── mcp/                    # MCP 관련 모든 문서 (20+개)
│   ├── ai-engines/             # AI 시스템 세부 구현
│   ├── vercel-deployment/      # Vercel 배포 관련
│   ├── gcp-integration/        # GCP 관련 문서
│   └── database/               # DB 최적화 및 설정
├── guides/                     # 설정 및 사용 가이드
│   ├── setup/                  # 환경 설정
│   ├── development/            # 개발 가이드 (기존 유지)
│   ├── security/               # 보안 가이드 (기존 유지)
│   ├── performance/            # 성능 최적화 (기존 유지)
│   └── testing/                # 테스트 가이드 (기존 유지)
├── api/                        # API 문서
│   ├── endpoints/              # API 엔드포인트
│   ├── schemas/                # 데이터 스키마
│   └── authentication/         # 인증 관련
└── archive/                    # 기존 유지 + 추가 아카이브
    ├── 2025-08-12/             # 오늘 아카이브된 문서들
    └── legacy-reports/         # 오래된 분석 리포트
```

## 🔄 문서 분류 기준

### 1. 루트 레벨 (6개) - 즉시 접근 필요
- **인간이 자주 찾는 정보**
- **5분 빠른 시작 가능**
- **개요 및 문제 해결**

### 2. technical/ - Claude 참조용
- **MCP 서버 관련 모든 문서** (20+ 개)
- **AI 엔진 세부 구현**
- **플랫폼별 배포 세부사항**
- **성능 튜닝 및 최적화**

### 3. guides/ - 단계별 가이드
- **환경 설정 가이드**
- **개발 워크플로우**
- **보안 설정**
- **성능 최적화**

### 4. api/ - API 문서
- **엔드포인트 명세**
- **스키마 정의**
- **인증 방법**

## 📊 분류 대상 문서 분석

### MCP 관련 (technical/mcp/로 이동)
- mcp-best-practices-guide.md (588줄)
- mcp-development-guide-2025.md (554줄) 
- mcp-usage-guide-2025.md (571줄)
- mcp-servers-complete-guide.md (462줄)
- windows-mcp-complete-installation-guide.md (520줄)
- mcp-environment-variables-guide.md (372줄)
- mcp-subagent-integration-guide.md (291줄)
- 기타 MCP 관련 15+ 개 파일

### AI 시스템 관련 (technical/ai-engines/로 이동)
- gcp-vm-ai-backend-guide.md (830줄) - 분할 필요
- ai-cli-collaboration-strategy.md
- ai-performance-optimization-summary-2025-08-10.md
- ai-tools-token-usage-analysis.md
- tavily-mcp-advanced-guide.md (621줄)

### Vercel/배포 관련 (technical/vercel-deployment/로 이동)
- vercel-deployment-*.md (5개 파일)
- vercel-env-setup-guide.md
- vercel-typescript-fix-guide.md

### 테스트 관련 (guides/testing/로 이동)
- test-*.md (6개 파일)
- testing-system-guide.md
- e2e-test-*.md

### 보고서/분석 (archive/2025-08-12/로 이동)
- *-report.md, *-analysis.md, *-summary.md 파일들
- improvement-phase1-complete.md
- platform-usage-analysis.md

## 🚀 실행 계획

### Phase 1: 디렉토리 구조 생성
✅ technical/, guides/, api/ 디렉토리 생성

### Phase 2: 대용량 파일 분할
- gcp-vm-ai-backend-guide.md (830줄) 분할
- tavily-mcp-advanced-guide.md (621줄) 검토

### Phase 3: 문서 이동 및 정리
- MCP 관련 → technical/mcp/
- AI 시스템 → technical/ai-engines/
- Vercel 배포 → technical/vercel-deployment/
- 분석 리포트 → archive/2025-08-12/

### Phase 4: 루트 레벨 통합 문서 생성
- QUICK-START.md (5분 가이드)
- SYSTEM-OVERVIEW.md (아키텍처)
- MCP-GUIDE.md (MCP 통합 가이드)
- AI-SYSTEMS.md (AI 협업 가이드)
- TROUBLESHOOTING.md (문제 해결)

### Phase 5: 중복 내용 병합
- 유사한 MCP 가이드들 통합
- 중복된 설정 가이드 정리
- 오래된 리포트 아카이브

## 💡 예상 결과

### Before (현재)
- 루트 파일: 83개 (심각한 bloat)
- 찾기 어려운 구조
- 중복 내용 다수

### After (목표)
- 루트 파일: 6개 (JBGE 준수)
- 체계적인 카테고리 분류
- 중복 제거 및 통합
- Claude/인간 모두 효율적 접근

---

> **다음 단계**: Phase 2부터 순차적 실행