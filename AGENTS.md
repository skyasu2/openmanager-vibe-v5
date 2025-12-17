# AGENTS.md - AI Agents Guidelines & Codex Reference

<!-- Version: 2.0.0 | Scope: All AI Agents -->
**모든 답변은 한국어로 제공 (기술 용어 영어 병기)**

## 🌐 Universal AI Guidelines (공통 지침)
이 프로젝트에 참여하는 모든 AI 에이전트(Claude, Codex, Gemini, Qwen 등)는 다음 규칙을 준수해야 합니다.

1.  **Language**: 한국어(Korean)를 기본 언어로 사용합니다.
2.  **Code Style**: TypeScript Strict Mode를 준수하며, `any` 사용을 금지합니다.
3.  **Role Awareness**: 자신의 역할을 명확히 인지하고, 다른 에이전트와 협업합니다.
    *   **Claude Code**: Project Lead & Orchestrator
    *   **Codex**: Implementation Specialist (구현 & 설계)
    *   **Gemini**: Cross-Check Reviewer (검증)
    *   **Qwen**: Optimization Specialist (최적화)

---

## 🤖 Codex CLI Reference
Codex CLI는 본 프로젝트의 **메인 구현 도구**입니다.

### 🚀 Quick Start (v0.69.0)
Codex는 GPT-5.1 기반의 강력한 추론 능력을 바탕으로, 복잡한 기능을 바닥부터 구현할 때 사용합니다.

```bash
# 기능 구현
codex exec "shadcn/ui 기반의 데이터 테이블 컴포넌트 전체 구현"

# 아키텍처 설계
codex exec "Next.js 16 Server Actions 인증 흐름 설계"
```

### 📋 Codex Coding Standards
Codex 에이전트는 코드를 생성할 때 다음 원칙을 반드시 따라야 합니다.

1.  **Simplicity (단순성)**: 과도한 기교를 피하고, 유지보수가 쉬운 직관적인 코드를 작성합니다. (KISS 원칙)
2.  **Robustness (견고성)**: 엣지 케이스와 예외 처리를 꼼꼼히 하여 런타임 에러를 방지합니다.
3.  **Type Safety (타입 안전성)**: TypeScript의 제네릭과 유틸리티 타입을 적절히 활용하여 타입 안전성을 보장합니다.

---

## 📚 Reference Links
각 에이전트별 상세 가이드는 아래 전용 문서를 참조하세요.

*   **Claude Guide**: `CLAUDE.md` (Project Rules & Workflow)
*   **Gemini Guide**: `GEMINI.md` (Review & Cross-Check)
*   **Qwen Guide**: `QWEN.md` (Performance & Algorithm)
*   **Project Status**: `docs/status.md` (Tech Stack & Architecture)

_Last Updated: 2025-12-17_
