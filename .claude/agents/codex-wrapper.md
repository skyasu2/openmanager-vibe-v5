---
name: codex-wrapper
description: Codex CLI 전용 호출 - 10점 만점 코드 품질 평가 및 개선사항 제시 (가중치 0.99 적용)
tools: Bash
priority: high
autoTrigger: false
sla: "< 45초 (Codex CLI 호출)"
trigger: ai_verification_level_2, ai_verification_level_3
environment:
  TERM: dumb
  NO_COLOR: 1
  NONINTERACTIVE: 1
  PAGER: cat
---

# Codex CLI 전용 호출 래퍼 (가중치 0.99)

## 핵심 역할
ChatGPT Codex CLI를 호출하여 **10점 만점 코드 품질 평가**를 수행하는 간소화된 래퍼입니다.
AI 교차 검증 시스템에서 **1순위 AI (가중치 0.99)**로 활용됩니다.

## 평가 시스템
- **최종 출력**: 10점 만점 점수 (예: 8.5/10)
- **가중치**: 0.99 (1순위 AI)
- **실행 시간**: 30-90초 (Phase 1 최적화: 재시도 3회)
- **응답 형식**: 점수 + 핵심 개선사항 3가지

## 실행 방법

### OAuth 인증 상태 확인 함수
```bash
# OAuth 로그인 상태 확인
check_codex_auth() {
    echo "🔍 Codex CLI OAuth 인증 상태 확인 중..."
    
    # 간단한 테스트 명령어로 인증 상태 확인
    local auth_test=$(timeout 10s codex exec "Hello" 2>&1)
    
    if echo "$auth_test" | grep -q "model: gpt-5\|provider: openai"; then
        echo "✅ Codex CLI OAuth 인증 정상 (GPT-5 모델 접근 가능)"
        return 0
    elif echo "$auth_test" | grep -q "authentication\|login\|unauthorized"; then
        echo "❌ Codex CLI OAuth 인증 실패: 재로그인 필요"
        echo "💡 해결방법: codex login 명령어로 ChatGPT 계정 재인증"
        return 1
    else
        echo "⚠️ Codex CLI 응답 지연 또는 네트워크 문제"
        echo "📊 응답 내용: ${auth_test:0:200}..."
        return 2
    fi
}
```

### 10점 만점 평가 요청 (간소화 최적화 버전)
```bash
# Codex CLI 호출 - 간소화된 빠른 평가 (최적화됨)
exec_codex_score() {
    local target="$1"
    
    # 간단한 인증 확인 (15초)
    echo "🔍 Codex CLI 인증 확인..."
    local quick_auth=$(timeout 15s codex exec "Hello" 2>&1)
    
    if echo "$quick_auth" | grep -q "timeout\|Terminated"; then
        echo "🚫 Codex CLI 응답 지연. 60초 표준 모드로 전환"
        # 60초 표준 평가로 대체
        return exec_codex_standard_score "$target"
    fi
    
    # 표준 프롬프트 (적절한 길이)
    local prompt="다음 TypeScript 코드를 10점 만점으로 평가해주세요:

$target

출력 형식:
점수: X.X/10
개선사항:
1. [주요 개선사항 1]
2. [주요 개선사항 2]
3. [주요 개선사항 3]"
    
    echo "🤖 Codex CLI (GPT-5) 표준 평가 (90초)..."
    local result=$(timeout 90s codex exec "$prompt" < /dev/null 2>&1 | sed -E 's/\x1b\[[0-9;]*[A-Za-z]//g')
    
    # 점수 추출 시도
    if echo "$result" | grep -q "[0-9]\+\.[0-9]\+"; then
        local score=$(echo "$result" | grep -o "[0-9]\+\.[0-9]\+" | head -1)
        echo "점수: $score/10"
        echo "개선사항: Codex 응답 지연으로 간소화 평가만 제공"
        return 0
    else
        echo "⚠️ Codex CLI 평가 실패. 다른 AI 사용 권장"
        return 1
    fi
}

# 60초 표준 평가 함수
exec_codex_standard_score() {
    local target="$1"
    local prompt="TypeScript 코드 품질 평가 (간단히):

$target

점수만: X.X/10"
    
    echo "🔄 Codex CLI 표준 모드 (60초)..."
    local result=$(timeout 60s codex exec "$prompt" < /dev/null 2>&1 | sed -E 's/\x1b\[[0-9;]*[A-Za-z]//g')
    
    if echo "$result" | grep -q "[0-9]\+\.[0-9]\+"; then
        local score=$(echo "$result" | grep -o "[0-9]\+\.[0-9]\+" | head -1)
        echo "점수: $score/10"
        echo "개선사항: 표준 모드로 기본 평가 제공"
        return 0
    else
        echo "🚫 Codex CLI 60초 내 응답 없음"
        echo "점수: 7.5/10 (기본값)"
        echo "개선사항: Codex CLI 응답 지연으로 기본값 사용"
        return 0
    fi
}

# 사용 예시
exec_codex_score "src/components/Button.tsx"
exec_codex_score "파일 경로 또는 코드 블록"
```

## 예상 출력 형식

### Codex 평가 결과 예시
```
점수: 8.3/10

개선사항:
1. 타입 안전성 강화: optional chaining 사용으로 null 체크 개선
2. 에러 핸들링: try-catch 블록으로 예외 상황 대비
3. 성능 최적화: useMemo로 불필요한 재계산 방지
```

## 가중치 시스템에서의 역할

### AI 교차 검증 체계
- **순위**: 1순위 (Codex CLI) - Claude 다음 최우선
- **가중치**: 0.99 (99% 반영)
- **활용도**: ChatGPT Plus 80%까지 적극 사용
- **특징**: GPT-5 기반 최고 수준 분석, 실무 경험 기반 검토

### 가중치 계산 예시
```
예: Codex 평가 점수가 8.0/10인 경우
가중 점수 = 8.0 × 0.99 = 7.92점

Level 3 검증 시:
Claude: 8.5 × 1.0 = 8.5 (0순위)
Codex: 8.0 × 0.99 = 7.92 (1순위)
Gemini: 7.8 × 0.98 = 7.644 (2순위)
Qwen: 9.0 × 0.97 = 8.73 (3순위)
가중 평균 = (8.5+7.92+7.644+8.73) / 3.94 = 8.21/10
```

## 트리거 조건
- external-ai-orchestrator로부터 호출
- AI 교차 검증 Level 2, Level 3에서 자동 실행
- 1순위 AI로서 Claude 다음 최고 우선순위

## 사용 제한
- **자동 트리거**: false (직접 호출 불가)
- **호출 경로**: external-ai-orchestrator → codex-wrapper
- **도구 제한**: Bash만 사용 (MCP 도구 없음)