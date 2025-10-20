# Side Effect Analysis: 서브에이전트 Registry 정리 (18개 → 12개)

**날짜**: 2025-10-19
**작성자**: Claude Code
**카테고리**: 아키텍처 정리, Side Effect 분석

---

## 📋 요약

**결정 사항**: 서브에이전트 registry에서 6개 에이전트 제거 (18개 → 12개)

**제거 대상**:

- 3개 Ghost Agents (파일 없음): codex-specialist, gemini-specialist, qwen-specialist
- 3개 Low-Value Agents: general-purpose (5.0/10), statusline-setup (3.0/10), output-style-setup (3.0/10)

**Side Effect 분석 결과**: ✅ **안전하게 제거 가능** (5개 파일 수정 필요)

---

## 🔍 Side Effect 분석 결과

### 1. MCP 도구 의존성 ✅ 없음

**분석 범위**: 전체 MCP 서버 설정 (registry.yaml lines 530-610)

- vercel, supabase, serena, context7, playwright, shadcn-ui, memory, time, sequential-thinking

**결과**: ✅ **의존성 없음**

- 어떤 MCP 서버도 제거 대상 6개 에이전트를 참조하지 않음
- 안전하게 제거 가능

---

### 2. 코드베이스 하드코딩 참조 ⚠️ 1개 발견

#### 발견 위치 1: `config/ai/registry.yaml` (line 550)

**위치**: workflows → development → steps → development

```yaml
# Line 550
development:
  - 'qwen-specialist: 로직 최적화' # ❌ 제거 필요
```

**영향**: workflow 예시에서 qwen-specialist 참조
**조치**: 해당 라인 제거 또는 실제 wrapper 명령으로 변경

#### 발견 위치 2: `docs/claude/environment/workflows.md` ✅ 변경 불필요

**위치**: Lines 121-133

```markdown
### ⚠️ 잘못된 방법: Task Tool 서브에이전트 (사용 금지)

❌ 잘못된 방법 - Claude 역할극
Task codex-specialist "코드 검증"
Task gemini-specialist "아키텍처 분석"  
Task qwen-specialist "성능 분석"
```

**평가**: ✅ **변경 불필요**

- 이미 "잘못된 방법"으로 명시되어 있음
- 교육적 목적 (무엇을 하지 말아야 하는지 설명)
- 실제 사용을 권장하지 않음

#### 발견 위치 3: 히스토리 파일들 ✅ 변경 불필요

**파일들**:

- `logs/ai-decisions/2025-10-01-side-effects-analysis.md`
- `logs/ai-decisions/2025-10-06-ai-role-reexamination.md`

**평가**: ✅ **변경 불필요**

- 히스토리 보관용 (archive)
- 과거 의사결정 기록
- 수정하면 안 됨 (변조 방지)

---

### 3. 문서 카운트 참조 📝 5개 인스턴스

#### 위치 1: `CLAUDE.md` (line 116)

```markdown
## 🎭 서브에이전트 활용 (18개 전문가)
```

**변경 필요**: `18개` → `12개`

#### 위치 2-5: `docs/ai/subagents-complete-guide.md` (4개 인스턴스)

```markdown
# Line 5

> 이 문서는 Claude Code에서 사용하는 18개 전문 서브에이전트의 활용법...

# Line 14

4. [핵심 에이전트 구성](#-핵심-에이전트-구성-18개)

# Line 183

## 🎯 핵심 에이전트 구성 (18개)

# Line 266

**최종 18개 에이전트 구성 완료** - 불필요한 에이전트 제거...
```

**변경 필요**: 모든 `18개` → `12개`

---

### 4. 실제 기능 영향 분석 ✅ 영향 없음

#### Multi-AI 교차검증 시스템

**현재 아키텍처**:

```
multi-ai-verification-specialist.md (오케스트레이터)
    ↓
Bash Wrapper Scripts (실행 계층)
    ├── codex-wrapper.sh v2.3.0
    ├── gemini-wrapper.sh v2.3.0
    └── qwen-wrapper.sh v2.3.0
```

**영향 평가**: ✅ **영향 없음**

- 실제 실행은 Bash wrapper scripts가 담당
- .md 파일들은 "theater" (사용자 지적)
- Orchestrator (multi-ai-verification-specialist.md)는 유지됨
- Wrapper scripts는 독립적으로 동작

**검증 방법**:

```bash
# 실행 후 테스트
./scripts/ai-subagents/codex-wrapper.sh "간단한 테스트"
./scripts/ai-subagents/gemini-wrapper.sh "간단한 테스트"
./scripts/ai-subagents/qwen-wrapper.sh "간단한 테스트"
```

#### GCP Cloud Functions 우선순위 수정

**현재 상태** (registry.yaml):

```yaml
gcp-cloud-functions-specialist:
  priority: 'LOW'
  necessity: '3/10'
```

**사용자 수정사항**: "GCP는 실제로 AI 기능에 사용 중" (2025-10-15)

**변경 필요**:

```yaml
gcp-cloud-functions-specialist:
  priority: 'HIGH'
  necessity: '9/10'
  note: 'AI assistant features 실 운영 중'
```

---

## 📝 Cleanup Plan (상세)

### Phase 1: Registry 정리 (`config/ai/registry.yaml`)

#### 작업 1: 6개 에이전트 정의 제거

**제거 범위**: Lines ~179-230 (추정)

**제거 대상**:

1. `codex-specialist:` (약 10줄)
2. `gemini-specialist:` (약 10줄)
3. `qwen-specialist:` (약 10줄)
4. `general-purpose:` (약 8줄)
5. `statusline-setup:` (약 8줄)
6. `output-style-setup:` (약 8줄)

**총 제거 줄 수**: ~54줄

#### 작업 2: Workflow 참조 제거 (line 550)

**현재**:

```yaml
development:
  steps:
    development:
      - 'debugger-specialist: 에러 근본 원인 분석'
      - 'qwen-specialist: 로직 최적화' # ❌ 제거
```

**수정 후**:

```yaml
development:
  steps:
    development:
      - 'debugger-specialist: 에러 근본 원인 분석'
      - 'Bash wrapper 직접 사용: qwen-wrapper.sh' # ✅ 실제 방법
```

#### 작업 3: GCP 우선순위 업데이트

**현재**:

```yaml
gcp-cloud-functions-specialist:
  priority: 'LOW'
```

**수정 후**:

```yaml
gcp-cloud-functions-specialist:
  priority: 'HIGH'
  note: 'AI assistant features 실 운영 중 (2025-10 사용자 수정)'
```

---

### Phase 2: 문서 카운트 업데이트

#### 파일 1: `CLAUDE.md` (1개 인스턴스)

**Line 116**:

```diff
- ## 🎭 서브에이전트 활용 (18개 전문가)
+ ## 🎭 서브에이전트 활용 (12개 전문가)
```

#### 파일 2: `docs/ai/subagents-complete-guide.md` (4개 인스턴스)

**Line 5**:

```diff
- > 이 문서는 Claude Code에서 사용하는 18개 전문 서브에이전트의 활용법...
+ > 이 문서는 Claude Code에서 사용하는 12개 전문 서브에이전트의 활용법...
```

**Line 14**:

```diff
- 4. [핵심 에이전트 구성](#-핵심-에이전트-구성-18개)
+ 4. [핵심 에이전트 구성](#-핵심-에이전트-구성-12개)
```

**Line 183**:

```diff
- ## 🎯 핵심 에이전트 구성 (18개)
+ ## 🎯 핵심 에이전트 구성 (12개)
```

**Line 266**:

```diff
- **최종 18개 에이전트 구성 완료** - 불필요한 에이전트 제거...
+ **최종 12개 에이전트 구성 완료** - 불필요한 에이전트 제거 및 최적화 완료 (2025-10-19)
```

---

### Phase 3: Decision Log 작성

**파일**: `logs/ai-decisions/2025-10-19-subagent-registry-cleanup.md`

**내용**:

- 제거 이유 (ghost agents + low-value agents)
- Side effect 분석 결과
- 수정된 파일 목록
- 검증 방법

---

## ✅ 검증 체크리스트

### 1. Bash Wrapper 동작 확인

```bash
# Codex wrapper 테스트
./scripts/ai-subagents/codex-wrapper.sh "TypeScript strict mode 확인"

# Gemini wrapper 테스트
./scripts/ai-subagents/gemini-wrapper.sh "SOLID 원칙 검토"

# Qwen wrapper 테스트
./scripts/ai-subagents/qwen-wrapper.sh "알고리즘 복잡도 분석"
```

**기대 결과**: 모든 wrapper 정상 동작 (독립적 실행)

### 2. Multi-AI Orchestrator 확인

```bash
# Task tool 호출 테스트
Task multi-ai-verification-specialist "간단한 코드 교차검증"
```

**기대 결과**: Orchestrator가 3개 wrapper를 병렬 실행하여 결과 종합

### 3. MCP 서버 상태 확인

```bash
./scripts/mcp-health-check.sh
```

**기대 결과**: 9/9 연결 성공 (변경 없음)

### 4. 문서 정합성 확인

```bash
# 18개 참조 남아있는지 확인
grep -r "18개" CLAUDE.md docs/ai/subagents-complete-guide.md

# 기대 결과: 검색 결과 0개
```

### 5. Registry YAML 유효성 확인

```bash
# YAML 문법 검사 (yamllint 있는 경우)
yamllint config/ai/registry.yaml
```

---

## 📊 영향 분석 요약

| 카테고리            | 영향                   | 안전성       |
| ------------------- | ---------------------- | ------------ |
| **MCP 의존성**      | 없음                   | ✅ 안전      |
| **Bash Wrappers**   | 독립 동작              | ✅ 안전      |
| **Multi-AI 시스템** | Orchestrator 유지      | ✅ 안전      |
| **문서 정합성**     | 5개 파일 업데이트 필요 | ⚠️ 수동 작업 |
| **Workflow 참조**   | 1개 제거 필요          | ✅ 쉬움      |

---

## 🎯 최종 결론

### ✅ 안전하게 제거 가능

**이유**:

1. ✅ MCP 도구 의존성 없음
2. ✅ 실제 기능은 Bash wrapper scripts가 담당
3. ✅ Orchestrator는 유지됨
4. ✅ 깨지는 기능 없음
5. ⚠️ 문서 정합성만 수동 업데이트 필요

### 📋 수정 파일 목록 (5개)

1. `config/ai/registry.yaml` (6개 에이전트 + 1개 workflow 참조 + GCP 우선순위)
2. `CLAUDE.md` (1개 카운트)
3. `docs/ai/subagents-complete-guide.md` (4개 카운트)
4. `logs/ai-decisions/2025-10-19-subagent-registry-cleanup.md` (신규 생성)
5. 이 파일: `logs/ai-decisions/2025-10-19-subagent-registry-cleanup-side-effects.md` (신규 생성)

### 🚀 실행 준비 완료

**다음 단계**: Todo Task 6 (Registry cleanup 실행)

**예상 소요 시간**: 10분 (파일 수정 + 검증)

---

**핵심**: "Think hard 사이드 이펙트 점검" 완료 → 안전하게 진행 가능!
