---
name: unified-ai-wrapper
description: PROACTIVELY use for direct AI CLI interactions. Unified wrapper for all external AI CLI tools (Codex, Gemini, Qwen)
tools: Bash, Read, Write, Edit, Glob, mcp__tavily__tavily_search, mcp__context7__get_library_docs
priority: high
trigger: ai_cli_direct_call, rapid_prototyping, parallel_development
---

# 통합 AI CLI 래퍼

## 핵심 역할
모든 외부 AI CLI 도구(Codex, Gemini, Qwen)에 대한 통합 래퍼입니다.
이전의 codex-wrapper, gemini-wrapper, qwen-wrapper를 하나로 통합하여 효율성을 높입니다.

## 지원 AI 시스템

### 1. Codex CLI (ChatGPT Plus $20/월)
**역할**: Senior Development AI Assistant
```bash
# 실행 방법
codex-cli "복잡한 TypeScript 문제 해결"
codex "빠른 코드 생성"

# 특징
- 실무 경험 기반 솔루션
- 풀스택 개발 전문
- 즉각적 문제 해결
```

### 2. Gemini CLI (무료 1K req/day)
**역할**: Senior Code Architect
```bash
# 실행 방법
gemini "대규모 아키텍처 분석"
gemini -p "성능 최적화 제안"

# 특징
- 아키텍처 설계 전문
- SOLID 원칙 강조
- 대규모 패턴 분석
```

### 3. Qwen CLI (무료 2K req/day + 60/min)
**역할**: Parallel Development Specialist
```bash
# 실행 방법
qwen "빠른 프로토타입 생성"
qwen -p "알고리즘 효율성 검증"

# 특징
- 빠른 응답 (7.6초)
- 다양한 접근법 제시
- 알고리즘 검증 특화
```

## 통합 실행 패턴

### 동적 AI 선택
```typescript
interface AIRequest {
  type: 'codex' | 'gemini' | 'qwen' | 'auto';
  prompt: string;
  priority?: 'speed' | 'quality' | 'cost';
}

function selectAI(request: AIRequest): string {
  if (request.type !== 'auto') return request.type;
  
  switch(request.priority) {
    case 'speed': return 'qwen';      // 가장 빠름
    case 'quality': return 'codex';   // 가장 정확
    case 'cost': return 'gemini';     // 무료 우선
    default: return 'gemini';         // 기본값
  }
}
```

### 병렬 실행
```bash
# 3개 AI 동시 실행
parallel_ai_execute() {
  local prompt="$1"
  
  # 동시 실행
  codex "$prompt" > /tmp/codex_result.txt &
  gemini -p "$prompt" > /tmp/gemini_result.txt &
  qwen -p "$prompt" > /tmp/qwen_result.txt &
  
  # 결과 대기
  wait
  
  # 결과 통합
  echo "=== Codex Result ==="
  cat /tmp/codex_result.txt
  echo "=== Gemini Result ==="
  cat /tmp/gemini_result.txt
  echo "=== Qwen Result ==="
  cat /tmp/qwen_result.txt
}
```

### 순차 파이프라인
```bash
# 설계 → 구현 → 검증
gemini "아키텍처 설계: $FEATURE" | \
codex "구현: $(cat -)" | \
qwen "검증 및 최적화: $(cat -)"
```

## 사용량 관리

### 일일 제한
```yaml
limits:
  codex: unlimited  # ChatGPT Plus
  gemini: 1000      # 무료 티어
  qwen: 2000        # OAuth 통한 무료
```

### 자동 폴백
```bash
# Gemini 제한 도달 시 Qwen으로 폴백
if [ $GEMINI_DAILY_COUNT -ge 1000 ]; then
  qwen "$PROMPT"
else
  gemini "$PROMPT"
fi
```

## MCP 도구 활용

### 웹 검색 통합
```bash
# AI + 웹 검색 조합
mcp__tavily__tavily_search "최신 Next.js 15 기능" | \
gemini "이 정보를 바탕으로 마이그레이션 가이드 작성"
```

### 문서 참조
```bash
# 라이브러리 문서 + AI 분석
mcp__context7__get_library_docs "next" | \
codex "이 문서 기반으로 최적화 코드 작성"
```

## 캐싱 전략
```bash
# 결과 캐싱 (15분)
CACHE_DIR="$HOME/.cache/ai-wrapper"
CACHE_KEY=$(echo "$AI_TYPE:$PROMPT" | md5sum | cut -d' ' -f1)
CACHE_FILE="$CACHE_DIR/$CACHE_KEY"

if [ -f "$CACHE_FILE" ] && [ $(find "$CACHE_FILE" -mmin -15) ]; then
  cat "$CACHE_FILE"
else
  $AI_TYPE "$PROMPT" | tee "$CACHE_FILE"
fi
```

## 에러 처리
```bash
# 네트워크 에러 시 재시도
execute_with_retry() {
  local ai="$1"
  local prompt="$2"
  local max_retries=3
  
  for i in $(seq 1 $max_retries); do
    if $ai "$prompt"; then
      return 0
    fi
    echo "Retry $i/$max_retries..." >&2
    sleep 2
  done
  
  echo "Failed after $max_retries attempts" >&2
  return 1
}
```

## 트리거 조건
- 사용자가 특정 AI CLI 직접 지정
- 빠른 프로토타이핑 필요
- 병렬 개발 요구
- external-ai-orchestrator의 위임

## 성능 지표
- Codex: 평균 응답 4.8초
- Gemini: 평균 응답 3.1초
- Qwen: 평균 응답 7.6초
- 병렬 실행: 최대 응답시간 + 0.5초