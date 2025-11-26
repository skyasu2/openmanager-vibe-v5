# Claude Code 사용량 확인 가이드

**목적**: 필요할 때 수동으로 Claude Code 사용량을 확인하는 방법

---

## 📊 사용량 확인 명령어

### 1. 실제 사용량 확인 (권장)

Claude Code 내에서 다음 명령어 실행:

```
/usage
```

**출력 예시**:

- Current session: 7% used
- Current week (all models): 15% used
- Current week (Sonnet only): 23% used
- Resets: Dec 2, 3:59am (Asia/Seoul)

**특징**:

- ✅ 실제 API 사용량 (Anthropic 청구 기준)
- ✅ 100% 정확도
- ✅ 세션/주간/모델별 분리
- ✅ 리셋 시점 안내

---

### 2. 추정 사용량 확인 (참고용)

터미널에서 다음 명령어 실행:

```bash
npx ccusage@latest
```

**출력 예시**:

- Weekly tokens: 1,025,873 tokens
- Estimated cost: $569.27
- Cache Read: 88.5%

**특징**:

- ⚠️ 추정치 (80-90% 정확도)
- ⚠️ 실제 비용과 차이 발생 가능
- ✅ 토큰 효율성 분석 가능 (Cache Read 등)
- ✅ 상세 메트릭 제공

---

## 🎯 사용 전략

**모니터링 방식**:

- 필요할 때만 `/usage` 수동 확인
- 자동 스크립트 없음 (온디맨드 방식)

**사용량 추적 대상**:

- Claude Code만 사용량 추적
- Codex/Gemini/Qwen은 추적 불필요 (무료 또는 별도 관리)

**최적화 기법**:

- @-mention 서버 필터링 (10-18% 토큰 절약)
- Cache Read 목표: 90% 이상
- Extended Thinking 적절히 활용

---

## 📈 안정성 기준

**주간 사용률**:

- 🟢 0-30%: 매우 안정적
- 🟡 31-60%: 안정적
- 🟠 61-80%: 주의 필요
- 🔴 81-100%: 최적화 필요

**현재 상태** (2025-11-26 기준):

- 주간 사용률: 15% ✅
- 평가: 매우 안정적

---

## 💡 팁

**언제 확인하나요?**

- 주간 단위 확인 (월요일 권장)
- 대량 작업 후 확인
- 리셋 전날 확인 (매주 일요일)

**최적화 방법**:

- 복잡한 작업: @serena, @context7 등 필요한 서버만 지정
- 간단한 작업: 서버 필터링 없이 진행
- Extended Thinking: 꼭 필요할 때만 사용

---

**관련 문서**:

- CLAUDE.md - 프로젝트 메모리
- docs/status.md - 현재 상태
