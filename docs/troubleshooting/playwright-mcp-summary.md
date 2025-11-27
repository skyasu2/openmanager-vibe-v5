# Playwright MCP 문서 비교 - 요약

**원본**: playwright-mcp-documentation-comparison.md (732줄)
**작성일**: 2025-11-27
**목적**: Playwright MCP 설정 차이점 빠른 참조

---

## 📊 핵심 요약

**문제**: 기존 문서 방식 vs 실제 작동 방식 불일치

**주요 차이점**:

| 항목        | 기존                   | 실제                      | 개선 효과      |
| ----------- | ---------------------- | ------------------------- | -------------- |
| 패키지      | `@executeautomation/*` | `@playwright/mcp` v0.0.45 | Microsoft 공식 |
| 브라우저    | Windows Chrome         | Playwright Chromium       | 안정성 향상    |
| 환경변수    | 8개 필요               | 0개 필요                  | 100% 감소      |
| 설정 복잡도 | 434줄                  | ~50줄                     | 88% 감소       |

**해결 방법**:

1. 공식 패키지 사용 (`@playwright/mcp`)
2. Symlink로 브라우저 경로 해결
3. Wrapper 스크립트 제거
4. 기본 설정 사용

**결과**: 88.9% → 100% MCP 성공률 달성

---

**상세 내용**: @docs/troubleshooting/playwright-mcp-documentation-comparison.md (732줄)
