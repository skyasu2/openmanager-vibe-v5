# 📚 OpenManager VIBE v5 문서 인덱스

> **전체 문서 수**: 219개의 마크다운 파일
> **최종 업데이트**: 2025-11-27
> **JBGE 준수율**: 97% (Phase 4 재구조화 완료)

**1인 개발 + AI 협업**을 위한 문서 구조

---

## 🎯 2대 분류 (Core vs Environment)

이 프로젝트 문서는 **메인 프로젝트**와 **개발 환경**으로 명확히 구분됩니다.

### 📦 [core/](./core/README.md) - 메인 프로젝트 (배포/운영)

**배포되고 실제로 동작하는 시스템**

- Vercel, GCP, Supabase 배포 플랫폼
- 시스템 아키텍처 및 API 설계
- 보안, 성능, 모니터링

### 💻 [environment/](./environment/README.md) - 개발 환경 (로컬 설정)

**로컬에서 개발하기 위한 모든 설정**

- WSL, Node.js 환경 설정
- Claude Code, AI 도구 (Codex, Gemini, Qwen)
- 개발 워크플로우, 테스트, 트러블슈팅

---

## 🎯 최근 업데이트 (2025-11-27)

**Phase 4 재구조화 완료** 🆕:

- ✅ **2대 분류 구조**: core/ (메인 프로젝트) vs environment/ (개발 환경)
- ✅ **명확한 분리**: 배포 플랫폼(Vercel, GCP, Supabase) vs WSL/AI 도구
- ✅ **1인 개발 + AI 최적화**: 문서 검색 효율 향상

**Phase 1-3 완료**:

- ✅ **파일 최적화**: 1,406줄 감소 (3,060→1,654줄, 46% 축소)
- ✅ **신규 문서**: 15개 (요약본, 가이드, README)
- ✅ **JBGE 준수율**: 79% → 97% (18% 향상)

---

## 📂 주요 디렉터리 (11개)

각 디렉터리의 README.md를 통해 상세 문서 목록과 설명을 확인하세요.

### 🏗️ 시스템 & 아키텍처

| 디렉터리          | 설명                          | README                                |
| ----------------- | ----------------------------- | ------------------------------------- |
| **architecture/** | 시스템 아키텍처, API 설계, DB | [README](./architecture/README.md) ⭐ |
| **design/**       | 설계 문서, ADR                | [README](./design/README.md)          |
| **performance/**  | 성능 최적화                   | [README](./performance/README.md)     |

### 🤖 AI & 개발

| 디렉터리         | 설명                                   | README                               |
| ---------------- | -------------------------------------- | ------------------------------------ |
| **ai/**          | AI 시스템, 서브에이전트, GCP Functions | [README](./ai/README.md) ⭐          |
| **development/** | 개발 환경, MCP, Playwright             | [README](./development/README.md) ⭐ |
| **testing/**     | 테스트 전략, E2E, Vitest               | [README](./testing/README.md) ⭐     |

### 🚀 운영 & 보안

| 디렉터리             | 설명                      | README                                |
| -------------------- | ------------------------- | ------------------------------------- |
| **deploy/**          | 배포 가이드 (Vercel, GCP) | [README](./deploy/README.md)          |
| **security/**        | 보안 정책, 취약점         | [README](./security/README.md)        |
| **troubleshooting/** | 문제 해결 가이드          | [README](./troubleshooting/README.md) |

### 📊 분석 & 기획

| 디렉터리      | 설명               | README                         |
| ------------- | ------------------ | ------------------------------ |
| **analysis/** | 분석 보고서 (14개) | [README](./analysis/README.md) |
| **planning/** | 기획 문서          | [README](./planning/README.md) |
| **specs/**    | 기술 스펙          | -                              |
| **guides/**   | 개발 가이드        | [README](./guides/README.md)   |

### 📦 기타

| 디렉터리     | 설명                    | README                        |
| ------------ | ----------------------- | ----------------------------- |
| **archive/** | 아카이브 (3개월 이상)   | [README](./archive/README.md) |
| **temp/**    | 임시 파일 (24시간 보관) | [README](./temp/README.md)    |

---

## 🚀 시작하기 (빠른 실행)

| 문서                               | 설명                        | 중요도 |
| ---------------------------------- | --------------------------- | ------ |
| [QUICK-START.md](./QUICK-START.md) | 5분 만에 프로젝트 실행      | ⭐⭐⭐ |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | 개발 환경, AI 도구, WSL     | ⭐⭐⭐ |
| [status.md](./status.md)           | 프로젝트 현재 상태 (9.0/10) | ⭐⭐   |

---

## 🎯 핵심 문서 (Top 20)

### 아키텍처 & 시스템

1. [architecture/SYSTEM-ARCHITECTURE-CURRENT.md](./architecture/SYSTEM-ARCHITECTURE-CURRENT.md) - v5.80.0 전체 구조
2. [architecture/TECH-STACK-DETAILED.md](./architecture/TECH-STACK-DETAILED.md) 🆕 - 기술 스택 상세
3. [architecture/api/endpoints.md](./architecture/api/endpoints.md) - 85개 API 엔드포인트
4. [architecture/db/schema.md](./architecture/db/schema.md) - Supabase 스키마

### AI 시스템

5. [ai/README.md](./ai/README.md) - AI 시스템 전체 개요
6. [ai/ai-coding-standards.md](./ai/ai-coding-standards.md) 🆕 - AI 코딩 규칙
7. [ai/ai-benchmarks.md](./ai/ai-benchmarks.md) 🆕 - AI 도구 벤치마크
8. [ai/ai-usage-guidelines.md](./ai/ai-usage-guidelines.md) 🆕 - AI 사용 가이드
9. [ai/GCP-FUNCTIONS-SUMMARY.md](./ai/GCP-FUNCTIONS-SUMMARY.md) 🆕 - GCP Functions 요약

### 개발 & 테스트

10. [development/README.md](./development/README.md) - 개발 환경 종합
11. [development/mcp/README.md](./development/mcp/README.md) - MCP 서버 설정
12. [testing/README.md](./testing/README.md) - 테스트 전략 종합
13. [testing/testing-philosophy-detailed.md](./testing/testing-philosophy-detailed.md) 🆕 - 테스트 철학
14. [testing/vitest-playwright-config-guide.md](./testing/vitest-playwright-config-guide.md) 🆕 - Vitest & Playwright
15. [testing/test-infrastructure-summary.md](./testing/test-infrastructure-summary.md) 🆕 - 테스트 인프라 요약

### 배포 & 보안

16. [deploy/README.md](./deploy/README.md) - 배포 가이드 (Vercel, GCP)
17. [deploy/gcp-deployment-guide.md](./deploy/gcp-deployment-guide.md) - GCP 배포 상세
18. [security/README.md](./security/README.md) - 보안 정책

### 분석 & 스펙

19. [analysis/AI-ENGINE-OPTIMIZATION-2025-11-20.md](./analysis/AI-ENGINE-OPTIMIZATION-2025-11-20.md) - AI 최적화
20. [specs/ai-engine-refactoring-summary.md](./specs/ai-engine-refactoring-summary.md) 🆕 - AI 리팩토링 요약

---

## 📊 문서 통계

| 분류          | 파일 수 | 크기   |
| ------------- | ------- | ------ |
| **총합**      | 219개   | ~5.2MB |
| architecture/ | 12개    | 368K   |
| testing/      | 36개    | 897K   |
| ai/           | 15개    | 368K   |
| analysis/     | 14개    | 164K   |
| development/  | 18개    | 298K   |
| design/       | 25개    | 445K   |
| 기타          | 99개    | ~2.7MB |

---

## 🔍 문서 검색 팁

### 주제별 검색

- **아키텍처**: architecture/, design/
- **AI 시스템**: ai/, analysis/
- **개발 환경**: development/, testing/
- **배포**: deploy/, troubleshooting/
- **보안**: security/

### 파일명 규칙

- `README.md`: 디렉터리 인덱스
- `*-summary.md`: 대형 파일 요약본
- `*-YYYY-MM-DD.md`: 날짜별 보고서
- `adr-*.md`: 아키텍처 결정 기록

### 빠른 찾기

```bash
# 키워드로 파일 찾기
find docs -name "*ai*" -type f

# 내용 검색
grep -r "테스트 전략" docs/

# 최근 수정된 파일
ls -lt docs/**/*.md | head -10
```

---

## 🆕 신규 문서 (2025-11-27)

**Phase 2 신규 문서** (3개):

- testing/testing-philosophy-detailed.md
- testing/vitest-playwright-config-guide.md
- architecture/TECH-STACK-DETAILED.md

**Phase 1 신규 문서** (8개):

- ai/ai-coding-standards.md
- ai/ai-benchmarks.md
- ai/ai-usage-guidelines.md
- ai/GCP-FUNCTIONS-SUMMARY.md
- testing/test-infrastructure-summary.md
- testing/universal-vitals-summary.md
- specs/ai-engine-refactoring-summary.md
- troubleshooting/playwright-mcp-summary.md

**Phase 1 신규 README** (4개):

- analysis/README.md
- planning/README.md
- archive/README.md
- temp/README.md

---

## 📌 루트 메모리 파일 (프로젝트 최상위)

| 파일                      | 설명                        | 줄 수 |
| ------------------------- | --------------------------- | ----- |
| [CLAUDE.md](../CLAUDE.md) | Claude Code 프로젝트 메모리 | 254줄 |
| [AGENTS.md](../AGENTS.md) | Codex CLI 환경 가이드       | 223줄 |
| [GEMINI.md](../GEMINI.md) | Gemini CLI 환경 가이드      | 200줄 |
| [QWEN.md](../QWEN.md)     | Qwen CLI 환경 가이드        | 222줄 |

**최적화 결과**: 1,201줄 → 899줄 (25% 감소)

---

**Last Updated**: 2025-11-27 by Claude Code
**JBGE 준수율**: 94% (Phase 2 완료)
**핵심 원칙**: "Just Barely Good Enough - 최소한의 루트 파일, 최대한의 상세 문서"
