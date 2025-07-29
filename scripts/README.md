# Scripts Directory

정리되고 체계화된 프로젝트 스크립트 모음입니다.

## 📁 디렉토리 구조

```
scripts/
├── env/                    # 환경 설정
│   ├── setup.sh           # 통합 환경 설정
│   └── vercel.sh          # Vercel 전용 (예정)
├── mcp/                    # MCP 관련
│   ├── setup.sh           # MCP 설정 (WSL 포함)
│   ├── validate.sh        # MCP 검증
│   ├── monitor.sh         # 상태 모니터링
│   └── reset.sh           # 설정 초기화
├── security/               # 보안 관련
│   ├── check-all-secrets.sh      # 전체 시크릿 검사
│   ├── check-hardcoded-secrets.sh # 하드코딩 시크릿 검사
│   ├── check-secrets-in-docs.sh   # 문서 내 시크릿 검사
│   ├── fix-oauth.sh              # OAuth 수정
│   └── secure-env.sh             # 환경 보안
├── deployment/             # 배포 관련
│   ├── emergency.sh       # 긴급 배포
│   └── vercel-emergency.sh # Vercel 긴급 배포
├── maintenance/            # 유지보수
│   ├── cleanup.sh         # 브랜치 정리
│   ├── archive.sh         # 문서 아카이브
│   ├── jbge-cleanup.sh    # JBGE 원칙 정리
│   └── weekly-review.sh   # 주간 문서 검토
└── testing/                # 테스트 관련
    ├── run-tests.sh       # 테스트 실행
    └── fix-tests.sh       # 테스트 자동 수정
```

## 🚀 주요 스크립트

### 환경 설정 (`env/`)

#### `setup.sh`

프로젝트 환경 변수를 설정하고 관리합니다.

```bash
# 전체 설정 (권장)
./scripts/env/setup.sh

# 옵션:
# 1) 전체 설정 - 환경 변수 확인, 대화형 설정, 백업, 검증
# 2) 상태 확인만 - 현재 환경 변수 상태 확인
# 3) 대화형 설정 - 누락된 환경 변수만 입력
# 4) 백업만 - 현재 .env.local 백업
```

### MCP 서버 (`mcp/`)

#### `setup.sh`

Claude Code의 MCP 서버를 설정합니다.

```bash
# MCP 서버 통합 설정
./scripts/mcp/setup.sh

# 기능:
# - WSL 환경 확인
# - 필수 환경 변수 검증
# - MCP 서버 패키지 설치
# - Claude 설정 파일 생성
```

#### `validate.sh`

MCP 설정을 검증합니다.

```bash
# 설정 검증
./scripts/mcp/validate.sh
```

#### `monitor.sh`

MCP 서버 상태를 모니터링합니다.

```bash
# 실시간 모니터링
./scripts/mcp/monitor.sh
```

### 보안 (`security/`)

#### `check-all-secrets.sh`

프로젝트 전체에서 시크릿을 검사합니다.

```bash
# 전체 시크릿 검사
./scripts/security/check-all-secrets.sh
```

### 배포 (`deployment/`)

#### `emergency.sh`

긴급 상황 시 빠른 배포를 수행합니다.

```bash
# 긴급 배포
./scripts/deployment/emergency.sh
```

### 유지보수 (`maintenance/`)

#### `cleanup.sh`

오래된 Git 브랜치를 정리합니다.

```bash
# 브랜치 정리
./scripts/maintenance/cleanup.sh
```

#### `weekly-review.sh`

주간 문서 검토 및 정리를 수행합니다.

```bash
# 주간 검토
./scripts/maintenance/weekly-review.sh
```

### 테스트 (`testing/`)

#### `run-tests.sh`

프로젝트 테스트를 실행합니다.

```bash
# 테스트 실행
./scripts/testing/run-tests.sh
```

## 🔄 마이그레이션 가이드

기존 스크립트 경로에서 새 경로로의 매핑:

| 기존 경로                               | 새 경로                          |
| --------------------------------------- | -------------------------------- |
| `.claude/setup-mcp-env.sh`              | `scripts/mcp/setup.sh`           |
| `scripts/setup-mcp-*.sh`                | `scripts/mcp/setup.sh`           |
| `scripts/validate-mcp-setup.sh`         | `scripts/mcp/validate.sh`        |
| `.claude/monitor-mcp-health.sh`         | `scripts/mcp/monitor.sh`         |
| `scripts/check-*-secrets.sh`            | `scripts/security/check-*.sh`    |
| `local-dev/scripts/cleanup-branches.sh` | `scripts/maintenance/cleanup.sh` |
| `scripts/test-runner.sh`                | `scripts/testing/run-tests.sh`   |

## 📝 사용 규칙

1. **실행 권한**: 모든 스크립트는 실행 가능해야 합니다

   ```bash
   chmod +x scripts/**/*.sh
   ```

2. **경로**: 스크립트는 프로젝트 루트에서 실행하세요

   ```bash
   cd /mnt/d/cursor/openmanager-vibe-v5
   ./scripts/env/setup.sh
   ```

3. **환경 변수**: 스크립트 실행 전 필요한 환경 변수를 설정하세요

   ```bash
   # 먼저 환경 설정
   ./scripts/env/setup.sh

   # 그 다음 다른 스크립트 실행
   ./scripts/mcp/setup.sh
   ```

4. **로깅**: 중요한 작업은 로그를 남깁니다
   - 로그 위치: `logs/scripts/`
   - 백업 위치: `.env.backups/`

## 🆘 문제 해결

### 스크립트가 실행되지 않을 때

```bash
# 실행 권한 확인
ls -la scripts/category/script.sh

# 실행 권한 부여
chmod +x scripts/category/script.sh

# Bash로 직접 실행
bash scripts/category/script.sh
```

### 환경 변수 오류

```bash
# 환경 변수 상태 확인
./scripts/env/setup.sh
# 옵션 2 선택 (상태 확인만)

# 누락된 변수 설정
./scripts/env/setup.sh
# 옵션 3 선택 (대화형 설정)
```

### MCP 서버 오류

```bash
# 설정 초기화
./scripts/mcp/reset.sh

# 재설정
./scripts/mcp/setup.sh

# 검증
./scripts/mcp/validate.sh
```

## 🔐 보안 주의사항

- 민감한 정보(API 키, 토큰 등)는 절대 스크립트에 하드코딩하지 마세요
- 환경 변수는 `.env.local` 파일에만 저장하세요
- `.env.local` 파일은 Git에 커밋하지 마세요
- 정기적으로 시크릿 검사를 실행하세요

## 🤝 기여 가이드

새 스크립트 추가 시:

1. 적절한 카테고리 디렉토리에 배치
2. 실행 권한 부여
3. 이 README에 문서화
4. 헤더에 목적과 사용법 주석 추가

예시:

```bash
#!/bin/bash
# 스크립트 이름: example.sh
# 목적: 예시 스크립트
# 사용법: ./scripts/category/example.sh [옵션]
# 작성일: 2025-07-29
```

---

💡 **팁**: 자주 사용하는 스크립트는 별칭(alias)을 만들어 사용하세요.

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
alias mcp-setup='cd /mnt/d/cursor/openmanager-vibe-v5 && ./scripts/mcp/setup.sh'
alias env-check='cd /mnt/d/cursor/openmanager-vibe-v5 && ./scripts/env/setup.sh'
```
