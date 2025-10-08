# Multi-AI 교차검증 시스템 아키텍처 결정

**날짜**: 2025-10-08
**버전**: 1.0.0
**상태**: 3-AI 교차검증 진행 중 (Codex 완료, Gemini/Qwen MCP 타임아웃)

---

## 📊 Executive Summary

### 실제 검증 결과

**현재 상황**:
- ✅ **Codex MCP**: 8.7초 응답 성공 (실무 관점 분석 완료)
- ❌ **Gemini MCP**: Request timed out (MCP 타임아웃)
- ❌ **Qwen MCP**: Request timed out (MCP 타임아웃)

**핵심 발견**:
> MCP v3.8.0의 타임아웃 문제가 실제 검증 중에도 재현됨. 이것이 바로 아키텍처 결정이 필요한 근본 원인.

### Codex 평가 요약 (실무 관점)

**종합 판단**: Bash Wrapper 스크립트가 실무에서 가장 안정적이고 ROI 높음

**점수 (안정성/유지보수성/ROI, 10점 만점)**:
- **MCP v3.9.0 비동기 패턴**: 9 / 6 / 4
- **Bash Wrapper 스크립트**: 8 / 8 / 8 ⭐
- **직접 CLI 호출**: 5 / 5 / 6

---

## 🎯 3가지 구현 방식 비교

### 1. MCP v3.9.0 비동기 패턴

**설계**:
```typescript
class AsyncTaskQueue {
  startAsyncQuery(ai: string, query: string): taskId
  getQueryStatus(taskId: string): { status, progress, result? }
  waitQueryComplete(taskId: string, timeout: number): result
}
```

**특징**:
- ✅ 타임아웃 100% 해결 (Claude Code 60-90s 제약 회피)
- ✅ 상태 추적 및 재현성 우수
- ❌ 복잡도 +50% (AsyncTaskQueue, 3-step API)
- ❌ 13시간 개발 투자 필요
- ❌ 유지보수 전문 지식 필요

**Codex 평가**:
- **안정성**: 9/10 - 타임아웃 완벽 해결, 고신뢰 파이프라인
- **유지보수성**: 6/10 - 복잡도 상승, 로그 해석 난도 증가
- **ROI**: 4/10 - 13시간 투자 대비 현재 Wrapper로도 95% 성공률

---

### 2. Bash Wrapper 스크립트 (현재)

**설계**:
```bash
# 적응형 타임아웃
codex-wrapper.sh "쿼리"     # 30-120초
gemini-wrapper.sh "쿼리"    # 60초
qwen-wrapper.sh -p "쿼리"   # 90초 (Plan Mode)

# 자동 재시도 (1회, 타임아웃 50% 증가)
# 성능 로깅: logs/ai-perf/*.log
```

**특징**:
- ✅ 즉시 사용 가능 (추가 투자 0시간)
- ✅ MCP 독립적 (MCP 장애 시 fallback)
- ✅ 95% 성공률, 재시도 로직
- ✅ 단순한 트러블슈팅 (단일 스크립트)
- ❌ Claude Code 타임아웃 완전 회피 불가 (60-90s 제약)

**Codex 평가**:
- **안정성**: 8/10 - 현재 95% 성공률, 실전 검증됨
- **유지보수성**: 8/10 - 단일 스크립트, 빠른 디버깅
- **ROI**: 8/10 - 투자 0시간, 즉시 가치 제공 ⭐

---

### 3. 서브에이전트 직접 CLI 호출

**설계**:
```bash
# Multi-AI Verification Specialist
codex exec "쿼리" > /tmp/codex.txt &
gemini "쿼리" > /tmp/gemini.txt &
qwen -p "쿼리" > /tmp/qwen.txt &
wait

# Claude가 /tmp 파일 읽고 종합
```

**특징**:
- ✅ 가장 단순한 구현
- ✅ MCP 불필요 (완전 독립)
- ❌ 수동 병렬 조율 필요
- ❌ /tmp 파일 관리 번거로움
- ❌ 재현성 낮음 (사람 의존)

**Codex 평가**:
- **안정성**: 5/10 - 수작업 오류, 장애 대응 어려움
- **유지보수성**: 5/10 - /tmp 파일 추적 번거로움
- **ROI**: 6/10 - 빠른 실험엔 유용, 장기 운영엔 부적합

---

## 🔍 Codex 상세 분석 (실무 관점)

### ROI 분석

**MCP v3.9.0 비동기 패턴**:
- **투자**: 13시간 개발
- **이익**: 타임아웃 100% → 95% (5% 개선)
- **ROI**: 낮음 (현재 Wrapper로도 95% 달성)

**Bash Wrapper**:
- **투자**: 0시간 (이미 구현됨)
- **이익**: 즉시 95% 성공률
- **ROI**: 최고 ⭐

### 디버깅 용이성

| 방식 | 로그 복잡도 | 트러블슈팅 시간 | 팀 공유 |
|------|------------|----------------|---------|
| MCP 비동기 | 높음 (큐, 상태) | 30분+ | 전문 지식 필요 |
| Bash Wrapper | 낮음 (단일 로그) | 5분 | 즉시 공유 가능 ⭐ |
| 직접 CLI | 중간 (/tmp) | 15분 | 수동 전달 |

### 장애 대응

**MCP 타임아웃 발생 시**:
- **MCP 비동기**: MCP 의존적, 비동기 큐도 영향
- **Bash Wrapper**: MCP 독립적, 계속 동작 ⭐
- **직접 CLI**: MCP 독립적, 계속 동작

### 팀 협업

**신규 팀원 온보딩**:
- **MCP 비동기**: AsyncTaskQueue 학습 필요 (1-2일)
- **Bash Wrapper**: Bash 기본 지식만 필요 (1시간) ⭐
- **직접 CLI**: Bash + /tmp 패턴 이해 (2시간)

---

## 📈 실제 검증 결과 분석

### MCP 타임아웃 재현

**검증 과정**:
1. ✅ `mcp__multi-ai__queryCodex()` → 8.7초 성공
2. ❌ `mcp__multi-ai__queryGemini()` → Request timed out
3. ❌ `mcp__multi-ai__queryQwen()` → Request timed out

**원인**:
- Claude Code 내부 60-90s 하드코딩 타임아웃
- Gemini/Qwen은 쿼리 복잡도에 따라 90초 이상 소요
- MCP v3.8.0의 600s 타임아웃 설정 무의미

**증거**:
```
MCP error -32001: Request timed out
```

### Bash Wrapper 대안

**즉시 실행 가능**:
```bash
# Gemini
./scripts/ai-subagents/gemini-wrapper.sh "아키텍처 분석"

# Qwen
./scripts/ai-subagents/qwen-wrapper.sh -p "성능 분석"
```

**특징**:
- ✅ MCP 타임아웃 영향 없음
- ✅ 적응형 타임아웃 자동 조절
- ✅ 재시도 로직 내장

---

## 💡 Codex 핵심 인사이트

### 1. 실무 안정성

> "MCP 비동기 패턴은 긴 개발 시간과 복잡도 상승이 부담이라 실무 즉시 도입엔 무겁지만, 장기적으로 고신뢰 자동화 파이프라인이 필요한 팀에만 적합."

### 2. ROI 판단

> "MCP v3.9.0 개선(13시간)은 타임아웃 100% 해결이라는 확실한 이점이 있지만, 복잡도 +50%와 추가 유지보수 부담을 감안하면 현재 wrapper 대비 ROI가 낮음."

### 3. 즉시 가치

> "즉시 사용 가능한 Bash Wrapper는 이미 높은 성공률(95%)과 재시도 로직으로 실질적 문제를 거의 해결하므로, 추가 투자 없이도 충분한 가치를 제공."

### 4. 디버깅 효율

> "Bash Wrapper: 단일 스크립트와 퍼포먼스 로그로 빠른 트러블슈팅 가능, 팀 간 공유도 간단."

---

## 🚨 현재 상태 및 제약사항

### Claude Code MCP 타임아웃 문제

**근본 원인**:
- Claude Code 내부 60-90s 하드코딩
- MCP 서버 타임아웃 설정 무시
- `MULTI_AI_TIMEOUT` 환경변수 무효

**영향**:
- Gemini/Qwen 복잡한 쿼리 시 타임아웃
- Multi-AI 교차검증 불안정
- MCP v3.8.0의 600s 설정 무의미

**해결 불가**:
- Claude Code 소스 수정 불가
- MCP 프로토콜 제약
- 비동기 패턴만이 근본 해결책

---

## 🎯 최종 권장사항

### Phase 1: 즉시 적용 (현재)

**선택**: Bash Wrapper 스크립트 유지 ⭐

**이유**:
1. **ROI 최고**: 투자 0시간, 즉시 95% 성공률
2. **안정성 검증**: 실전 운영 중, 재시도 로직 완비
3. **MCP 독립**: MCP 장애 시에도 동작
4. **유지보수 용이**: 단일 스크립트, 빠른 디버깅

**실행**:
```bash
# 현재 상태 유지
./scripts/ai-subagents/codex-wrapper.sh
./scripts/ai-subagents/gemini-wrapper.sh
./scripts/ai-subagents/qwen-wrapper.sh -p
```

### Phase 2: 장기 연구 (3개월 후)

**선택**: MCP v3.9.0 비동기 패턴 연구

**조건**:
1. Bash Wrapper 성공률 90% 미만 하락 시
2. 고신뢰 자동화 파이프라인 요구 발생 시
3. 13시간 투자 가능 시점 도래 시

**설계**:
```typescript
// AsyncTaskQueue 클래스
// startAsyncQuery, getQueryStatus, waitQueryComplete
// 타임아웃 100% 해결
```

### Phase 3: 비상 대안

**선택**: 서브에이전트 직접 CLI 호출

**용도**:
- MCP + Bash Wrapper 모두 장애 시
- 빠른 실험 및 프로토타입
- 일회성 교차검증

---

## 📊 종합 점수표

| 방식 | 안정성 | 유지보수성 | ROI | 설계품질* | 확장성* | 성능* | 총점 |
|------|--------|-----------|-----|----------|---------|-------|------|
| **MCP v3.9.0** | 9 | 6 | 4 | TBD | TBD | TBD | 19 + TBD |
| **Bash Wrapper** ⭐ | 8 | 8 | 8 | TBD | TBD | TBD | 24 + TBD |
| **직접 CLI** | 5 | 5 | 6 | TBD | TBD | TBD | 16 + TBD |

*TBD: Gemini(설계품질/확장성), Qwen(성능) 답변 대기 중 (MCP 타임아웃)

---

## 🔄 다음 단계

### 1. Gemini/Qwen 답변 수집

**방법**: Bash Wrapper로 직접 호출
```bash
# Gemini (아키텍처 관점)
./scripts/ai-subagents/gemini-wrapper.sh "3가지 방식 SOLID 원칙 평가"

# Qwen (성능 관점)
./scripts/ai-subagents/qwen-wrapper.sh -p "3가지 방식 성능 비교"
```

### 2. 종합 분석 완성

**목표**:
- 3-AI 합의 영역 식별
- 3-AI 충돌 영역 분석
- 최종 점수표 완성

### 3. 아키텍처 결정

**기준**:
- 총점 최고 방식
- 3-AI 합의 여부
- 실무 ROI 우선

---

## 📝 메타데이터

**검증 시작**: 2025-10-08 (현재 시각)
**Codex 응답 시간**: 8.7초
**Gemini/Qwen**: MCP 타임아웃 재현
**문서 버전**: 1.0.0 (Codex 분석 완료)
**상태**: Gemini/Qwen 답변 대기 중

---

## 🔗 관련 문서

- `packages/multi-ai-mcp/TIMEOUT_ANALYSIS.md` - MCP 타임아웃 근본 원인 분석
- `docs/claude/environment/multi-ai-strategy.md` - Multi-AI 전략
- `docs/quality/analysis/MCP_ENV_CONTROL_DESIGN.md` - MCP 환경변수 제어 설계
- `scripts/ai-subagents/*-wrapper.sh` - Bash Wrapper 스크립트

---

**💡 핵심 결론 (Codex 기반)**:

> Bash Wrapper 스크립트가 실무에서 가장 안정적이고 ROI 높음. MCP 비동기 패턴은 장기 연구 과제로 보류. 직접 CLI 호출은 비상 대안.

**증거**:
- ✅ Codex MCP 성공 (8.7초)
- ❌ Gemini/Qwen MCP 타임아웃 (실제 재현)
- ✅ Bash Wrapper 95% 성공률 (실전 검증)

**다음 액션**:
1. Bash Wrapper로 Gemini/Qwen 답변 수집
2. 3-AI 종합 분석 완성
3. 최종 아키텍처 결정
