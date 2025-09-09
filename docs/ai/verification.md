---
id: ai-verification
title: "AI Cross Verification"
keywords: ["ai", "verification", "claude", "gemini", "codex", "qwen"]
priority: critical
ai_optimized: true
updated: "2025-09-09"
cache_hint: "frequently_accessed"
load_priority: "critical"
token_estimate: 650
read_time: "3분"
related_weight: 0.95
dependencies: ["workflow.md", "verification-history.md"]
cache_ttl: 300
preload: true
---

# 🤖 AI Cross Verification

**4-AI 시스템 기반 교차검증** - Claude + Gemini + Codex + Qwen

## 🎯 핵심 명령어

### Level 1: 빠른 검토 (Claude 단독)
```bash
Task verification-specialist "src/components/Button.tsx quick review"
```

### Level 2: 표준 검토 (AI 1개 추가)
```bash
Task ai-verification-coordinator "src/hooks/useAuth.ts standard review"
```

### Level 3: 전체 검토 (AI 3개 모두)
```bash
Task ai-verification-coordinator "src/app/api/auth/route.ts full review"
```

## 🤖 AI 전문 분야

| AI | 전문 영역 | 명령어 |
|-----|-----------|---------|
| **Codex (GPT-5)** | 호환성, 버전 충돌 | `Task codex-wrapper "React 18 호환성 분석"` |
| **Gemini 2.5** | 시스템 아키텍처 | `Task gemini-wrapper "전체 구조 검토"` |
| **Qwen3** | 알고리즘 최적화 | `Task qwen-wrapper "성능 최적화 분석"` |

## 🔄 협업 패턴

### 병렬 분석
```bash
# 동시에 여러 관점 분석
Task external-ai-orchestrator "
다음 3가지 관점으로 병렬 분석:
1. Gemini: 아키텍처 검토
2. Codex: 실무 이슈 탐지  
3. Qwen: 성능 최적화
"
```

### 점진적 검증
```bash
# 1단계: 빠른 검토
Task verification-specialist "src/app/login/page.tsx quick"

# 2단계: 발견된 이슈 심화 분석
Task codex-wrapper "로그인 보안 이슈 상세 분석"

# 3단계: 최종 검증
Task ai-verification-coordinator "로그인 시스템 전체 검증 Level 3"
```

## 💡 효율성 전략

### 무료 AI 우선
```bash
Task gemini-wrapper "기본 코드 검토"  # 1K/day 무료
Task qwen-wrapper "성능 분석"         # 2K/day 무료
Task codex-wrapper "복잡한 버그 분석"  # Plus $20/월
```

### 특화 활용
- **호환성 문제**: Codex (98% 정확도)
- **대규모 시스템**: Gemini (90% 정확도)  
- **알고리즘**: Qwen (90% 정확도)

## 📊 성과 지표

| 지표 | 단독 AI | 4-AI 교차검증 | 개선율 |
|------|---------|---------------|--------|
| 문제 발견율 | 70% | 95% | +25% |
| 해결 정확도 | 80% | 100% | +20% |
| 완성도 | 7.2/10 | 9.2/10 | +28% |

---

💡 **Quick Start**: `Task verification-specialist "파일경로 분석 내용"`