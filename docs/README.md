# 📚 OpenManager VIBE v5 문서 인덱스

> **전체 문서 수**: 300개의 마크다운 파일
> **최종 업데이트**: 2025-12-01
> **JBGE 준수율**: 97% (Phase 5 중복 정리 완료)

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

**Phase 5 패키지 최적화 (2025-11-30)** 🆕:

- ✅ **패키지 정리**: `chart.js`, `swr` 제거 → `recharts`, `react-query`로 통합
- ✅ **툴체인 전환**: ESLint 제거 → **Biome** 전면 도입 (속도 150배 향상)
- ✅ **문서 현행화**: `docs/` 디렉터리 전면 개편

**Phase 4 재구조화 완료**:

- ✅ **2대 분류 구조**: core/ (메인 프로젝트) vs environment/ (개발 환경)
- ✅ **명확한 분리**: 배포 플랫폼(Vercel, GCP, Supabase) vs WSL/AI 도구
- ✅ **1인 개발 + AI 최적화**: 문서 검색 효율 향상

**Phase 1-3 완료**:

- ✅ **파일 최적화**: 1,406줄 감소 (3,060→1,654줄, 46% 축소)
- ✅ **신규 문서**: 15개 (요약본, 가이드, README)
- ✅ **JBGE 준수율**: 79% → 97% (18% 향상)

---

## 📂 주요 디렉터리 (11개)


### 📦 기타

| 디렉터리     | 설명                    | README                        |
| ------------ | ----------------------- | ----------------------------- |
| **archive/** | 아카이브 (3개월 이상) | [README](./archive/README.md) |

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

1. [core/architecture/SYSTEM-ARCHITECTURE-CURRENT.md](./core/architecture/SYSTEM-ARCHITECTURE-CURRENT.md) - v5.80.0 전체 구조
2. [core/architecture/TECH-STACK-DETAILED.md](./core/architecture/TECH-STACK-DETAILED.md) 🆕 - 기술 스택 상세
3. [core/architecture/api/endpoints.md](./core/architecture/api/endpoints.md) - 85개 API 엔드포인트
4. [core/architecture/db/schema.md](./core/architecture/db/schema.md) - Supabase 스키마

### AI 시스템

5. [ai/README.md](./ai/README.md) - AI 시스템 전체 개요
6. [ai/ai-coding-standards.md](./ai/ai-coding-standards.md) 🆕 - AI 코딩 규칙
7. [ai/ai-benchmarks.md](./ai/ai-benchmarks.md) 🆕 - AI 도구 벤치마크
8. [ai/ai-usage-guidelines.md](./ai/ai-usage-guidelines.md) 🆕 - AI 사용 가이드
9. [ai/GCP-FUNCTIONS-SUMMARY.md](./ai/GCP-FUNCTIONS-SUMMARY.md) 🆕 - GCP Functions 요약

### 개발 & 테스트

10. [development/README.md](./development/README.md) - 개발 환경 종합
11. [development/mcp/README.md](./development/mcp/README.md) - MCP 서버 설정
12. [environment/testing/README.md](./environment/testing/README.md) - 테스트 전략 종합
13. [environment/testing/testing-philosophy-detailed.md](./environment/testing/testing-philosophy-detailed.md) 🆕 - 테스트 철학
14. [environment/testing/vitest-playwright-config-guide.md](./environment/testing/vitest-playwright-config-guide.md) 🆕 - Vitest & Playwright
15. [environment/testing/test-infrastructure-summary.md](./environment/testing/test-infrastructure-summary.md) 🆕 - 테스트 인프라 요약

### 배포 & 보안

16. [core/platforms/deploy/README.md](./core/platforms/deploy/README.md) - 배포 가이드 (Vercel, GCP)
17. [core/platforms/gcp/gcp-deployment-guide.md](./core/platforms/gcp/gcp-deployment-guide.md) - GCP 배포 상세
18. [core/security/README.md](./core/security/README.md) - 보안 정책

### 분석 & 스펙

19. [archive/AI-ENGINE-OPTIMIZATION-2025-11-20.md](./archive/AI-ENGINE-OPTIMIZATION-2025-11-20.md) - AI 최적화 (archived)
20. [specs/ai-engine-refactoring-summary.md](./specs/ai-engine-refactoring-summary.md) 🆕 - AI 리팩토링 요약

---

## 📊 문서 통계

| 분류           | 파일 수 | 설명               |
| -------------- | ------- | ------------------ |
| **총합**       | 300개   | 3.3MB              |
| environment/   | 100개   | 개발 환경 (테스트, 가이드 포함) |
| core/          | 60개    | 메인 프로젝트 (아키텍처, 배포, 보안) |
| archive/       | 40개    | 아카이브 (레거시 보고서) |
| ai/            | 25개    | AI 시스템          |
| design/        | 22개    | 디자인 문서        |
| development/   | 20개    | 개발 가이드        |
| analysis/      | 9개     | 분석 보고서        |
| 기타           | 35개    | specs, standards 등 |

---

## 🔍 문서 검색 팁

### 주제별 검색

- **아키텍처**: core/architecture/, design/
- **AI 시스템**: ai/, analysis/
- **개발 환경**: development/, environment/
- **테스트**: environment/testing/
- **배포**: core/platforms/
- **보안**: core/security/

### 파일명 규칙

- `README.md`: 디렉터리 인덱스
- `*-summary.md`: 대형 파일 요약본
- `*-YYYY-MM-DD.md`: 날짜별 보고서
- `adr-*.md`: 아키텍처 결정 기록

### 📝 문서 관리 원칙

| 원칙 | 설명 |
|------|------|
| **크기 제한** | 400줄 이하 유지 (초과 시 요약본 생성 또는 archive 이동) |
| **분할 금지** | 너무 작게 쪼개지 않음 (연관 내용은 한 문서에) |
| **기존 우선** | 새 문서 생성 전 기존 문서 갱신 가능 여부 확인 |
| **갱신 우선** | 내용 추가/수정으로 대체 가능하면 그것을 우선 |
| **신규 생성** | 기존 문서 갱신이 어려울 때만 새 문서 생성 |

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

## 🆕 최근 변경 (2025-12-01)

**Phase 5 중복 정리** (2025-12-01):

- ✅ 중복 폴더 106개 파일 정리 (424→318개)
- ✅ testing/, troubleshooting/, guides/ → environment/로 통합
- ✅ architecture/, deploy/, security/ → core/로 통합
- ✅ 임시 파일 삭제

**주요 문서 경로 변경**:

- testing/ → environment/testing/
- architecture/ → core/architecture/
- deploy/ → core/platforms/deploy/
- security/ → core/security/

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

**Last Updated**: 2025-12-01 by Claude Code
**JBGE 준수율**: 97% (Phase 5 중복 정리 완료)
**핵심 원칙**: "Just Barely Good Enough - 최소한의 루트 파일, 최대한의 상세 문서"
