# Documentation Reference (문서 관리 인덱스)
> **최종 갱신**: 2025-12-19
> **버전**: v5.83.1

## Directory Structure (디렉토리 구조)

프로젝트 문서는 **순수 문서**와 **리포트/기록**으로 분리됩니다.

```
docs/                    # 순수 문서 (가이드, 레퍼런스)
├── core/               # 시스템 핵심 아키텍처 및 설계
│   ├── architecture/   # 전체 시스템 구조, 기술 스택
│   ├── ai/             # AI 기능 문서
│   ├── performance/    # 성능 최적화 가이드
│   ├── security/       # 보안 정책
│   └── platforms/      # Vercel, Supabase, GCP 설정
│
├── development/        # 개발자 실무 가이드
│   ├── ai/             # AI 도구 (Claude Code, CLI)
│   ├── mcp/            # MCP 서버 설정
│   ├── standards/      # 코딩 컨벤션, Git 규칙
│   └── workflows/      # 개발, 배포 워크플로우
│
├── environment/        # 환경 설정
│   ├── wsl/            # WSL 최적화 가이드
│   └── troubleshooting/# 문제 해결 가이드
│
├── api/                # API 문서
│
└── archive/            # 완료된 문서 아카이브

reports/                 # 분석 리포트 및 기록 (시점별 스냅샷)
├── planning/           # 계획 및 분석
│   ├── TODO.md         # 현재 작업 목록
│   ├── analysis/       # 분석 보고서
│   └── templates/      # 작업 계획 템플릿
│
└── history/            # 완료된 작업 기록
    ├── completed/      # 완료된 주요 작업
    ├── planning/       # 구현된 설계 문서
    └── reports/        # 완료된 프로젝트 보고서

logs/                    # 런타임 로그 (Git 미추적)
├── code-reviews/       # AI 코드 리뷰
└── ...
```

---

## 문서 vs 리포트 구분

| 구분 | 위치 | 특성 | 예시 |
|------|------|------|------|
| **문서** | `docs/` | 항상 최신 유지 | 가이드, 설정, API 레퍼런스 |
| **리포트** | `reports/` | 시점별 스냅샷 | 분석 결과, 완료 보고서 |
| **로그** | `logs/` | 임시 데이터 | 코드 리뷰, 빌드 로그 |

---

## 문서 작성 가이드

### 1. 새로운 계획 작성 시
* **위치**: `reports/planning/`
* **템플릿**: `reports/planning/templates/work-plan-template.md` 사용
* **절차**: 작성 → 진행 → 완료 시 `reports/history/`로 이동

### 2. 아키텍처 변경 시
* **위치**: `docs/core/architecture/`
* **원칙**: 기술 스택 변경 시 관련 문서 반드시 업데이트

### 3. 개발 표준 변경 시
* **위치**: `docs/development/standards/`
* **알림**: 변경 사항을 팀원(또는 AI Agent)에게 공유 필수

---

## Quick Links (자주 찾는 문서)

* **현재 작업 목록**: [`reports/planning/TODO.md`](../reports/planning/TODO.md)
* **기술 스택**: [`docs/core/architecture/`](./core/architecture/)
* **코딩 컨벤션**: [`docs/development/standards/`](./development/standards/)
* **환경 설정**: [`docs/environment/`](./environment/)
