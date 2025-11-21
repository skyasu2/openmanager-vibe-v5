# 🤖 AI 협업 아키텍처 설계

**프로젝트**: OpenManager VIBE v5.80.0  
**최종 수정**: 2025-11-21  
**상태**: Phase 1 완료 ✅

---

## 📊 시스템 개요

Claude Code와 외부 AI CLI 도구(Codex, Gemini)가 효율적으로 협업하기 위한 하이브리드 아키텍처.

### 참여 AI (3개)

| AI | 역할 | 호출 방법 | 응답 시간 |
|---|---|---|---|
| **Codex** | 실무 검증 전문가 | CLI (`codex exec`) | ~8초 |
| **Gemini** | 독립적 분석 전문가 | CLI (`gemini --model gemini-2.5-pro`) | ~10초 |
| **Claude Code** | 프로젝트 컨텍스트 보유 | 내장 서브에이전트 | 즉시 |

**Qwen**: 성능 이슈로 제외. 필요 시 수동 요청으로만 사용.

---

## 🏗️ 아키텍처 패턴

### 1. 중앙 분배기 (AI Task Dispatcher)

**현재 구현**: `scripts/code-review/auto-ai-review.sh` (v3.2.0)

```
Claude Code
    ↓
auto-ai-review.sh (Dispatcher)
    ├─→ Codex CLI (Primary/Secondary)
    ├─→ Gemini CLI (Primary/Secondary)
    └─→ Claude Code (Final Fallback)
```

**역할**:
- 2:1 비율 선택 (Codex 2회, Gemini 1회)
- 3단계 폴백 (Primary → Secondary → Claude Code)
- 결과 파일 생성 (`logs/code-reviews/`)

### 2. 하이브리드 통신 방식

#### A. 비동기 (코드 리뷰)

**목표**: Git 커밋 시 자동 리뷰, 60초 이내 완료

```bash
# .husky/post-commit
auto-ai-review.sh (백그라운드) → 마크다운 파일 생성 → Claude 읽음
```

**특징**:
- 파일 기반 (JSON-RPC 스타일)
- Git hook 자동 트리거
- 사용자는 즉시 기다릴 필요 없음

#### B. 동기 (실시간 검증)

**목표**: 디버깅, 빠른 질의, 10초 이내 응답

```bash
# Claude Code에서 직접 호출
echo "$query" | gemini --model gemini-2.5-pro > response.txt
codex exec "$query" > response.txt
```

**특징**:
- stdout/stdin 파이프라인
- JSON over stdio (구조화 가능)
- 즉시 응답 대기

---

## 🔧 구현 상세

### Phase 1: 근본 원인 해결 (완료 ✅)

**문제**: Gemini ImportProcessor 에러로 90% 실패율

**해결**:
1. **Option 1**: 직접 CLI 호출 + stderr 필터링 (`auto-ai-review.sh:306-316`)
2. **Option 3**: GEMINI.md 헤더 수정 (Blockquote/Bold 제거)

**결과**:
```bash
# 수정 전
[ERROR] [ImportProcessor] Could not find child token...

# 수정 후
✅ ImportProcessor 에러 0개
✅ Gemini 응답 성공률 99%+
```

### Phase 2: 확장 인터페이스 (선택적)

현재 `auto-ai-review.sh`가 이미 Dispatcher 역할을 수행 중이므로, 추가 확장이 필요한 경우에만 다음을 고려:

**옵션 A**: 현재 구조 유지 (권장)
- `auto-ai-review.sh`: 비동기 코드 리뷰 전용
- Claude Code: 동기 호출 시 직접 CLI 실행

**옵션 B**: 통합 Dispatcher 구현
```bash
scripts/ai-dispatcher.sh "$REQUEST_JSON"
├── type: "async" → auto-ai-review.sh 호출
└── type: "sync" → CLI 직접 실행
```

---

## 📈 성능 지표

### 현재 성과 (2025-11-21)

| 지표 | 값 | 목표 |
|------|---|------|
| **가용성** | 99.9% | 99.9% ✅ |
| **평균 응답 시간** | ~10초 | <60초 ✅ |
| **Gemini 성공률** | 99%+ | >90% ✅ |
| **stderr 에러** | 0개 | 0개 ✅ |

### 레거시 대비 개선

```
레거시 3-AI 시스템 (v4.2.0)
- 평균 45초, 복잡도 높음, deprecated

현재 시스템 (v3.2.0)
- 평균 10초, 4.5배 빠름, 단순함
```

---

## 🚀 사용 가이드

### 자동 코드 리뷰 (비동기)

```bash
# Git 커밋 시 자동 실행 (.husky/post-commit)
git commit -m "feat: 새 기능 추가"
# → auto-ai-review.sh 백그라운드 실행
# → logs/code-reviews/review-{AI}-YYYY-MM-DD-HH-MM-SS.md 생성
```

### 수동 검증 (동기)

```bash
# Codex 직접 호출
codex exec "이 함수에 버그가 있나요?"

# Gemini 직접 호출
echo "TypeScript 타입 안전성 검증해줘" | gemini --model gemini-2.5-pro

# Claude Code 서브에이전트
"code-review-specialist: 전체 코드 품질 검토해줘"
```

---

## 🔍 트러블슈팅

### Gemini 실패 시

```bash
# 1. GEMINI.md 상태 확인
head -n 5 GEMINI.md
# 예상: Blockquote/Bold 없는 일반 텍스트

# 2. 직접 테스트
echo "1+1은?" | gemini --model gemini-2.5-pro 2>&1

# 3. stderr 확인
# ImportProcessor 에러 있으면 → GEMINI.md 다시 수정
```

### Codex 실패 시

```bash
# 버전 확인
codex --version  # v0.58.0 이상

# API 키 확인
codex config check
```

---

## 📚 관련 문서

- **[auto-ai-review.sh](../../scripts/code-review/auto-ai-review.sh)** - 현재 Dispatcher 구현
- **[GEMINI.md](../../GEMINI.md)** - Gemini 시스템 프롬프트
- **[CLAUDE.md](../../CLAUDE.md)** - 프로젝트 메인 가이드
- **[subagents-complete-guide.md](./subagents-complete-guide.md)** - 서브에이전트 활용

---

## 🎯 향후 계획

### 완료됨 ✅
- Phase 1: 근본 원인 해결 (GEMINI.md + 직접 호출)
- 99.9% 가용성 달성
- Gemini와 협업 아키텍처 토론 완료

### 보류 (필요 시)
- Phase 2: 통합 Dispatcher (`ai-dispatcher.sh`) 구현
- JSON 구조화 고도화
- 성능 모니터링 대시보드

### 제외
- ❌ Qwen 통합 (성능 이슈, 수동 요청으로만 사용)

---

**결론**: 현재 시스템은 이미 Gemini가 제안한 "AI Task Dispatcher" 패턴을 `auto-ai-review.sh`로 구현하고 있으며, Phase 1 완료로 프로덕션 사용 가능.
