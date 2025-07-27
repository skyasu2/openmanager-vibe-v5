# 스크립트 마이그레이션 안내

## 📢 중요 공지

2025년 1월 27일부로 프로젝트 스크립트가 재구성되었습니다.
중복 제거와 체계적인 관리를 위해 새로운 디렉토리 구조로 이동했습니다.

## 🔄 변경 사항

### 삭제된 중복 스크립트

- `.claude/setup-mcp-env.sh` (중복)
- `scripts/setup-mcp-env-wsl.sh` (중복)
- `scripts/setup-mcp-wsl.sh` (중복)
- `scripts/setup-mcp-wsl-final.sh` (중복)
- `local-dev/scripts/maintenance/cleanup-branches.sh` (중복)
- `scripts/vercel-env-setup.sh` (중복)

### 통합된 스크립트

모든 MCP 설정 스크립트 → `scripts/mcp/setup.sh`
모든 환경 설정 스크립트 → `scripts/env/setup.sh`

## 🆕 새로운 위치

| 기능         | 새 경로                          |
| ------------ | -------------------------------- |
| MCP 설정     | `scripts/mcp/setup.sh`           |
| MCP 검증     | `scripts/mcp/validate.sh`        |
| MCP 모니터링 | `scripts/mcp/monitor.sh`         |
| 환경 설정    | `scripts/env/setup.sh`           |
| 시크릿 검사  | `scripts/security/check-*.sh`    |
| 브랜치 정리  | `scripts/maintenance/cleanup.sh` |
| 테스트 실행  | `scripts/testing/run-tests.sh`   |

## 💡 사용 예시

### 이전 방식

```bash
# 여러 스크립트 중 어떤 것을 실행해야 할지 혼란
./.claude/setup-mcp-env.sh
# 또는
./scripts/setup-mcp-wsl-final.sh
```

### 새로운 방식

```bash
# 명확하고 일관된 경로
./scripts/mcp/setup.sh
```

## 🔧 마이그레이션 도움말

기존 스크립트를 참조하는 문서나 CI/CD가 있다면 다음과 같이 변경하세요:

```bash
# 예시: GitHub Actions
# 이전
- run: ./scripts/setup-mcp-env.sh

# 이후
- run: ./scripts/mcp/setup.sh
```

## ❓ 질문이 있으신가요?

- 스크립트 구조: `scripts/README.md` 참조
- 마이그레이션 계획: `docs/script-reorganization-plan.md` 참조

---

마지막 업데이트: 2025-01-27
