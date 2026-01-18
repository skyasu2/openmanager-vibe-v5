# Troubleshooting Guide

> **최종 갱신**: 2026-01-18
> **문서 수**: 2개 (8개에서 통합)

---

## Quick Start

```bash
# 문제 발생 시 첫 단계
npm run validate:all        # 전체 검증 실행

# MCP 서버 확인
claude mcp list
```

---

## Document Index

| 문서 | 설명 | 우선순위 |
|------|------|----------|
| **[common-issues.md](./common-issues.md)** | 일반 문제 해결 (TypeScript, Build, API, CI) | ⭐ 일반 |
| **[system-recovery-guide-2025.md](./system-recovery-guide-2025.md)** | 시스템 전체 복구 가이드 | ⚠️ 긴급 |

---

## 문제 해결 플로우

```
문제 유형 확인:
├─ TypeScript/빌드 에러? → common-issues.md
├─ API/Network 문제? → common-issues.md
├─ CI/CD 실패? → common-issues.md
├─ Claude 400 에러? → common-issues.md
└─ 시스템 전체 복구? → system-recovery-guide-2025.md
```

---

## 자주 사용하는 명령어

### 빌드 문제

```bash
rm -rf node_modules package-lock.json
npm install
npm run validate:all
```

### MCP 문제

```bash
claude mcp list
pkill -f claude && claude
```

### WSL 재시작

```bash
# Windows에서
wsl --shutdown
wsl
```

---

## Archived Documents

통합된 문서들은 `docs/archive/troubleshooting/`으로 이동:

- `common.md` → `common-issues.md`로 통합
- `build.md` → `common-issues.md`로 통합
- `claude-400-invalid-json.md` → `common-issues.md`로 통합
- `github-actions-analysis.md` → `common-issues.md`로 통합
- `playwright-mcp-recovery-guide.md` → 아카이브 (DEPRECATED)
- `playwright-mcp-side-effects-analysis.md` → 아카이브

---

## Related

- [Guides](../guides/) - How-to 가이드
- [Reference](../reference/) - 기술 레퍼런스
- [DEVELOPMENT.md](../DEVELOPMENT.md) - 개발 가이드

---

**핵심 철학**: "빠른 진단, 체계적 복구"
