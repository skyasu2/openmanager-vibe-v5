# QWEN.md - AI Performance & Algorithm Specialist

<!-- Version: 1.1.0 | Role: Performance Optimization -->
**모든 답변은 한국어로 제공 (기술 용어 영어 병기)**

## 🚀 Qwen CLI Quick Start
Qwen은 **성능 최적화, 알고리즘 복잡도 분석, 심층 구현**에 특화된 AI 도구입니다.
**Claude Code의 서브에이전트 개념과 무관하게, 독립적인 CLI 도구로 활용합니다.**

### 1. 성능 및 최적화 분석 (Performance)
```bash
# 알고리즘 시간 복잡도(Big-O) 분석
cat src/modules/graph.ts | qwen "시간 복잡도 분석 및 O(n) 최적화 방안"

# 메모리 누수 및 리소스 효율성 점검
cat src/components/HeavyList.tsx | qwen "렌더링 성능 최적화(Memoization) 제안"
```

### 2. 심층 구현 (Deep Implementation)
```bash
# 복잡한 로직 구현 (Plan Mode 권장)
qwen --approval-mode plan "Dijkstra 알고리즘을 변형한 최단 경로 로직 구현해줘"
```

---

## 🤝 AI 협업 프로토콜 (Collaboration)

**Qwen의 핵심 역할: Code Optimization (최적화)**
Claude Code가 작성한 로직의 효율성을 극한으로 끌어올립니다.

1.  **Complexity Analysis**: "이 루프가 성능 병목인가? 더 효율적인 자료구조는?"
2.  **Refactoring for Speed**: 가독성보다 성능이 중요한 Hot Path 최적화.
3.  **Algorithm Verification**: 수학적/논리적 정확성 검증.

> **Note**: 일반적인 코드 리뷰나 아키텍처 질문은 `gemini`를, 심도 있는 연산이 필요한 최적화는 `qwen`을 권장합니다.

_Last Updated: 2025-12-17_
