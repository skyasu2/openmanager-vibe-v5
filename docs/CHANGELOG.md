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
