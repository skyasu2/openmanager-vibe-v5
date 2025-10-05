# AI 교차검증 방식 B 적용 사이드 이펙트 분석

## 📋 영향받는 파일 목록

### 1. CLAUDE.md (5개 라인 수정 필요)
- **라인 769**: `Task ai-cross-verification-specialist` → 실제 사용법으로 변경
- **라인 774**: bash 스크립트 호출 → deprecated 표시
- **라인 781**: `Task ai-cross-verification-specialist` → 실제 사용법으로 변경
- **라인 835**: improved-ai-cross-validation.sh 참조 → 삭제
- **라인 841**: improved-ai-cross-validation.sh 참조 → 삭제

### 2. scripts/ai-verification/improved-ai-cross-validation.sh
**결정**: Deprecated 표시 후 유지 (삭제 안 함)
**이유**: 
- 히스토리 참조용
- 일부 사용자가 직접 bash 실행 선호 가능
- 향후 bash 전용 스크립트 필요 시 참고용

**조치**: 
- 파일 맨 위에 "# DEPRECATED - Use Claude Task tool instead" 추가
- README 또는 주석에 방식 B 사용 권장 안내

### 3. .claude/settings.local.json
**현재 상태**: Bash 승인 목록에 포함
```json
"Bash(./scripts/ai-verification/improved-ai-cross-validation.sh:*)"
```

**결정**: 유지 (삭제 안 함)
**이유**: deprecated 파일이지만 실행은 가능하게 유지

### 4. scripts/ai-subagents/*-wrapper.sh (3개 파일)
**현재 상태**: 
- codex-wrapper.sh - Phase 1 개선 완료 ✅
- gemini-wrapper.sh - Phase 1 개선 진행 중 (불필요)
- qwen-wrapper.sh - Phase 1 개선 예정 (불필요)

**결정**: **현재 상태 유지**
**이유**:
- 독립 실행 스크립트로 여전히 유용
- `codex src/file.ts` 직접 실행용
- improved-ai-cross-validation.sh와 **무관**
- Claude Task 도구는 codex/gemini/qwen-**specialist** 호출 (wrapper 아님!)

### 5. 서브에이전트 시스템
**현재 상태**:
- codex-specialist 존재 ✅
- gemini-specialist 존재 ✅
- qwen-specialist 존재 ✅

**결정**: 변경 없음
**이유**: 이미 완벽하게 작동 중

## ⚠️ 중요 발견: wrapper vs specialist 혼동

**잘못된 이해**:
- improved-ai-cross-validation.sh가 wrapper 스크립트를 호출
- wrapper 개선이 필요

**올바른 이해**:
- improved-ai-cross-validation.sh는 **AI CLI를 직접 호출** (codex exec, gemini -p, qwen -p)
- wrapper 스크립트는 **독립 실행용**
- Claude Task 도구는 **specialist 서브에이전트 호출** (wrapper 무관!)

```
┌─────────────────────────────────────────┐
│ 방식 A (bash 스크립트) - DEPRECATED     │
├─────────────────────────────────────────┤
│ improved-ai-cross-validation.sh         │
│   ↓                                     │
│ codex exec "..." (AI CLI 직접 호출)     │
│ gemini -p "..." (AI CLI 직접 호출)      │
│ qwen -p "..." (AI CLI 직접 호출)        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ wrapper 스크립트 (독립 실행) - 유지     │
├─────────────────────────────────────────┤
│ bash codex-wrapper.sh src/file.ts       │
│   ↓                                     │
│ codex exec "..." + 성능 로깅            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 방식 B (Claude Task) - 신규 채택       │
├─────────────────────────────────────────┤
│ Claude Code                             │
│   ↓                                     │
│ Task codex-specialist "..."             │
│ Task gemini-specialist "..."            │
│ Task qwen-specialist "..."              │
│   (서브에이전트가 내부적으로 AI CLI 호출) │
└─────────────────────────────────────────┘
```

## ✅ 최종 조치 사항

### 필수 작업
1. ✅ CLAUDE.md 업데이트 (5개 라인)
2. ✅ improved-ai-cross-validation.sh에 DEPRECATED 표시

### 불필요 작업 (취소)
1. ❌ gemini-wrapper.sh 개선 (할 필요 없음)
2. ❌ qwen-wrapper.sh 개선 (할 필요 없음)
3. ❌ wrapper 스크립트 수정 (방식 B와 무관)

## 📊 사이드 이펙트 영향도

- **CLAUDE.md**: 중간 (5개 라인 수정)
- **improved-ai-cross-validation.sh**: 낮음 (deprecated 표시만)
- **.claude/settings.local.json**: 없음 (변경 안 함)
- **wrapper 스크립트**: 없음 (독립 실행용)
- **서브에이전트**: 없음 (이미 완성)

## 🎯 결론

**사이드 이펙트 최소화** ✅
- 실제 수정 필요: CLAUDE.md만
- deprecated 표시: improved-ai-cross-validation.sh만
- 나머지는 현상 유지
