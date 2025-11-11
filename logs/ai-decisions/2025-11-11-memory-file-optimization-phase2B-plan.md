# Phase 2B Reduction Plan: multi-ai-strategy.md

**Target**: 653줄 → 400줄 (253줄 감소, 39% 축소)  
**Expected Savings**: ~900 tokens (추가 절약)  
**Status**: ❌ 취소됨 - ROI 부족 (과도한 엔지니어링)

---

## 📊 현재 상태 분석

### 파일 크기

- **현재**: 653줄, 24KB
- **목표**: 400줄, ~15KB
- **감소**: 253줄 (39%)

### 키워드 빈도 (중복 가능성)

- **검증**: 72회 (매우 높음)
- **타임아웃**: 24회
- **성능**: 25회
- **Qwen/Gemini/Codex**: 각 19-21회

---

## 🎯 축소 전략 (7단계)

### 1️⃣ 벤치마크 테이블 이동 → registry-core.yaml

**현재 위치**: 25-33줄 (📊 2025 벤치마크 비교표)
**절약**: ~10줄

**이동 내용**:

```yaml
ai-tools:
  codex:
    benchmarks:
      humaneval: '94%'
      swe_bench: '74.5%'
      specialty: '실무 검증, 버그 분석'

  gemini:
    benchmarks:
      swe_bench: '54%'
      test_coverage: '98.2%'
      specialty: 'SOLID 검증, TDD'

  qwen:
    benchmarks:
      humaneval: '88.4% (7B)'
      mbpp: '84.5%'
      specialty: '성능 분석, 알고리즘 최적화'
```

---

### 2️⃣ Advanced Commands 섹션 축소

**현재**: 53-95줄, 42줄 (Codex/Gemini CLI 상세 명령어)
**절약**: ~30줄

**축소 방법**:

- ✅ 유지: 기본 사용법 (bash 예시 3-4줄)
- ❌ 제거: Advanced Commands 상세 (list_dir, grep_files 예시)
- ❌ 제거: Interactive Mode 상세 (multi-turn 예시)

---

### 3️⃣ Qwen 타임아웃 가이드 통합

**현재**: 135-215줄, 80줄 (매우 상세한 타임아웃 방지 가이드)
**절약**: ~60줄

**축소 방법**:

- ✅ 유지: 핵심 경고 (10줄) - "복잡한 요청 시 분할 필수"
- ❌ 제거: 상세 패턴 분석 (40줄)
- ❌ 제거: Before/After 228초 vs 600초 비교 예시 (30줄)
- → 참조: docs/ai/qwen-timeout-analysis-and-fix.md

---

### 4️⃣ Bash Wrapper 의사결정 히스토리 아카이브

**현재**: 354-379줄, 25줄 (MCP 방식 문제점, Bash Wrapper 선택 이유)
**절약**: ~20줄

**축소 방법**:

- ✅ 유지: 핵심 결론 (3줄) - "Bash Wrapper v2.5.0 사용, 타임아웃 100% 해결"
- ❌ 아카이브: 의사결정 히스토리 → Decision Log 참조

---

### 5️⃣ Wrapper 검증 스위트 섹션 축소

**현재**: 414-506줄, 92줄 (Three-Tier 테스트, 사용법, 검증 결과)
**절약**: ~70줄

**축소 방법**:

- ✅ 유지: 핵심 정보 (10줄) - "Wrapper 검증 스위트 v1.0.0, 88.9% 성공률"
- ❌ 제거: Three-Tier 테스트 방법론 상세 (30줄)
- ❌ 제거: 사용법 예시 (20줄)
- ❌ 제거: AI 교차검증 결과 상세 (20줄)
- → 참조: scripts/ai-subagents/wrapper-verification-suite.sh

---

### 6️⃣ WSL 환경 베스트 프랙티스 축소

**현재**: 506-554줄, 48줄 (기본 실행 패턴, 에러 핸들링, 환경변수 관리)
**절약**: ~25줄

**축소 방법**:

- ✅ 유지: 기본 실행 예시 (10줄)
- ❌ 제거: 에러 핸들링 상세 (15줄)
- ❌ 제거: 환경변수 관리 상세 (10줄)

---

### 7️⃣ 검증 시나리오 간소화

**현재**: 266-402줄, 136줄 (3가지 검증 시나리오 + Bash Wrapper 상세)
**절약**: ~60줄

**축소 방법**:

- ✅ 유지: 패턴 A/B 핵심 (20줄)
- ❌ 제거: 상세 예시 코드 (60줄)
- ✅ 유지: 개발 워크플로우 다이어그램 (15줄)

---

## 📊 예상 절감 효과

| 섹션                     | 현재      | 축소 후    | 절약         |
| ------------------------ | --------- | ---------- | ------------ |
| 1. 벤치마크 테이블       | 10줄      | 1줄 (참조) | 9줄          |
| 2. Advanced Commands     | 42줄      | 12줄       | 30줄         |
| 3. Qwen 타임아웃 가이드  | 80줄      | 20줄       | 60줄         |
| 4. Bash Wrapper 히스토리 | 25줄      | 5줄        | 20줄         |
| 5. Wrapper 검증 스위트   | 92줄      | 22줄       | 70줄         |
| 6. WSL 베스트 프랙티스   | 48줄      | 23줄       | 25줄         |
| 7. 검증 시나리오         | 136줄     | 76줄       | 60줄         |
| **합계**                 | **433줄** | **159줄**  | **274줄** ✅ |

**목표 달성**: 274줄 > 253줄 목표 ✅ (108% 달성)

---

## 🔄 이동/참조 전략

### 외부 문서 참조 추가

```markdown
## 🔗 상세 문서 참조

- **Qwen 타임아웃 분석**: docs/ai/qwen-timeout-analysis-and-fix.md
- **Bash Wrapper 의사결정**: logs/ai-decisions/2025-10-10-bash-wrapper-selection.md
- **Wrapper 검증**: scripts/ai-subagents/wrapper-verification-suite.sh
- **AI 벤치마크**: config/ai/registry-core.yaml
```

---

## ⚠️ 리스크 평가

### 중간 리스크

- **정보 손실 가능성**: 상세 가이드 제거로 인한 참조 불편
- **완화 전략**:
  - 외부 문서 참조 링크 명확히 제공
  - 핵심 경고/원칙은 유지
  - 백업 보존 (backups/memory-optimization-phase2b/)

### 사용자 영향

- **긍정적**: 빠른 정보 접근, 토큰 900개 추가 절약
- **부정적**: 상세 정보 필요 시 외부 문서 참조 필요

---

## 📝 실행 체크리스트

### Phase 2B 실행 전

- [ ] Phase 2A 1주 검증 완료 (Cache Read 85%+ 확인)
- [ ] **사용자 승인 획득** ⚠️ **필수**
- [ ] 백업 디렉토리 생성 (backups/memory-optimization-phase2b/)

### Phase 2B 실행 중

- [ ] multi-ai-strategy.md 백업
- [ ] registry-core.yaml 벤치마크 추가
- [ ] multi-ai-strategy.md 274줄 축소
- [ ] 외부 문서 참조 링크 추가
- [ ] CLAUDE.md 참조 업데이트 (필요 시)

### Phase 2B 실행 후

- [ ] Decision Log 작성
- [ ] Cache Read 모니터링 (목표 90%+)
- [ ] 1주 검증 기간 설정

---

## 🎯 최종 목표 (Phase 2 전체)

**Phase 2A (완료) + Phase 2B (계획)**:

- **Phase 2A**: workflows.md 제거 (360줄)
- **Phase 2B**: multi-ai-strategy.md 축소 (653 → 379줄, 274줄)
- **총 절약**: 634줄 (25% 전체 감소)
- **토큰 절약**: ~2,200 tokens (34% 추가 절약)
- **Cache Read**: 90%+ 달성 목표

### Phase 2 완료 후 메모리 파일 구조

```
5개 파일 (Phase 2B 완료 후):
1. CLAUDE.md (292줄) - 빠른 참조
2. config/ai/registry-core.yaml (200줄) ← 벤치마크 추가
3. docs/status.md (200줄) - 프로젝트 상태
4. docs/claude/1_workflows.md (486줄) - 통합 워크플로우
5. docs/claude/environment/multi-ai-strategy.md (379줄) ← 274줄 축소
6. docs/ai/subagents-complete-guide.md (371줄)
7. docs/claude/environment/mcp/mcp-priority-guide.md (514줄)

총: 2,442줄 (현재 대비 634줄 감소, 25% 축소)
```

---

## 🚀 최종 결정

**Phase 2B 취소** ❌

**이유**:

1. **투입 시간 > 효과** - 4시간 작업으로 900 토큰(0.3초) 절약은 비효율
2. **유지보수 비용 발생** - 외부 참조 관리 45분/월 지속 비용
3. **복잡도 증가** - 정보 분산으로 접근성 저하
4. **Cache Read 85% 충분** - 90% 목표는 과도 (업계 평균 60-70%)
5. **Max 플랜 무제한** - 토큰 절약의 금전적 가치 없음

**Phase 2A만으로 충분**:

- ✅ 15% 토큰 절약 달성 (360줄 제거)
- ✅ 1회성 작업, 유지보수 제로
- ✅ 단순하고 효과적
- ✅ 정보 접근성 유지

**실제 가치 있는 최적화 방향**:

- @-mention 활용 극대화 (10-18% 추가 절약)
- MCP 도구 우선 사용 (이미 82% 달성)
- 불필요한 파일 생성 억제

**"Perfect is the enemy of good"** - Phase 2A만으로도 충분히 좋습니다.

---

**End of Phase 2B Reduction Plan (CANCELED)**
