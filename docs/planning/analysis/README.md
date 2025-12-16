---
category: analysis
purpose: technical_analysis_and_reports
ai_optimized: true
query_triggers:
  - '기술 분석'
  - '최적화 보고서'
  - '아키텍처 검토'
related_docs:
  - 'docs/archive/README.md'
last_updated: '2025-12-16'
---

# 📊 분석 및 보고서 (Analysis)

프로젝트의 주요 기술적 의사결정과 최적화 과정을 기록한 문서들입니다.

> **ℹ️ 참고**: 오래된 분석 보고서는 `docs/archive/`로 이동되었습니다.

## 📚 주요 문서

- **[ai-architecture-report.md](./ai-architecture-report.md)**: AI 아키텍처 보고서 (Quad Engine)
- **[ai-tool-comparison.md](./ai-tool-comparison.md)**: AI 도구 비교 (Claude/Codex/Gemini/Qwen)
- **[component-interaction.md](./component-interaction.md)**: 컴포넌트 상호작용 분석
- **[ui-ux-analysis.md](./ui-ux-analysis.md)**: UI/UX 분석 보고서

> **Note**: AI 리뷰 성능 분석은 `logs/code-reviews/reports/`로 이동됨

## 🔍 분석 카테고리

### AI 엔진 & 최적화
- AI 모델 성능 비교 및 최적화 전략
- 토큰 사용량 및 비용 분석

### 시스템 아키텍처
- 컴포넌트 상호작용 분석
- 사이드 이펙트 분석

### UI/UX
- 사용자 경험 개선 제안
- 디자인 시스템 분석

---

## 📅 분석 보고서 작성 규칙

1. **파일명**: `{주제}-analysis-YYYY-MM-DD.md` 또는 `{주제}-summary-YYYY-MM-DD.md`
2. **보관**: 3개월 이상 경과 시 `../archive/`로 이동
3. **요약**: 대형 파일(500줄 이상)은 요약본 생성

---

**관련 디렉터리**:

- `../ai/` - AI 시스템 문서
- `../archive/` - 아카이브된 분석 보고서
- `../specs/` - 기술 스펙
