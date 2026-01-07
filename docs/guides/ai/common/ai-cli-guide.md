# AI CLI 가이드

> **통합 문서**: cli-strategy.md + verification.md + ai-benchmarks.md
> **최종 갱신**: 2026-01-08
>
> **Note**: Qwen 제거 (2026-01-07) - 평균 201초 응답, 13.3% 실패율로 2-AI 단순화

---

## Quick Start

```bash
# 빠른 검토 (Claude 단독)
Task verification-specialist "src/components/Button.tsx quick review"

# 표준 검토 (AI 1개 추가)
Task ai-verification-coordinator "src/hooks/useAuth.ts standard review"

# 전체 검토 (AI 2개 모두)
Task ai-verification-coordinator "src/app/api/auth/route.ts full review"
```

---

## 1. CLI 도구 현황

| CLI | 버전 | 요금제 | WSL 실행 | 전문 분야 |
|-----|------|--------|----------|----------|
| **Claude Code** | v2.0.76 | Max ($200) | ✅ 직접 | 메인 개발 |
| **Codex CLI** | v0.77.0 | Plus ($20) | ✅ `codex exec` | 코드 리뷰 |
| **Gemini CLI** | v0.22.4 | 무료 (1K/day) | ✅ `gemini` | 코드 리뷰 |

---

## 2. 벤치마크 성능

| AI 도구 | HumanEval | SWE-bench | 응답 시간 | 특화 영역 |
|---------|-----------|-----------|-----------|-----------|
| **Codex (GPT-5)** | 94% | 74.5% | ~8초 | 함수 단위 문제 해결 |
| **Gemini 2.5** | - | 54% | ~10초 | 범용 개발 |

### 상황별 최적 AI

| 상황 | 1순위 | 2순위 | 이유 |
|------|-------|-------|------|
| 함수 단위 버그 | Codex | Claude | HumanEval 94% |
| 다중 파일 리팩토링 | Codex | Gemini | SWE-bench 74.5% |
| 아키텍처 설계 | Gemini | Claude | 범용 개발 파트너 |
| 성능 최적화 | Codex | Claude | 실무 검증 |
| 통합 리뷰 | Claude | Gemini | 99.99% 가용성 |

---

## 3. 래퍼 명령어

### 가중치 기반 활용
```bash
# 가중치 순서 (Plus 사용량 여유)
Task codex-wrapper "실무 코드 검토"     # 0.99, 1순위
Task gemini-wrapper "시스템 분석"       # 0.98, 2순위
```

### 병렬 분석
```bash
Task external-ai-orchestrator "
다음 2가지 관점으로 병렬 분석:
1. Codex: 실무 이슈 탐지
2. Gemini: 아키텍처 검토
"
```

### 점진적 검증
```bash
# 1단계: 빠른 검토
Task verification-specialist "src/app/login/page.tsx quick"

# 2단계: 심화 분석
Task codex-wrapper "로그인 보안 이슈 상세 분석"

# 3단계: 최종 검증
Task ai-verification-coordinator "로그인 시스템 전체 검증 Level 3"
```

---

## 4. 협업 트리거 조건

### 1. 제3자 시선 필요 (Second Opinion)
```bash
Task gemini-wrapper "다음 구현 검토 및 개선점 제안: ${implementation}"
```

### 2. 병렬 작업 필요 (Parallel Processing)
```bash
# Claude: 메인 기능, Gemini: 백엔드 API 동시 진행
```

### 3. 사용자 직접 요청
```bash
Task gemini-wrapper "전체 코드베이스 중복 제거 방안 제시"
```

---

## 5. 비용 효율성

### 월 투자 현황
- **Multi-AI 비용**: $20/월 (Codex만 유료)
- **메인 개발**: Claude Max $200/월 (별도)
- **총 개발 도구**: $220/월
- **실제 가치**: $2,200+ (API 환산, 10배 절약)

### 성과 지표

| 지표 | 단독 AI | 래퍼 기반 교차검증 | 개선율 |
|------|---------|-------------------|--------|
| 문제 발견율 | 70% | 95% | +25% |
| 해결 정확도 | 80% | 98% | +18% |
| 완성도 | 7.2/10 | 9.0/10 | +25% |

---

## 6. DO/DON'T

### DO (래퍼 방식 권장)
- ✅ AI 교차검증 래퍼 통한 체계적 활용
- ✅ 명확한 역할 분담 (가중치 시스템)
- ✅ 병렬 처리로 시간 단축
- ✅ codex-wrapper 적극 활용 (Plus 여유)

### DON'T (직접 CLI 호출 지양)
- ❌ CLI 직접 호출 (`codex exec`, `gemini -p`)
- ❌ 무분별한 병렬 처리
- ❌ 단순 작업에 과도한 협업
- ❌ 무료 한도 초과

---

## Related Documents

- [AI Standards](./ai-standards.md) - 코딩 규칙 및 가이드라인
- [AI Workflow](./ai-workflow.md) - 협업 워크플로우
- [AI Wrappers Guide](./ai-wrappers-guide.md) - 래퍼 스크립트 상세

---

**이전 문서** (archived):
- `cli-strategy.md` → 이 문서로 통합
- `verification.md` → 이 문서로 통합
- `ai-benchmarks.md` → 이 문서로 통합
