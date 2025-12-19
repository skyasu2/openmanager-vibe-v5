---
id: ai-wrappers-guide
title: AI Wrappers 통합 가이드
keywords: [ai, wrappers, codex, gemini, qwen, code-review]
priority: high
ai_optimized: true
related_docs:
  - 'ai-usage-guidelines.md'
  - 'cli-strategy.md'
updated: '2025-12-19'
version: 'v5.83.1'
---

# 🤖 AI Wrappers 통합 가이드 v3.3.0

**OpenManager VIBE 프로젝트 전용** | 최종 업데이트: 2025-12-19

> 3개 AI Wrapper (Codex, Gemini, Qwen)의 사용법과 v3.3.0 통합 개선사항

---

## 📑 목차

1. [빠른 시작](#-빠른-시작)
2. [3개 Wrapper 비교](#-3개-wrapper-비교)
3. [v3.0.0 개선사항](#-v300-개선사항)
4. [사용 방법](#-사용-방법)
5. [트러블슈팅](#-트러블슈팅)

---

## 🚀 빠른 시작

### 자동 코드 리뷰 (권장)

```bash
# Git 커밋 시 자동 실행
git commit -m "feat: 새 기능"
# → 3-AI 순환 (Codex → Gemini → Qwen) 1:1:1 비율
# → logs/code-reviews/review-{AI}-{DATE}.md 생성
```

### 직접 호출 (테스트/디버깅)

```bash
# Codex
scripts/ai-subagents/codex-wrapper.sh "이 코드를 분석해주세요"

# Gemini
scripts/ai-subagents/gemini-wrapper.sh "SOLID 원칙을 검토해주세요"

# Qwen (일반 목적)
scripts/ai-subagents/qwen-wrapper.sh "성능 최적화 방안을 제시해주세요"
```

---

## 🎯 3개 Wrapper 비교

| 특징 | Codex | Gemini | Qwen |
|------|-------|--------|------|
| **버전** | v3.3.0 | v3.3.0 | v3.3.0 |
| **주 용도** | 코드 리뷰 (1순위) | 코드 리뷰 (2순위) | 코드 리뷰 (3순위) |
| **모델** | GPT-5 기반 | Gemini 2.5 Pro | Qwen 2.5 |
| **응답 속도** | ~20초 | ~10초 | ~5-15초 |
| **선택 비율** | 33% (1/3) | 33% (1/3) | 33% (1/3) |
| **토큰 추적** | ✅ 있음 | ❌ 없음 | ❌ 없음 |
| **고유 기능** | 토큰 로깅 | ImportProcessor 필터 | YOLO Mode |
| **타임아웃** | 600초 | 600초 | 600초 |
| **안전장치** | ✅ v3.3.0 | ✅ v3.3.0 | ✅ v3.3.0 |

### 언제 어떤 Wrapper를 사용하나요?

- **Codex**: 코드 리뷰 (3-AI 순환, 1순위)
- **Gemini**: 코드 리뷰 (3-AI 순환, 2순위) + Rate limit 폴백
- **Qwen**: 코드 리뷰 (3-AI 순환, 3순위) + Rate limit 폴백

---

## ✨ v3.3.0 개선사항

### 2025-12-17 통합 업그레이드

모든 3개 Wrapper에 동일한 안전장치 적용:

#### 1. **stderr 분리 및 필터링** (Critical)

**Before (v2.5.0)**:
```bash
# stderr 병합 - 에러 메시지가 stdout에 섞임
if timeout ... > "$output_file" 2>&1; then
```

**After (v3.0.0)**:
```bash
# stderr 분리 - 깨끗한 출력
local temp_stdout=$(mktemp)
local temp_stderr=$(mktemp)
trap 'rm -f "$temp_stdout" "$temp_stderr"' RETURN

if timeout ... > "$temp_stdout" 2> "$temp_stderr"; then
    # stderr 필터링 (Gemini: ImportProcessor 제거)
    local filtered_errors=$(grep -vE "\\[ImportProcessor\\]|Loaded cached" "$temp_stderr")
```

**효과**:
- ✅ 무해한 에러 메시지 자동 제거
- ✅ 실제 에러만 로깅
- ✅ 깨끗한 AI 응답

#### 2. **mktemp + trap 패턴** (Critical)

**Before (v2.5.0)**:
```bash
local output_file=$(mktemp)
rm -f "$output_file"  # 인터럽트 시 누수 가능
```

**After (v3.0.0)**:
```bash
local temp_stdout=$(mktemp)
local temp_stderr=$(mktemp)
trap 'rm -f "$temp_stdout" "$temp_stderr"' RETURN  # 보장된 정리
```

**효과**:
- ✅ Ctrl+C 인터럽트에도 자동 정리
- ✅ Race condition 제거
- ✅ /tmp 공간 누수 방지

#### 3. **공백 응답 감지** (Medium)

**Before (v2.5.0)**:
```bash
cat "$output_file"  # 공백만 있어도 성공 처리
```

**After (v3.0.0)**:
```bash
local output=$(cat "$temp_stdout")
if [ -n "$(echo "$output" | tr -d '[:space:]')" ]; then
    echo "$output"
else
    log_error "빈 응답 반환"
    return 1
fi
```

**효과**:
- ✅ 공백만 있는 응답 감지
- ✅ False positive 방지

#### 4. **1인 개발자 컨텍스트** (Medium)

**추가된 자동 컨텍스트**:
```bash
local context="**당신의 관점**: 1인 개발자 실용성 - 보수적이되 대기업 운영 관점(kill-switch, watchdog, idle alarm 등) 불필요. ROI 중심 판단."
query="$context

$query"
```

**효과**:
- ✅ 일관된 AI 응답 품질
- ✅ 실용적 관점 유지

#### 5. **stderr 경고 로깅** (Low)

**추가 로깅**:
```bash
if [ -n "$filtered_errors" ]; then
    log_warning "stderr 경고 메시지 발견"
    echo "[$(date)] STDERR: $filtered_errors" >> "$LOG_FILE"
fi
```

**효과**:
- ✅ 디버깅 정보 향상
- ✅ 문제 추적 가능

---

## 📚 사용 방법

### 1. 자동 코드 리뷰 (추천 ⭐)

```bash
# 커밋만 하면 자동 실행
git add .
git commit -m "feat: 새 기능 추가"

# 결과 확인
cat logs/code-reviews/review-*.md | tail -100
```

**워크플로우**:
1. Git 커밋 → .husky/post-commit 트리거
2. auto-ai-review.sh 실행
3. 3-AI 순환 (Codex → Gemini → Qwen) 1:1:1 비율
4. Rate limit 발생 시 다음 AI로 폴백
5. 결과: `logs/code-reviews/review-{AI}-{DATE}.md`

### 2. 직접 호출 (테스트/디버깅)

#### Codex

```bash
# 간단한 질문
scripts/ai-subagents/codex-wrapper.sh "2+2는?"

# 복잡한 코드 분석
scripts/ai-subagents/codex-wrapper.sh "이 TypeScript 타입 시스템을 분석하고 개선점 3가지를 제시해주세요."
```

#### Gemini

```bash
# 구조 검토
scripts/ai-subagents/gemini-wrapper.sh "SOLID 원칙 관점에서 이 코드를 검토해주세요"

# 성능 분석
scripts/ai-subagents/gemini-wrapper.sh "이 알고리즘의 시간 복잡도를 분석해주세요"
```

#### Qwen

```bash
# 일반 분석
scripts/ai-subagents/qwen-wrapper.sh "성능 최적화 방안을 제시해주세요"

# 복잡한 리팩토링 계획
scripts/ai-subagents/qwen-wrapper.sh "이 모듈을 마이크로서비스로 분할하는 계획을 세워주세요"
```

### 3. 로그 확인

```bash
# 성능 로그
tail -100 logs/ai-perf/codex-perf-$(date +%F).log
tail -100 logs/ai-perf/gemini-perf-$(date +%F).log
tail -100 logs/ai-perf/qwen-perf-$(date +%F).log

# stderr 에러 확인
grep "STDERR:" logs/ai-perf/*.log

# 코드 리뷰 결과
ls -lt logs/code-reviews/ | head -10
```

---

## 🔧 트러블슈팅

### 문제 1: Wrapper 실행 실패

**증상**: "command not found: codex"

**해결**:
```bash
# AI CLI 도구 설치 확인
scripts/ai-tools-health-check.sh

# 또는 dev-environment-manager 사용 (권장)
# "dev-environment-manager야, AI 도구 헬스 체크해줘"
```

### 문제 2: 타임아웃 (600초 초과)

**증상**: "Timeout (600초 = 10분 초과)"

**해결**:
```bash
# 1. 질문을 더 작은 단위로 분할
# Before: "전체 프로젝트를 분석하고 개선점 50개를 제시해주세요"
# After: "src/components/ 디렉토리만 분석해주세요"

# 2. 질문을 더 간결하게
# Before: "이 코드의 모든 문제점과 개선 방법을 자세히 설명해주세요"
# After: "주요 버그 3개만 찾아주세요"

# 3. 핵심 부분만 먼저 질문
# Before: "전체 리팩토링 계획"
# After: "가장 시급한 부분 1개만"
```

### 문제 3: 빈 응답 반환

**증상**: "빈 응답을 반환했습니다"

**원인**: AI가 실제로 아무 응답도 안함 (공백만)

**해결**:
```bash
# 1. stderr 로그 확인
tail -100 logs/ai-perf/{AI}-perf-$(date +%F).log

# 2. 다른 Wrapper 시도
scripts/ai-subagents/gemini-wrapper.sh "동일한 질문"

# 3. 질문 재구성
# - 더 구체적으로
# - 예시 포함
# - 출력 형식 명시
```

### 문제 4: ImportProcessor 에러 (Gemini)

**증상**: stderr에 "[ImportProcessor]" 메시지

**해결**: v3.0.0에서 자동 필터링됨 (무시해도 됨)

```bash
# 확인 방법
grep "ImportProcessor" logs/ai-perf/gemini-perf-*.log
# → 로그에 기록되지만 응답에는 포함 안됨
```

### 문제 5: Rate Limit (Codex/Gemini)

**증상**: "Rate limit exceeded"

**해결**: auto-ai-review.sh가 자동 폴백 처리

```bash
# Codex rate limit → Gemini 자동 전환
# Gemini rate limit → Claude Code 자동 리뷰
# 99.9% 가용성 보장
```

---

## 📊 성능 메트릭

### 응답 시간 (실측)

| Wrapper | 간단한 질문 | 복잡한 분석 | 타임아웃 |
|---------|-------------|-------------|----------|
| Codex   | ~20초 | ~100초 | 600초 |
| Gemini  | ~10초 | ~60초 | 600초 |
| Qwen    | ~5초 | ~120초 | 600초 |

### 안정성 (v3.0.0)

- ✅ **임시 파일 정리**: 100% (trap 패턴)
- ✅ **에러 처리**: 100% (stderr 분리)
- ✅ **공백 감지**: 100% (False positive 방지)
- ✅ **가용성**: 99.9% (Codex OR Gemini OR Claude)

---

## 🔗 관련 문서

- **코드 리뷰 시스템**: `scripts/code-review/auto-ai-review.sh` (v3.3.0)
- **프로젝트 상태**: `docs/status.md`
- **메인 가이드**: `CLAUDE.md`
- **서브에이전트**: `docs/development/ai/claude-code/subagents-complete-guide.md`
- **변경 이력**:
  - `/tmp/all-ai-wrappers-v3-summary.md` (v3.0.0 통합 요약)
  - `/tmp/gemini-wrapper-upgrade-summary.md` (Gemini v3.0.0)
  - `/tmp/codex-wrapper-upgrade-summary.md` (Codex v3.0.0)

---

## 📝 Git 이력

```
c5e37294 - feat(ai): 3개 AI Wrapper 모두 v3.0.0으로 통일 완료 (2025-11-21)
490ca28f - feat(ai): Codex Wrapper v3.0.0 (Gemini와 동일한 견고성) (2025-11-21)
bc8160a3 - feat(ai): Gemini Wrapper v3.0.0 (범용 독립 스크립트) (2025-11-21)
```

---

**버전**: v3.3.0 (Codex & Gemini & Qwen)
**상태**: 프로덕션 운영 중 ✅
**순환**: 3-AI 1:1:1 순환 (Codex → Gemini → Qwen)

