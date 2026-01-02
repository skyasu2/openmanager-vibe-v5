# Changelog

All notable changes to OpenManager VIBE v5 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Documentation baseline and improvement plan (`DOCS-BASELINE.md`)
- AI Engine 5W1H analysis document
- Tavily web search tool for AI Engine
- `llms.txt` for AI/LLM optimization

### Changed
- Cleaned up duplicate content in AI documentation
- Improved cross-references between docs

---

## [5.83.15] - 2026-01-03

### Changed
- **서버 모니터링 로그 형식 변경**: AI 친화적 메시지에서 실제 syslog 형식으로 전환
  - 형식: `hostname process[pid]: message`
  - 지원 소스: nginx, docker, kernel, systemd, mysqld, redis, java, haproxy, rsync, postgres, sshd
  - 실제 Linux 에러 코드 포함 (errno 28, 110, 111)
- 타입 정의 문서 (`docs/guides/types.md`) 현행화

### Removed
- `EnhancedServerMetrics`에서 `aiAnalysis` 필드 제거
  - 서버 모니터링 영역에서 Cloud Run 자동 호출 완전 분리
  - AI 기능은 AI 사이드바/페이지에서만 사용자 요청 시 호출
- `src/core/types/server.types.ts`에서 `aiAnalysis` 필드 제거

### Verified
- 서버 모니터링 영역(프론트엔드/백엔드)에서 Cloud Run 자동 호출 없음 확인
  - Dashboard 컴포넌트: `/api/servers-unified` (로컬 API만 호출)
  - API 라우트: JSON 파일 기반 데이터 제공
  - 서비스 레이어: 외부 호출 없음

---

## [5.83.14] - 2025-12-31

### Added
- Tavily web search tool integration (`searchWeb`)
- API key whitespace validation in model-config

### Fixed
- Mistral API key validation bug (whitespace handling)

### Documentation
- AI Engine 5W1H analysis document
- Documentation structure cleanup

---

## [5.83.13] - 2025-12-30

### Added
- RAG RPC functions for knowledge base
- Migration guide for command vectors

### Fixed
- Dead code removal and security hardening

---

## [5.83.12] - 2025-12-29

### Added
- Command vectors 1024d Mistral seed script
- CI/CD workflow improvements

### Changed
- Google AI references removed (Cloud Run migration complete)
- Frontend refactored for Cloud Run AI integration

### Documentation
- LLM Multi-Agent Architecture v4.0

---

## [5.83.11] - 2025-12-28

### Changed
- AI SDK v5 → v6 migration
- Cloud Run AI Engine updates (Mistral 1024d embedding)

### Fixed
- React Hydration error #418
- Google OAuth configuration

---

## [5.83.10] - 2025-12-27

### Added
- Data transparency improvements (estimated/auto-generated labels)
- Server card real API integration

### Fixed
- Graph black rendering issue
- Accessibility improvements

---

## [5.83.9] - 2025-12-26

### Changed
- EnhancedServerCard component refactoring (992→586 lines)
- E2E test cleanup

### Fixed
- Dashboard AI code review issues

---

## [5.83.8] - 2025-12-25

### Added
- Core AI logic tests (34 tests)

### Changed
- Package updates (minor/patch)
- Lint warning fixes

---

## Earlier Versions

For changes before v5.83.8, see [git log](https://github.com/skyasu2/openmanager-vibe-v5/commits/main).

---

## Version Numbering

- **Major (5.x.x)**: Breaking changes, major architecture shifts
- **Minor (x.84.x)**: New features, non-breaking changes
- **Patch (x.x.15)**: Bug fixes, documentation updates

## Links

- [Repository](https://github.com/skyasu2/openmanager-vibe-v5)
- [Documentation](./README.md)
- [Quick Start](./QUICK-START.md)
